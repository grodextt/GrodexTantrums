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
    .eq("key", "subscription_settings")
    .single();
  const s = data?.value as any;
  return {
    clientId: s?.sub_paypal_client_id,
    clientSecret: s?.sub_paypal_secret,
    isSandbox: s?.sub_paypal_sandbox ?? false,
    bonusCoinsEnabled: s?.bonus_coins_enabled ?? true,
    doubleLoginRewards: s?.double_daily_login_enabled ?? true,
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
    const { orderId, planId } = body;

    if (!orderId || !planId) return json({ error: "Missing orderId or planId" }, 400);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    // Idempotency check
    const processKey = `paypal_sub_order_${orderId}`;
    const { data: existing } = await supabase
      .from("site_settings")
      .select("key")
      .eq("key", processKey)
      .maybeSingle();

    if (existing) {
      return json({ success: true, already_processed: true });
    }

    const credentials = await getPayPalCredentials(supabase);
    const { clientId, clientSecret, isSandbox, bonusCoinsEnabled, doubleLoginRewards } = credentials;

    if (!clientId || !clientSecret) {
      return json({ error: "PayPal not configured." }, 400);
    }

    const paypalBase = isSandbox ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    const accessToken = await getAccessToken(clientId, clientSecret, paypalBase);
    if (!accessToken) return json({ error: "Failed to authenticate with PayPal" }, 500);

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

    const [orderUserId, orderPlanId] = customId.split("_");

    if (orderUserId !== user.id || orderPlanId !== planId) {
      return json({ error: "Invalid custom_id format or mismatch" }, 400);
    }

    // Fetch plan
    const { data: plan } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", planId)
      .single();

    if (!plan) return json({ error: "Plan not found" }, 404);

    // Create user_subscription
    const now = new Date();
    const expiresAt = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);

    await supabase.from("user_subscriptions").insert({
      user_id: user.id,
      plan_id: planId,
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      payment_method: "paypal",
      payment_id: orderId,
      status: "active",
      bonus_coins_awarded: bonusCoinsEnabled ? plan.bonus_coins : 0,
    });

    // Credit coins
    const { data: profile } = await supabase
      .from("profiles")
      .select("coin_balance")
      .eq("id", user.id)
      .single();

    let updates: any = {};
    if (bonusCoinsEnabled && plan.bonus_coins > 0) {
      updates.coin_balance = (profile?.coin_balance ?? 0) + plan.bonus_coins;
    }
    
    if (doubleLoginRewards) {
      updates.double_login_rewards = true;
    }

    if (Object.keys(updates).length > 0) {
      await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);
    }

    // Mark as processed
    await supabase.from("site_settings").insert({
      key: processKey,
      value: { processed: true, user_id: user.id, plan_id: planId },
    });

    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});

