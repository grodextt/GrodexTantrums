import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { cors } from "https://deno.land/x/hono@v4.3.11/middleware.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const app = new Hono();

app.use('/*', cors({
  origin: '*',
  allowHeaders: ['authorization', 'x-client-info', 'apikey', 'content-type'],
}));

app.post('/*', async (c) => {
  try {
    // We expect multipart/form-data as sent by useManga.ts
    const formData = await c.req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file) {
      return c.json({ error: 'Missing file in request' }, 400);
    }

    // Initialize Supabase to get settings
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch storage settings from DB
    const { data: storageRow, error: storageError } = await supabaseClient
      .from('site_settings')
      .select('value')
      .eq('key', 'storage')
      .single();

    if (storageError || !storageRow) {
      return c.json({ error: 'Failed to fetch storage settings from database' }, 500);
    }

    const { 
      blogger_blog_id: blogId, 
      blogger_api_key: refreshToken, 
      blogger_client_id: clientId, 
      blogger_client_secret: clientSecret 
    } = storageRow.value;

    if (!blogId || !refreshToken || !clientId || !clientSecret) {
      return c.json({ error: 'Blogger configuration is incomplete in site_settings' }, 400);
    }

    // Step 1: Exchange Refresh Token for Access Token
    console.log('Refreshing Google access token...');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const tokenError = await tokenResponse.text();
      console.error('Google Token Error:', tokenError);
      return c.json({ error: `Google Auth failed: ${tokenError}` }, 401);
    }

    const { access_token: accessToken } = await tokenResponse.json();

    // Step 2: Upload to Blogger
    // We upload by creating a post with the image.
    // Convert file to base64 robustly
    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // We must use a robust chunked base64 encoder to avoid "call stack size exceeded" on large files
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + chunkSize));
    }
    const base64Image = btoa(binary);

    const postTitle = `img_${path.replace(/\//g, '_')}_${Date.now()}`;
    // Blogger usually prefers single quotes or specific formatting to trigger auto-hosting
    const htmlContent = `<img src="data:${file.type || 'image/jpeg'};base64,${base64Image}" />`;

    console.log(`Uploading to Blogger blog ${blogId}...`);
    const bloggerResponse = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          kind: 'blogger#post',
          title: postTitle,
          content: htmlContent,
          status: 'LIVE' // Must be LIVE for Base64 host resolution to trigger
        }),
      }
    );

    if (!bloggerResponse.ok) {
      const errorText = await bloggerResponse.text();
      console.error('Blogger API error:', errorText);
      return c.json({ error: `Blogger API error: ${bloggerResponse.status} - ${errorText}` }, 500);
    }

    const postData = await bloggerResponse.json();

    // Step 3: Extract hosted image URL
    // Blogger natively converts base64 inline images to 1.bp.blogspot.com URLs
    const content = postData.content || '';
    const imgMatch = content.match(/src=["'](https:\/\/[^"']+blogspot[^"']+)["']/);
    
    let imageUrl = '';
    if (imgMatch) {
      imageUrl = imgMatch[1];
    } else {
      const anyImgMatch = content.match(/src=["'](https:\/\/[^"']+)["']/);
      if (anyImgMatch) imageUrl = anyImgMatch[1];
    }

    if (!imageUrl) {
      return c.json({ error: 'Blogger upload succeeded but no image URL was found. Base64 conversion likely failed.', content: postData.content }, 500);
    }

    // Optional: Delete the post now that the image is hosted on Google's CDN
    console.log(`Image hosted at ${imageUrl}. Deleting temporary post ${postData.id}...`);
    await fetch(
       `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${postData.id}`,
       {
         method: 'DELETE',
         headers: { 'Authorization': `Bearer ${accessToken}` },
       }
     ).catch(e => console.warn('Failed to delete temp post:', e));

    return c.json({ url: imageUrl }, 200);
  } catch (error) {
    console.error('Global Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
