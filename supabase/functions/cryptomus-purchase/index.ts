import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "https://esm.sh/md5@2.3.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CRYPTOMUS_API = "https://api.cryptomus.com/v1";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function generateCryptomusSignature(payload: any, paymentKey: string) {
  const jsonStr = JSON.stringify(payload);
  const base64Body = base64Encode(new TextEncoder().encode(jsonStr));
  return md5(base64Body + paymentKey);
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
    const { action, amount, coins } = body;

    if (action !== "create-payment") {
      return json({ error: "Unsupported action" }, 400);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return json({ error: "Missing Authorization" }, 401);
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return json({ error: `Invalid Token: ${authError?.message}` }, 401);
    }

    const { data: settingsData } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "premium_general")
      .single();

    const merchantId = settingsData?.value?.payment_cryptomus_merchant_id;
    const paymentKey = settingsData?.value?.payment_cryptomus_payment_key;

    if (!merchantId || !paymentKey) {
      return json({ error: "Cryptomus configuration missing." }, 400);
    }

    const orderId = `${user.id}_coin_${coins}_${Date.now()}`;
    const webhookUrl = `${supabaseUrl}/functions/v1/cryptomus-webhook`;

    const reqBody = {
      amount: Number(amount).toFixed(2).toString(),
      currency: "USD",
      order_id: orderId,
      network: "BSC",
      to_currency: "USDT",
      url_callback: webhookUrl,
      url_return: "http://localhost:5173/coin-shop?status=success",
      is_payment_multiple: false,
      lifetime: "3600",
    };

    const signature = generateCryptomusSignature(reqBody, paymentKey);

    const paymentRes = await fetch(`${CRYPTOMUS_API}/payment`, {
      method: "POST",
      headers: {
        "merchant": merchantId,
        "sign": signature,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reqBody),
    });
    
    const paymentData = await paymentRes.json();
    if (paymentData.state === 0 && paymentData.result) {
       return json({
          payAddress: paymentData.result.address,
          payAmount: paymentData.result.payer_amount,
          payCurrency: paymentData.result.payer_currency,
          invoiceUrl: paymentData.result.url,
          orderId: paymentData.result.order_id,
          uuid: paymentData.result.uuid,
          network: paymentData.result.network
       });
    }

    return json({ error: "Failed to create Cryptomus payment", details: paymentData }, 400);

  } catch (err) {
    console.error("Function error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

