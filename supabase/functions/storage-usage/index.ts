import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // List all files in manga-assets bucket
    const allFiles: { name: string; size: number }[] = [];
    let offset = 0;
    const limit = 1000;

    while (true) {
      const { data: files, error } = await supabase.storage
        .from("manga-assets")
        .list("", { limit, offset, sortBy: { column: "name", order: "asc" } });

      if (error) {
        console.error("Storage list error:", error);
        break;
      }

      if (!files || files.length === 0) break;

      for (const file of files) {
        if (file.metadata) {
          allFiles.push({ name: file.name, size: file.metadata.size || 0 });
        } else {
          // It's a folder, list its contents
          const { data: subFiles } = await supabase.storage
            .from("manga-assets")
            .list(file.name, { limit: 10000 });
          
          if (subFiles) {
            for (const sub of subFiles) {
              if (sub.metadata) {
                allFiles.push({ name: `${file.name}/${sub.name}`, size: sub.metadata.size || 0 });
              } else {
                // Nested folder
                const { data: nestedFiles } = await supabase.storage
                  .from("manga-assets")
                  .list(`${file.name}/${sub.name}`, { limit: 10000 });
                if (nestedFiles) {
                  for (const nested of nestedFiles) {
                    if (nested.metadata) {
                      allFiles.push({
                        name: `${file.name}/${sub.name}/${nested.name}`,
                        size: nested.metadata.size || 0,
                      });
                    }
                  }
                }
              }
            }
          }
        }
      }

      if (files.length < limit) break;
      offset += limit;
    }

    const totalBytes = allFiles.reduce((sum, f) => sum + f.size, 0);
    const totalFiles = allFiles.length;
    const totalMB = parseFloat((totalBytes / (1024 * 1024)).toFixed(2));

    return new Response(
      JSON.stringify({
        total_bytes: totalBytes,
        total_mb: totalMB,
        total_files: totalFiles,
        bucket: "manga-assets",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
