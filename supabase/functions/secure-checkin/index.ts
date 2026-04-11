import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = req.headers.get("apikey") || Deno.env.get("SUPABASE_ANON_KEY")!;

    // Use anon key client for user identity verification
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Rate limit: check last check-in (20-hour window)
    const { data: lastCheckin } = await adminClient
      .from("user_checkins")
      .select("checked_in_at")
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastCheckin) {
      const lastTime = new Date(lastCheckin.checked_in_at).getTime();
      const now = Date.now();
      const hoursSince = (now - lastTime) / (1000 * 60 * 60);
      if (hoursSince < 20) {
        const hoursLeft = Math.ceil(20 - hoursSince);
        return new Response(
          JSON.stringify({
            error: `Already checked in recently. Try again in ${hoursLeft} hour(s).`,
            rateLimited: true,
          }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Record check-in
    const { error: checkinError } = await adminClient
      .from("user_checkins")
      .insert({ user_id: userId });
    if (checkinError) throw checkinError;

    // Calculate current streak
    const { data: recentCheckins } = await adminClient
      .from("user_checkins")
      .select("checked_in_at")
      .eq("user_id", userId)
      .order("checked_in_at", { ascending: false })
      .limit(30);

    let currentStreak = 1;
    if (recentCheckins && recentCheckins.length > 1) {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      for (let i = 1; i < recentCheckins.length; i++) {
        const expectedDay = new Date(today);
        expectedDay.setUTCDate(expectedDay.getUTCDate() - i);
        const checkinDay = new Date(recentCheckins[i].checked_in_at);
        checkinDay.setUTCHours(0, 0, 0, 0);
        if (checkinDay.getTime() === expectedDay.getTime()) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    // Check if cycle is complete and award tokens
    const { data: tokenSettingsRow } = await adminClient
      .from("site_settings")
      .select("value")
      .eq("key", "token_settings")
      .maybeSingle();

    const tokenSettings = tokenSettingsRow?.value || {};
    const cycleLength = (tokenSettings as any)?.checkin_cycle || 4;
    const checkinReward = (tokenSettings as any)?.checkin_reward || 1;

    let awarded = false;
    let awardAmount = 0;

    if (currentStreak >= cycleLength && currentStreak % cycleLength === 0) {
      const today = new Date().toISOString().split("T")[0];
      const { data: existingAward } = await adminClient
        .from("mission_awards")
        .select("id")
        .eq("user_id", userId)
        .eq("mission_type", "daily_checkin")
        .gte("awarded_at", today)
        .maybeSingle();

      if (!existingAward) {
        await adminClient.from("mission_awards").insert({
          user_id: userId,
          mission_type: "daily_checkin",
          amount: checkinReward,
        });

        const { data: profile } = await adminClient
          .from("profiles")
          .select("token_balance")
          .eq("id", userId)
          .single();

        await adminClient
          .from("profiles")
          .update({ token_balance: ((profile as any)?.token_balance || 0) + checkinReward })
          .eq("id", userId);

        awarded = true;
        awardAmount = checkinReward;
      }
    }

    return new Response(
      JSON.stringify({ success: true, streak: currentStreak, awarded, amount: awardAmount }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("secure-checkin error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
