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

async function getRazorpaySecret(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();
  const s = data?.value as any;
  return s?.payment_razorpay_key_secret || "";
}

async function getRazorpayKeyId(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();
  const s = data?.value as any;
  return s?.payment_razorpay_key_id || "";
}

// HMAC-SHA256 signature verification
async function verifySignature(orderId: string, paymentId: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const data = encoder.encode(`${orderId}|${paymentId}`);
  const sig = await crypto.subtle.sign("HMAC", key, data);
  const hexSig = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return hexSig === signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return json({ error: "Missing payment details" }, 400);
    }

    // Get secret and verify signature
    const secret = await getRazorpaySecret(supabase);
    if (!secret) {
      return json({ error: "Razorpay not configured" }, 400);
    }

    const isValid = await verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature, secret);
    if (!isValid) {
      return json({ error: "Invalid payment signature — coins NOT credited" }, 403);
    }

    // Idempotency check
    const processKey = `razorpay_order_${razorpay_order_id}`;
    const { data: existing } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", processKey)
      .single();
    if (existing) {
      return json({ success: true, already_processed: true });
    }

    // Fetch order from Razorpay to get notes
    const keyId = await getRazorpayKeyId(supabase);
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${razorpay_order_id}`, {
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${secret}`)}`,
      },
    });
    const orderData = await orderRes.json();

    const orderUserId = orderData.notes?.user_id;
    const orderCoins = parseInt(orderData.notes?.coins || "0");

    if (!orderUserId || orderCoins <= 0) {
      return json({ error: "Invalid order metadata" }, 400);
    }

    // Verify the requesting user matches the order user
    if (orderUserId !== user.id) {
      return json({ error: "User mismatch" }, 403);
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
      value: {
        processed: true,
        coins: orderCoins,
        user_id: orderUserId,
        payment_id: razorpay_payment_id,
      },
      updated_at: new Date().toISOString(),
    });

    return json({ success: true, coins_added: orderCoins });
  } catch (err) {\n    return json({ error: (err as Error).message }, 500);\n  }\n});
