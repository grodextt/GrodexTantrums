import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getPayPalCredentials(supabase: any) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();
  const s = data?.value as any;
  return {
    clientId: s?.payment_paypal_client_id,
    clientSecret: s?.payment_paypal_secret,
    isSandbox: s?.payment_paypal_sandbox ?? false,
    merchantId: s?.payment_paypal_merchant_id || "",
  };
}

async function getAccessToken(clientId: string, clientSecret: string, base: string) {
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const data = await res.json();
  return data.access_token as string | undefined;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const { action } = body;

    // Return client ID (publishable) - ALLOW ANONYMOUS
    if (action === "get-client-id") {
      const { clientId } = await getPayPalCredentials(supabase);
      if (!clientId) return json({ error: "PayPal not configured" }, 400);
      return json({ clientId });
    }

    // Authenticate user for all other actions
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { clientId, clientSecret, isSandbox, merchantId } = await getPayPalCredentials(supabase);
    if (!clientId || !clientSecret) {
      return json({ error: "PayPal not configured. Add credentials in Admin Panel → Premium Content." }, 400);
    }

    const paypalBase = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const accessToken = await getAccessToken(clientId, clientSecret, paypalBase);
    if (!accessToken) return json({ error: "Failed to authenticate with PayPal" }, 500);

    // ── CREATE ORDER ──
    if (action === "create-order") {
      const { amount, coins } = body;
      const usdAmount = parseFloat(amount);

      if (!usdAmount || isNaN(usdAmount) || !coins || coins <= 0) {
        return json({ error: "Invalid package", received: { amount, coins } }, 400);
      }

      // Indian PayPal merchants receive USD (auto-converted to INR by PayPal)
      // Do NOT set payee.merchant_id — it causes UNSUPPORTED_PAYEE_CURRENCY
      const usdValue = usdAmount.toFixed(2);

      const purchaseUnit: any = {
        amount: { currency_code: "USD", value: usdValue },
        custom_id: `${user.id}_${coins}`,
      };

      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [purchaseUnit],
          application_context: {
            brand_name: "Grodex Tantrums",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
          },
        }),
      });
      const orderData = await orderRes.json();

      if (orderData.id) {
        return json({ orderId: orderData.id });
      }
      return json({ error: "Failed to create PayPal order", details: orderData }, 500);
    }

    // ── CAPTURE ORDER ──
    if (action === "capture-order") {
      const { orderId } = body;
      if (!orderId) return json({ error: "Missing orderId" }, 400);

      // Idempotency check
      const processKey = `paypal_order_${orderId}`;
      const { data: existing } = await supabase
        .from("site_settings")
        .select("key")
        .eq("key", processKey)
        .single();
      if (existing) {
        return json({ success: true, already_processed: true });
      }

      const captureRes = await fetch(`${paypalBase}/v2/checkout/orders/${orderId}/capture`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });
      const captureData = await captureRes.json();

      if (captureData.status !== "COMPLETED") {
        return json({ error: "Payment not completed", status: captureData.status }, 400);
      }

      const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id;
      if (!customId) return json({ error: "Missing order metadata" }, 400);

      const [orderUserId, coinStr] = customId.split("_");
      const orderCoins = parseInt(coinStr || "0");

      if (!orderUserId || orderCoins <= 0) {
        return json({ error: "Invalid custom_id format" }, 400);
      }

      // Credit coins
      const { data: profile } = await supabase
        .from("profiles")
        .select("coin_balance")
        .eq("id", orderUserId)
        .single();

      await supabase
        .from("profiles")
        .update({ coin_balance: (profile?.coin_balance ?? 0) + orderCoins })
        .eq("id", orderUserId);

      // Mark processed
      await supabase.from("site_settings").upsert({
        key: processKey,
        value: { processed: true, coins: orderCoins, user_id: orderUserId },
        updated_at: new Date().toISOString(),
      });

      return json({ success: true, coins_added: orderCoins });
    }

    return json({ error: "Invalid action" }, 400);
  } catch (err) {
    return json({ error: err.message }, 500);
  }
});
