import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
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
    const { action, orderId, coins, amount } = body;

    // Get PayPal credentials from site_settings
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "premium_general")
      .single();

    const settings = settingsRow?.value as any;
    const clientId = settings?.payment_paypal_client_id;
    const clientSecret = settings?.payment_paypal_secret;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "PayPal not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PayPal API base URL (use live URL)
    const paypalBase = "https://api-m.paypal.com";

    // Get PayPal access token
    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with PayPal", details: tokenData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const accessToken = tokenData.access_token;

    if (action === "create-order") {
      // Create PayPal order
      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: amount.toFixed(2),
              },
              description: `${coins} coins purchase`,
            },
          ],
        }),
      });
      const orderData = await orderRes.json();
      if (orderData.id) {
        return new Response(
          JSON.stringify({ orderId: orderData.id }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to create PayPal order", details: orderData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "capture-order") {
      // Capture the order
      const captureRes = await fetch(
        `${paypalBase}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const captureData = await captureRes.json();

      if (captureData.status === "COMPLETED") {
        // Credit coins to user
        await supabase.rpc("secure_increment_tokens", {
          p_user_id: user.id,
          p_amount: 0, // We're updating coins, not tokens
        });

        // Update coin_balance directly using service role
        const { data: profile } = await supabase
          .from("profiles")
          .select("coin_balance")
          .eq("id", user.id)
          .single();

        const currentBalance = profile?.coin_balance ?? 0;
        await supabase
          .from("profiles")
          .update({ coin_balance: currentBalance + coins })
          .eq("id", user.id);

        return new Response(
          JSON.stringify({ success: true, coins_added: coins }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Payment not completed", status: captureData.status }),
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
