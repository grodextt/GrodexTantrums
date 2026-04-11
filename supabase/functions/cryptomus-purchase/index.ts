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
    const { action, amount, coins } = body;\n\n    if (action !== \"create-payment\") {\n      return json({ error: \"Unsupported action\" }, 400);\n    }\n\n    const authHeader = req.headers.get(\"Authorization\");\n    if (!authHeader) {\n      return json({ error: \"Missing Authorization\" }, 401);\n    }\n\n    const anonClient = createClient(supabaseUrl, Deno.env.get(\"SUPABASE_ANON_KEY\")!);\n    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace(\"Bearer \", \"\"));\n    if (authError || !user) {\n      return json({ error: `Invalid Token: ${authError?.message}` }, 401);\n    }\n\n    const { data: settingsData } = await supabase\n      .from(\"site_settings\")\n      .select(\"value\")\n      .eq(\"key\", \"premium_general\")\n      .single();\n\n    const merchantId = settingsData?.value?.payment_cryptomus_merchant_id;\n    const paymentKey = settingsData?.value?.payment_cryptomus_payment_key;\n\n    if (!merchantId || !paymentKey) {\n      return json({ error: \"Cryptomus configuration missing.\" }, 400);\n    }\n\n    const orderId = `${user.id}_coin_${coins}_${Date.now()}`;\n    const webhookUrl = `${supabaseUrl}/functions/v1/cryptomus-webhook`;\n\n    const reqBody = {\n      amount: Number(amount).toFixed(2).toString(),\n      currency: \"USD\",\n      order_id: orderId,\n      network: \"BSC\",\n      to_currency: \"USDT\",\n      url_callback: webhookUrl,\n      url_return: \"http://localhost:5173/coin-shop?status=success\",\n      is_payment_multiple: false,\n      lifetime: \"3600\",\n    };\n\n    const signature = generateCryptomusSignature(reqBody, paymentKey);\n\n    const paymentRes = await fetch(`${CRYPTOMUS_API}/payment`, {\n      method: \"POST\",\n      headers: {\n        \"merchant\": merchantId,\n        \"sign\": signature,\n        \"Content-Type\": \"application/json\",\n      },\n      body: JSON.stringify(reqBody),\n    });\n    \n    const paymentData = await paymentRes.json();\n    if (paymentData.state === 0 && paymentData.result) {\n       return json({\n          payAddress: paymentData.result.address,\n          payAmount: paymentData.result.payer_amount,\n          payCurrency: paymentData.result.payer_currency,\n          invoiceUrl: paymentData.result.url,\n          orderId: paymentData.result.order_id,\n          uuid: paymentData.result.uuid,\n          network: paymentData.result.network\n       });\n    }\n\n    return json({ error: \"Failed to create Cryptomus payment\", details: paymentData }, 400);\n\n  } catch (err) {\n    console.error(\"Function error:\", err);\n    return json({ error: (err as Error).message }, 500);\n  }\n});
