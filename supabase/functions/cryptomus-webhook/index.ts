import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import md5 from "https://esm.sh/md5@2.3.0";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCryptomusIpnSecret() {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();
  const s = data?.value as any;
  return s?.payment_cryptomus_payment_key;
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const rawText = await req.text();
    let body;
    try {
      body = JSON.parse(rawText);
    } catch {
      return new Response("Invalid JSON", { status: 400 });
    }

    const paymentKey = await getCryptomusIpnSecret();
    if (!paymentKey) {
      console.error("Cryptomus Webhook Secret not configured.");
      return new Response("Webhook secret not configured", { status: 500 });
    }

    const providedSign = body.sign;
    if (!providedSign) {
      console.error("No sign field in request");
      return new Response("Unauthorized", { status: 401 });
    }

    const dataToSign = { ...body };
    delete dataToSign.sign;
    
    const jsonStr = JSON.stringify(dataToSign);
    const base64Body = base64Encode(new TextEncoder().encode(jsonStr));
    const expectedSign = md5(base64Body + paymentKey);

    if (providedSign !== expectedSign) {
      console.error("Cryptomus signature mismatch", { expectedSign, providedSign });
      return new Response("Invalid signature", { status: 401 });
    }

    if (body.status === "paid" || body.status === "paid_over") {
      const orderId = body.order_id;
      if (!orderId) return new Response("Ok");

      if (orderId.includes("_coin_")) {
         const parts = orderId.split("_");
         const userId = parts[0];
         const coinsStr = parts[2];
         const coinsAmount = parseInt(coinsStr, 10) || 0;
         
         if (coinsAmount > 0) {
           await supabase.rpc("increment_coins", {
             user_id: userId,
             amount: coinsAmount,
           });
         }
      }
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response((err as Error).message, { status: 500 });
  }
});

