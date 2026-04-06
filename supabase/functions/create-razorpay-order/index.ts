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

async function getRazorpayCredentials(supabase: any) {
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "premium_general")
    .single();
  const s = data?.value as any;
  return {
    keyId: s?.payment_razorpay_key_id || "",
    keySecret: s?.payment_razorpay_key_secret || "",
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

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const { amount, coins } = body;

    if (!amount || !coins || coins <= 0) {
      return json({ error: "Invalid request" }, 400);
    }

    const { keyId, keySecret } = await getRazorpayCredentials(supabase);
    if (!keyId || !keySecret) {
      return json({ error: "Razorpay not configured. Add credentials in Admin Panel → Premium Content." }, 400);
    }

    // Convert USD to INR (approximate rate) and then to paise
    const USD_TO_INR = 84;
    const amountInPaise = Math.round(parseFloat(amount) * USD_TO_INR * 100);

    // Create Razorpay order
    const orderRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `${user.id}_${coins}`,
        notes: {
          user_id: user.id,
          coins: String(coins),
          usd_amount: String(amount),
        },
      }),
    });

    const orderData = await orderRes.json();

    if (orderData.id) {
      return json({
        orderId: orderData.id,
        keyId,
        amount: amountInPaise,
        currency: "INR",
      });
    }

    return json({ error: "Failed to create Razorpay order", details: orderData }, 500);
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
