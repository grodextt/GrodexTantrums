import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Webhook endpoint (no auth required - verified by signature)
    if (path === "webhook") {
      const body = await req.json();
      const ipnSecret = Deno.env.get("NOWPAYMENTS_IPN_SECRET");
      
      if (ipnSecret) {
        const sig = req.headers.get("x-nowpayments-sig");
        // Sort keys and create HMAC
        const sortedBody = Object.keys(body).sort().reduce((obj: any, key: string) => {
          obj[key] = body[key];
          return obj;
        }, {});
        
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          "raw",
          encoder.encode(ipnSecret),
          { name: "HMAC", hash: "SHA-512" },
          false,
          ["sign"]
        );
        const signature = await crypto.subtle.sign(
          "HMAC",
          key,
          encoder.encode(JSON.stringify(sortedBody))
        );
        const computedSig = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");

        if (sig !== computedSig) {
          return new Response(JSON.stringify({ error: "Invalid signature" }), {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Process payment
      if (body.payment_status === "finished" || body.payment_status === "confirmed") {
        const orderId = body.order_id; // format: "userId_coins_timestamp"
        if (orderId) {
          const parts = orderId.split("_");
          const userId = parts[0];
          const coins = parseInt(parts[1] || "0");

          if (userId && coins > 0) {
            // Prevent double-processing
            const processKey = `nowpay_${body.payment_id}`;
            const { data: existing } = await supabase
              .from("site_settings")
              .select("key")
              .eq("key", processKey)
              .single();

            if (!existing) {
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

              await supabase.from("site_settings").upsert({
                key: processKey,
                value: { processed: true, coins, user_id: userId, payment_id: body.payment_id },
                updated_at: new Date().toISOString(),
              });
            }
          }
        }
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticated endpoints
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

    const reqBody = await req.json();
    const { action } = reqBody;

    const apiKey = Deno.env.get("NOWPAYMENTS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "NOWPayments not configured. Add NOWPAYMENTS_API_KEY secret." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create-payment") {
      const { coins, amount } = reqBody;
      const orderId = `${user.id}_${coins}_${Date.now()}`;
      
      // Get the webhook URL
      const webhookUrl = `${supabaseUrl}/functions/v1/nowpayments/webhook`;

      const paymentRes = await fetch(`${NOWPAYMENTS_API}/payment`, {
        method: "POST",
        headers: {
          "x-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_amount: amount,
          price_currency: "usd",
          pay_currency: "usdttrc20",
          order_id: orderId,
          order_description: `${coins} coins purchase`,
          ipn_callback_url: webhookUrl,
        }),
      });

      const paymentData = await paymentRes.json();

      if (paymentData.payment_id) {
        return new Response(
          JSON.stringify({
            paymentId: paymentData.payment_id,
            payAddress: paymentData.pay_address,
            payAmount: paymentData.pay_amount,
            payCurrency: paymentData.pay_currency,
            expirationEstimate: paymentData.expiration_estimate_date,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to create payment", details: paymentData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "check-status") {
      const { paymentId } = reqBody;
      const statusRes = await fetch(`${NOWPAYMENTS_API}/payment/${paymentId}`, {
        headers: { "x-api-key": apiKey },
      });
      const statusData = await statusRes.json();

      return new Response(
        JSON.stringify({
          status: statusData.payment_status,
          payAmount: statusData.pay_amount,
          actuallyPaid: statusData.actually_paid,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
