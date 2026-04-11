import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-nowpayments-sig, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOWPAYMENTS_API = "https://api.nowpayments.io/v1";

async function getValidCoinPackages(supabase: any): Promise<{ coins: number; price: number }[]> {
  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "coin_system")
    .single();

  const settings = settingsRow?.value as any;
  const packages = settings?.packages;

  if (packages && Array.isArray(packages) && packages.length > 0) {
    return packages.map((p: any) => ({
      coins: Number(p.coins),
      price: Number(p.price),
    }));
  }

  // Fallback if packages aren't structured correctly yet
  const baseAmount = settings?.base_amount || 50;
  const basePrice = settings?.base_price || 0.99;
  const multipliers = [1, 3, 7, 15, 32, 100];
  return multipliers.map(m => ({
    coins: Math.round(baseAmount * m),
    price: parseFloat((basePrice * m).toFixed(2)),
  }));
}

function findMatchingPackage(packages: { coins: number; price: number }[], coins: number, amount: number) {
  return packages.find(p => p.coins === Number(coins) && Math.abs(p.price - Number(amount)) < 0.01);
}

async function getNowPaymentsCredentials(supabase: any): Promise<{ apiKey: string | null; ipnSecret: string | null }> {
  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();

  const s = settingsRow?.value as any;
  return {
    apiKey: s?.payment_nowpayments_api_key || Deno.env.get("NOWPAYMENTS_API_KEY") || null,
    ipnSecret: s?.payment_nowpayments_ipn_secret || Deno.env.get("NOWPAYMENTS_IPN_SECRET") || null,
  };
}

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

    if (path === "webhook") {
      const { ipnSecret } = await getNowPaymentsCredentials(supabase);
      if (!ipnSecret) {
        console.error("NOWPayments IPN Secret not configured");
        return new Response(JSON.stringify({ error: "Webhook not configured" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }

      const body = await req.json();
      const sig = req.headers.get("x-nowpayments-sig");
      const sortedBody = Object.keys(body).sort().reduce((obj: any, key: string) => {
        obj[key] = body[key];
        return obj;
      }, {});
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey("raw", encoder.encode(ipnSecret), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
      const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(JSON.stringify(sortedBody)));
      const computedSig = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, "0")).join("");

      if (sig !== computedSig) {
        return new Response(JSON.stringify({ error: "Invalid signature" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }

      if (body.payment_status === "finished" || body.payment_status === "confirmed") {
        const orderId = body.order_id;
        if (orderId) {
          const parts = orderId.split("_");
          const userId = parts[0];
          const coins = parseInt(parts[1] || "0");

          if (userId && coins > 0) {
            const processKey = `nowpay_${body.payment_id}`;
            const { data: existing } = await supabase.from("site_settings").select("key").eq("key", processKey).single();
            if (!existing) {
              const { data: profile } = await supabase.from("profiles").select("coin_balance").eq("id", userId).single();
              await supabase.from("profiles").update({ coin_balance: (profile?.coin_balance ?? 0) + coins }).eq("id", userId);
              await supabase.from("site_settings").upsert({ key: processKey, value: { processed: true, coins, user_id: userId, payment_id: body.payment_id }, updated_at: new Date().toISOString() });
            }
          }
        }
      }
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const reqBody = await req.json();
    const { action } = reqBody;

    const { apiKey } = await getNowPaymentsCredentials(supabase);
    if (!apiKey) return new Response(JSON.stringify({ error: "NOWPayments not configured." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

    if (action === "create-payment") {
      const { coins, amount } = reqBody;
      const validPackages = await getValidCoinPackages(supabase);
      const matched = findMatchingPackage(validPackages, coins, amount);
      if (!matched) return new Response(JSON.stringify({ error: "Invalid coin package", valid_packages: validPackages }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});

      const orderId = `${user.id}_${matched.coins}_${Date.now()}`;
      const webhookUrl = `${supabaseUrl}/functions/v1/nowpayments/webhook`;

      const paymentRes = await fetch(`${NOWPAYMENTS_API}/payment`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          price_amount: matched.price,
          price_currency: "usd",
          pay_currency: "usdttrc20",
          order_id: orderId,
          order_description: `${matched.coins} coins purchase`,
          ipn_callback_url: webhookUrl,
        }),
      });

      const paymentData = await paymentRes.json();
      if (paymentData.payment_id) {
        return new Response(JSON.stringify({
          paymentId: paymentData.payment_id,
          payAddress: paymentData.pay_address,
          payAmount: paymentData.pay_amount,
          payCurrency: paymentData.pay_currency,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
      }
      return new Response(JSON.stringify({ error: "Failed to create payment", details: paymentData }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
});
