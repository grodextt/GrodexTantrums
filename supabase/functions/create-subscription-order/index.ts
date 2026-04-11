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

async function getPaymentCredentials(supabase: any) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "subscription_settings")
    .single();
  const s = data?.value as any;
  return {
    paypalClientId: s?.sub_paypal_client_id,
    paypalClientSecret: s?.sub_paypal_secret,
    paypalIsSandbox: s?.sub_paypal_sandbox ?? false,
    cryptomusMerchantId: s?.sub_cryptomus_merchant_id,
    cryptomusPaymentKey: s?.sub_cryptomus_payment_key,
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
    const { planId, method } = body;

    if (!planId) return json({ error: "Missing planId" }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return json({ error: "Missing Authorization Header" }, 401);
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      console.error("Auth Error:", authError);
      return json({ error: `Invalid Token: ${authError?.message}` }, 401);
    }

    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan || !plan.is_active) {
      return json({ error: "Plan not found or inactive" }, 404);
    }

    const creds = await getPaymentCredentials(supabase);
    const origin = req.headers.get("origin") || "http://localhost:5173";
    const returnUrl = `${origin}/subscribe/success`;

    if (method === "paypal") {\n      const { paypalClientId, paypalClientSecret, paypalIsSandbox } = creds;\n      if (!paypalClientId || !paypalClientSecret) {\n        return json({ error: "PayPal subscription credentials not configured." }, 400);\n      }\n\n      const paypalBase = paypalIsSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";\n      const accessToken = await getAccessToken(paypalClientId, paypalClientSecret, paypalBase);\n      if (!accessToken) return json({ error: "Failed to authenticate with PayPal" }, 500);\n\n      const usdValue = Number(plan.price_usd).toFixed(2);\n      const purchaseUnit: any = {\n        amount: { currency_code: "USD", value: usdValue },\n        custom_id: `${user.id}_${plan.id}`,\n      };\n\n      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {\n        method: \"POST\",\n        headers: {\n          Authorization: `Bearer ${accessToken}`,\n          \"Content-Type\": \"application/json\",\n        },\n        body: JSON.stringify({\n          intent: \"CAPTURE\",\n          purchase_units: [purchaseUnit],\n          application_context: {\n            brand_name: \"Subscription\",\n            landing_page: \"LOGIN\",\n            user_action: \"PAY_NOW\",\n            shipping_preference: \"NO_SHIPPING\",\n            return_url: returnUrl,\n            cancel_url: `${origin}/subscribe`,\n          },\n        }),\n      });\n      const orderData = await orderRes.json();\n\n      if (orderData.id) {\n        const approveLink = orderData.links.find((l: any) => l.rel === \"approve\")?.href;\n        return json({ orderId: orderData.id, approveUrl: approveLink });\n      }\n      return json({ error: \"Failed to create PayPal order\", details: orderData }, 500);\n    }\n\n    if (method === \"usdt\") {\n       const { cryptomusMerchantId, cryptomusPaymentKey } = creds;\n       if (!cryptomusMerchantId || !cryptomusPaymentKey) {\n         return json({ error: \"Cryptomus USDT credentials not configured.\" }, 400);\n       }\n\n       const usdValue = Number(plan.price_usd).toFixed(2);\n       const orderId = `${user.id}_${plan.id}_${Date.now()}`;\n       const webhookUrl = `${supabaseUrl}/functions/v1/subscription-webhook`;\n\n       const reqBody = {\n         amount: usdValue.toString(),\n         currency: \"USD\",\n         order_id: orderId,\n         network: \"BSC\",\n         to_currency: \"USDT\",\n         url_callback: webhookUrl,\n         url_return: `${returnUrl}?method=usdt`,\n         is_payment_multiple: false,\n         lifetime: \"3600\",\n       };\n\n       console.log(\"CRYPTOMUS REQUEST BODY\", reqBody);\n       const signature = generateCryptomusSignature(reqBody, cryptomusPaymentKey);\n\n       const paymentRes = await fetch(`${CRYPTOMUS_API}/payment`, {\n         method: \"POST\",\n         headers: {\n           \"merchant\": cryptomusMerchantId,\n           \"sign\": signature,\n           \"Content-Type\": \"application/json\",\n         },\n         body: JSON.stringify(reqBody),\n       });\n       \n       const paymentData = await paymentRes.json();\n       console.log(\"CRYPTOMUS RESPONSE\", paymentData);\n\n       if (paymentData.state === 0 && paymentData.result) {\n         return json({\n            payAddress: paymentData.result.address,\n            payAmount: paymentData.result.payer_amount,\n            payCurrency: paymentData.result.payer_currency,\n            invoiceUrl: paymentData.result.url,\n            orderId: paymentData.result.order_id,\n            uuid: paymentData.result.uuid,\n            network: paymentData.result.network\n         });\n       }\n\n       return json({ error: \"Failed to create Cryptomus payment\", details: paymentData }, 400);\n    }\n    \n    return json({ error: \"Unsupported method\" }, 400);\n\n  } catch (err) {\n    console.error(\"Function error:\", err);\n    return json({ error: (err as Error).message }, 500);\n  }\n});
