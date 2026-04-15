import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";
import "https://deno.land/std@0.224.0/dotenv/load.ts";

async function testBloggerUpload() {
  const supabase = createClient(
    Deno.env.get('VITE_SUPABASE_URL') || process.env.VITE_SUPABASE_URL,
    Deno.env.get('VITE_SUPABASE_ANON_KEY') || process.env.VITE_SUPABASE_ANON_KEY
  );

  const { data: settings } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', 'storage')
    .single();

  const {
    blogger_blog_id: blogId,
    blogger_api_key: refreshToken,
    blogger_client_id: clientId,
    blogger_client_secret: clientSecret
  } = settings.value;

  console.log("Getting token...");
  const authRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const authData = await authRes.json();
  const access_token = authData.access_token;
  
  if (!access_token) {
    console.error("Failed to get access token", authData);
    return;
  }

  console.log("Creating blogger post with dummy image...");
  // 1x1 transparent png
  const base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const bloggerRes = await fetch(
    `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        kind: 'blogger#post',
        title: `test_${Date.now()}`,
        content: `<img src="data:image/png;base64,${base64}" />`,
        status: 'LIVE'
      }),
    }
  );

  const post = await bloggerRes.json();
  console.log("Created post ID:", post.id);
  console.log("Post content:\n", post.content);

  // Let's delete it
  await fetch(`https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${access_token}` },
  });
}

testBloggerUpload().catch(console.error);
