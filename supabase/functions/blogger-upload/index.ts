import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const app = new Hono();

app.options('/*', (c) => new Response(null, { headers: corsHeaders }));

app.post('/', async (c) => {
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
    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const binary = String.fromCharCode(...bytes);
    const base64Image = btoa(binary);

    const postTitle = `img_${path.replace(/\//g, '_')}_${Date.now()}`;
    const htmlContent = `<img src="data:${file.type};base64,${base64Image}" />`;

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
          status: 'LIVE'
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
    const content = postData.content || '';
    const imgMatch = content.match(/src="(https:\/\/[^"]+blogspot[^"]+)"/);
    
    let imageUrl = '';
    if (imgMatch) {
      imageUrl = imgMatch[1];
    } else {
      const anyImgMatch = content.match(/src="(https:\/\/[^"]+)"/);
      if (anyImgMatch) imageUrl = anyImgMatch[1];
    }

    if (!imageUrl) {
      return c.json({ error: 'Blogger upload succeeded but no image URL was found in the response' }, 500);
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
