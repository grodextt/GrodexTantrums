import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function getValidCoinPackages(supabase: any): Promise<{ coins: number; price: number }[]> {
  const { data: settingsRow } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "coin_system")
    .single();

  const settings = settingsRow?.value as any;
  const baseAmount = settings?.base_amount || 50;
  const basePrice = settings?.base_price || 0.99;

  const multipliers = [1, 3, 7, 15, 32, 100];
  return multipliers.map(m => ({
    coins: baseAmount * m,
    price: parseFloat((basePrice * m).toFixed(2)),
  }));
}

function findMatchingPackage(packages: { coins: number; price: number }[], coins: number, amount: number) {
  return packages.find(p => p.coins === coins && Math.abs(p.price - amount) < 0.01);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { action, orderId, coins, amount, returnUrl } = body;

    // Get PayPal credentials from site_settings
    const { data: settingsRow } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "premium_general")
      .single();

    const settings = settingsRow?.value as any;
    const clientId = settings?.payment_paypal_client_id;
    const clientSecret = settings?.payment_paypal_secret;

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: "PayPal not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // PayPal API base URL (live)
    const paypalBase = "https://api-m.paypal.com";

    // Get PayPal access token
    const tokenRes = await fetch(`${paypalBase}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return new Response(
        JSON.stringify({ error: "Failed to authenticate with PayPal", details: tokenData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const accessToken = tokenData.access_token;

    if (action === "create-order") {
      // Validate coins/amount against server-side packages
      const validPackages = await getValidCoinPackages(supabase);
      const matched = findMatchingPackage(validPackages, coins, amount);
      if (!matched) {
        return new Response(
          JSON.stringify({ error: "Invalid coin package", valid_packages: validPackages }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const baseReturnUrl = returnUrl || "https://scan-zen-studio.lovable.app/coin-shop";
      
      const orderRes = await fetch(`${paypalBase}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              amount: {
                currency_code: "USD",
                value: matched.price.toFixed(2), // Use server-validated price
              },
              description: `${matched.coins} coins purchase`,
              custom_id: `${user.id}_${matched.coins}`, // Store coins in custom_id for capture verification
            },
          ],
          application_context: {
            brand_name: "ScanZen Studio",
            landing_page: "NO_PREFERENCE",
            user_action: "PAY_NOW",
            return_url: `${baseReturnUrl}?paypal_order_id={ORDER_ID}&status=success`,
            cancel_url: `${baseReturnUrl}?status=cancelled`,
          },
        }),
      });
      const orderData = await orderRes.json();
      
      if (orderData.id) {
        const approveLink = orderData.links?.find((l: any) => l.rel === "approve")?.href;
        
        return new Response(
          JSON.stringify({ orderId: orderData.id, approveUrl: approveLink }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Failed to create PayPal order", details: orderData }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (action === "capture-order") {
      const captureRes = await fetch(
        `${paypalBase}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );
      const captureData = await captureRes.json();

      if (captureData.status === "COMPLETED") {
        // Extract coins from the order's custom_id (set server-side at creation), NOT from client body
        const customId = captureData.purchase_units?.[0]?.payments?.captures?.[0]?.custom_id
          || captureData.purchase_units?.[0]?.custom_id;
        
        if (!customId) {
          return new Response(
            JSON.stringify({ error: "Missing order metadata" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const parts = customId.split("_");
        const orderUserId = parts[0];
        const orderCoins = parseInt(parts[1] || "0");

        // Verify the capturing user matches the order creator
        if (orderUserId !== user.id || orderCoins <= 0) {
          return new Response(
            JSON.stringify({ error: "Order mismatch or invalid coins" }),
            { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Prevent double-processing
        const processKey = `paypal_order_${orderId}`;
        const { data: existing } = await supabase
          .from("site_settings")
          .select("key")
          .eq("key", processKey)
          .single();

        if (existing) {
          return new Response(
            JSON.stringify({ success: true, coins_added: orderCoins, already_processed: true }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Credit coins
        const { data: profile } = await supabase
          .from("profiles")
          .select("coin_balance")
          .eq("id", user.id)
          .single();

        const currentBalance = profile?.coin_balance ?? 0;
        await supabase
          .from("profiles")
          .update({ coin_balance: currentBalance + orderCoins })
          .eq("id", user.id);

        // Mark as processed
        await supabase.from("site_settings").upsert({
          key: processKey,
          value: { processed: true, coins: orderCoins, user_id: user.id },
          updated_at: new Date().toISOString(),
        });

        return new Response(
          JSON.stringify({ success: true, coins_added: orderCoins }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        return new Response(
          JSON.stringify({ error: "Payment not completed", status: captureData.status }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
