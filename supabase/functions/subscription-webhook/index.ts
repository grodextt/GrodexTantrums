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
    .eq("key", "subscription_settings")
    .single();
  const s = data?.value as any;
  return s?.sub_cryptomus_payment_key;
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
    
    // Cryptomus explicitly says: "stringify the received JSON without formatting"
    const jsonStr = JSON.stringify(dataToSign);
    const base64Body = base64Encode(new TextEncoder().encode(jsonStr));
    const expectedSign = md5(base64Body + paymentKey);

    if (providedSign !== expectedSign) {
      console.error("Cryptomus signature mismatch", { expectedSign, providedSign });
      return new Response("Invalid signature", { status: 401 });
    }

    // Successful final states are usually "paid" or "paid_over"
    if (body.status === "paid" || body.status === "paid_over") {
      const orderId = body.order_id;
      if (!orderId) return new Response("Ok");

      const parts = orderId.split("_");
      const userId = parts[0];
      const planId = parts[1];

      // Grab plan details
      const { data: plan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("id", planId)
        .single();
      if (!plan) return new Response("Plan not found");

      // Idempotency check: Have we processed this Cryptomus UUID?
      const uuid = body.uuid;
      const { data: existingSub } = await supabase
        .from("user_subscriptions")
        .select("id")
        .eq("payment_id", uuid)
        .maybeSingle();

      if (existingSub) {
        return new Response("Already processed");
      }

      const endsAt = new Date();\n      endsAt.setDate(endsAt.getDate() + (plan.duration_days || 30));\n\n      const { error: insertError } = await supabase\n        .from(\"user_subscriptions\")\n        .insert({\n          user_id: userId,\n          plan_id: planId,\n          status: \"active\",\n          starts_at: new Date().toISOString(),\n          ends_at: endsAt.toISOString(),\n          payment_id: uuid,\n          payment_provider: \"cryptomus\",\n        });\n\n      if (insertError) {\n        console.error(\"Failed to insert subscription\", insertError);\n        return new Response(\"Error updating database\", { status: 500 });\n      }\n\n      // Grant bonus coins\n      if (plan.bonus_coins > 0) {\n        await supabase.rpc('increment_coins', { \n          user_id: userId, \n          amount: plan.bonus_coins \n        });\n      }\n    }\n\n    return new Response(\"OK\", { status: 200 });\n\n  } catch (err) {\n    console.error(\"Webhook error:\", err);\n    return new Response((err as Error).message, { status: 500 });\n  }\n});
