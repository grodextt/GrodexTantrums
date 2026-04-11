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

    const { chapterId, unlockType } = await req.json();

    if (!chapterId || !["coin", "token"].includes(unlockType)) {
      return new Response(
        JSON.stringify({ error: "Invalid request. Provide chapterId and unlockType (coin|token)." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get chapter info
    const { data: chapter, error: chapterError } = await adminClient
      .from("chapters")
      .select("id, premium, coin_price")
      .eq("id", chapterId)
      .single();

    if (chapterError || !chapter) {
      return new Response(JSON.stringify({ error: "Chapter not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!chapter.premium) {
      return new Response(
        JSON.stringify({ error: "This chapter is not premium." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check existing unlock
    const { data: existingUnlock } = await adminClient
      .from("chapter_unlocks")
      .select("id, expires_at")
      .eq("chapter_id", chapterId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existingUnlock) {
      if (!existingUnlock.expires_at || new Date(existingUnlock.expires_at) > new Date()) {
        return new Response(
          JSON.stringify({ error: "Chapter already unlocked.", already: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get user balance
    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("coin_balance, token_balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const coinPrice = chapter.coin_price || 100;

    if (unlockType === "coin") {
      if ((profile.coin_balance || 0) < coinPrice) {
        return new Response(
          JSON.stringify({ error: "Insufficient coins", required: coinPrice, balance: profile.coin_balance || 0 }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    } else {
      if ((profile.token_balance || 0) < 1) {
        return new Response(
          JSON.stringify({ error: "Insufficient tickets", required: 1, balance: profile.token_balance || 0 }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Deduct balance
    if (unlockType === "coin") {
      const { error: deductError } = await adminClient
        .from("profiles")
        .update({ coin_balance: (profile.coin_balance || 0) - coinPrice })
        .eq("id", userId);
      if (deductError) throw deductError;
    } else {
      const { error: deductError } = await adminClient
        .from("profiles")
        .update({ token_balance: (profile.token_balance || 0) - 1 })
        .eq("id", userId);
      if (deductError) throw deductError;
    }

    const expires_at =
      unlockType === "token"
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    if (existingUnlock) {
      await adminClient.from("chapter_unlocks").delete().eq("id", existingUnlock.id);
    }

    const { data: unlock, error: unlockError } = await adminClient
      .from("chapter_unlocks")
      .insert({ chapter_id: chapterId, user_id: userId, unlock_type: unlockType, expires_at })
      .select()
      .single();

    if (unlockError) {
      // Rollback
      if (unlockType === "coin") {
        await adminClient.from("profiles").update({ coin_balance: profile.coin_balance || 0 }).eq("id", userId);
      } else {
        await adminClient.from("profiles").update({ token_balance: profile.token_balance || 0 }).eq("id", userId);
      }
      throw unlockError;
    }

    return new Response(
      JSON.stringify({ success: true, unlock }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("unlock-chapter error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
