import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  mangaId: string;
  chapterNumber: number;
  chapterTitle: string;
  mangaSlug: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth check - require authenticated admin user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify caller is admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { mangaId, chapterNumber, chapterTitle, mangaSlug }: NotificationRequest = await req.json();

    // Fetch manga details
    const { data: manga, error } = await supabase
      .from("manga")
      .select("title, cover_url, status, type")
      .eq("id", mangaId)
      .single();

    if (error || !manga) {
      return new Response(JSON.stringify({ error: "Manga not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch discord settings from separate table
    const { data: discordSettings } = await supabase
      .from("manga_discord_settings")
      .select("*")
      .eq("manga_id", mangaId)
      .maybeSingle();

    if (!discordSettings?.webhook_url) {
      return new Response(JSON.stringify({ message: "Discord not configured for this manga" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build chapter URL
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:8080";
    const chapterUrl = `${siteUrl}/manga/${mangaSlug}/chapter/${chapterNumber}`;

    // Build the notification message from template
    const template = discordSettings.notification_template || 
      "New chapter released: {manga_title} - Chapter {chapter_number}: {chapter_title}\nRead now: {chapter_url}";
    
    const messageContent = template
      .replace(/{manga_title}/g, manga.title)
      .replace(/{chapter_number}/g, chapterNumber.toString())
      .replace(/{chapter_title}/g, chapterTitle || "")
      .replace(/{chapter_url}/g, chapterUrl);

    // Build role mentions
    let mentionContent = "";
    if (discordSettings.primary_role_id) {
      mentionContent += `<@&${discordSettings.primary_role_id}> `;
    }
    if (discordSettings.secondary_role_id) {
      mentionContent += `<@&${discordSettings.secondary_role_id}> `;
    }
    mentionContent = mentionContent.trim();

    // Build Discord embed
    const embed = {
      title: `📖 ${manga.title} - Chapter ${chapterNumber}`,
      description: messageContent,
      color: 0x5865F2,
      thumbnail: manga.cover_url ? { url: manga.cover_url } : undefined,
      fields: [
        { name: "Chapter", value: `${chapterNumber}`, inline: true },
        { name: "Status", value: manga.status.charAt(0).toUpperCase() + manga.status.slice(1), inline: true },
        { name: "Type", value: manga.type.charAt(0).toUpperCase() + manga.type.slice(1), inline: true },
      ],
      url: chapterUrl,
      footer: { 
        text: discordSettings.channel_name ? `📺 ${discordSettings.channel_name} • MangaHub v1` : "MangaHub v1"
      },
      timestamp: new Date().toISOString(),
    };

    const discordPayload: any = {
      embeds: [embed],
    };

    if (mentionContent) {
      discordPayload.content = mentionContent;
    }

    console.log("Sending Discord notification:", JSON.stringify(discordPayload, null, 2));

    const discordResponse = await fetch(discordSettings.webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload),
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error("Discord webhook failed:", errorText);
      throw new Error(`Discord webhook failed: ${errorText}`);
    }

    return new Response(JSON.stringify({ success: true, message: "Discord notification sent" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Discord notification error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
