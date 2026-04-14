import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const now = new Date().toISOString();

    // 1. Expire active subscriptions
    const { data: expiredSubs, error: subError } = await supabase
      .from("user_subscriptions")
      .update({ status: "expired" })
      .eq("status", "active")
      .lt("expires_at", now)
      .select("user_id");

    if (subError) throw subError;

    // 2. Clear double_login_rewards for users who no longer have active subscriptions
    if (expiredSubs && expiredSubs.length > 0) {
      const userIds = [...new Set(expiredSubs.map(s => s.user_id))];

      for (const userId of userIds) {
        const { data: activeSub } = await supabase
          .from("user_subscriptions")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "active")
          .gt("expires_at", now)
          .maybeSingle();

        if (!activeSub) {
          await supabase
            .from("profiles")
            .update({ double_login_rewards: false } || {})
            .eq("id", userId);
        }
      }
    }

    // 3. Flip is_subscription to false for chapters past their free release date
    const { data: freeChapters, error: chapterError } = await supabase
      .from("chapters")
      .update({ is_subscription: false })
      .eq("is_subscription", true)
      .lt("subscription_free_release_at", now)
      .select("id");

    if (chapterError) throw chapterError;

    return new Response(JSON.stringify({
      success: true,
      subscriptionsExpired: expiredSubs?.length || 0,
      chaptersFreed: freeChapters?.length || 0
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

