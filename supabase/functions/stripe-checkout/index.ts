import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action } = body;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "Stripe not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    if (action === "create-checkout") {
      const { coins, amount, returnUrl } = body;
      const baseUrl = returnUrl || "https://scan-zen-studio.lovable.app/coin-shop";

      // Find or create Stripe customer
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      let customerId: string;
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { supabase_user_id: user.id },
        });
        customerId = customer.id;
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${coins} Coins`,
                description: `Purchase ${coins} coins for your account`,
              },
              unit_amount: Math.round(amount * 100), // cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${baseUrl}?stripe_session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${baseUrl}?status=cancelled`,
        metadata: {
          user_id: user.id,
          coins: coins.toString(),
        },
      });

      return new Response(
        JSON.stringify({ sessionId: session.id, url: session.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "verify-session") {
      const { sessionId } = body;
      const session = await stripe.checkout.sessions.retrieve(sessionId);

      if (session.payment_status === "paid") {
        const userId = session.metadata?.user_id;
        const coins = parseInt(session.metadata?.coins || "0");

        if (!userId || coins <= 0) {
          return new Response(
            JSON.stringify({ error: "Invalid session metadata" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent double-crediting: check if we already processed this session
        const sessionKey = `stripe_session_${sessionId}`;
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", sessionKey)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ success: true, coins_added: coins, already_processed: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Credit coins
        const { data: profile } = await supabase
          .from("profiles")
          .select("coin_balance")
          .eq("id", userId)
          .single();

        const currentBalance = profile?.coin_balance ?? 0;
        await supabase
          .from("profiles")
          .update({ coin_balance: currentBalance + coins })
          .eq("id", userId);

        // Mark session as processed
        await supabase
          .from("site_settings")
          .upsert({ key: sessionKey, value: { processed: true, coins, user_id: userId }, updated_at: new Date().toISOString() });

        return new Response(
          JSON.stringify({ success: true, coins_added: coins }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Payment not completed", status: session.payment_status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
