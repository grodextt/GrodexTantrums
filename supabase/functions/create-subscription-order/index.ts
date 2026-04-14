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

    if (method === "paypal") {
      const { paypalClientId, paypalClientSecret, paypalIsSandbox } = creds;
      if (!paypalClientId || !paypalClientSecret) {
        return json({ error: "PayPal subscription credentials not configured." }, 400);
      }

      const paypalBase = paypalIsSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
      const accessToken = await getAccessToken(paypalClientId, paypalClientSecret, paypalBase);
      if (!accessToken) return json({ error: "Failed to authenticate with PayPal" }, 500);

      const usdValue = Number(plan.price_usd).toFixed(2);
      const purchaseUnit: any = {
        amount: { currency_code: "USD", value: usdValue },
        custom_id: `${user.id}_${plan.id}`,
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
            brand_name: "Subscription",
            landing_page: "LOGIN",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: returnUrl,
            cancel_url: `${origin}/subscribe`,
          },
        }),
      });
      const orderData = await orderRes.json();

      if (orderData.id) {
        const approveLink = orderData.links.find((l: any) => l.rel === "approve")?.href;
        return json({ orderId: orderData.id, approveUrl: approveLink });
      }
      return json({ error: "Failed to create PayPal order", details: orderData }, 500);
    }

    if (method === "usdt") {
       const { cryptomusMerchantId, cryptomusPaymentKey } = creds;
       if (!cryptomusMerchantId || !cryptomusPaymentKey) {
         return json({ error: "Cryptomus USDT credentials not configured." }, 400);
       }

       const usdValue = Number(plan.price_usd).toFixed(2);
       const orderId = `${user.id}_${plan.id}_${Date.now()}`;
       const webhookUrl = `${supabaseUrl}/functions/v1/subscription-webhook`;

       const reqBody = {
         amount: usdValue.toString(),
         currency: "USD",
         order_id: orderId,
         network: "BSC",
         to_currency: "USDT",
         url_callback: webhookUrl,
         url_return: `${returnUrl}?method=usdt`,
         is_payment_multiple: false,
         lifetime: "3600",
       };

       console.log("CRYPTOMUS REQUEST BODY", reqBody);
       const signature = generateCryptomusSignature(reqBody, cryptomusPaymentKey);

       const paymentRes = await fetch(`${CRYPTOMUS_API}/payment`, {
         method: "POST",
         headers: {
           "merchant": cryptomusMerchantId,
           "sign": signature,
           "Content-Type": "application/json",
         },
         body: JSON.stringify(reqBody),
       });
       
       const paymentData = await paymentRes.json();
       console.log("CRYPTOMUS RESPONSE", paymentData);

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
    }
    
    return json({ error: "Unsupported method" }, 400);

  } catch (err) {
    console.error("Function error:", err);
    return json({ error: (err as Error).message }, 500);
  }
});

