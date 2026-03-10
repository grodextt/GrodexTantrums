import { Hono } from "https://deno.land/x/hono@v4.3.11/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const app = new Hono();

app.options('/*', (c) => new Response(null, { headers: corsHeaders }));

app.post('/', async (c) => {
  try {
    const { imageBase64, blogId, apiKey, fileName } = await c.req.json();

    if (!imageBase64 || !blogId || !apiKey) {
      return c.json({ error: 'Missing required fields: imageBase64, blogId, apiKey' }, 400);
    }

    // Create a blog post with the image embedded as base64 data URI
    const postTitle = `img_${fileName || Date.now()}`;
    const htmlContent = `<img src="data:image/jpeg;base64,${imageBase64}" />`;

    const response = await fetch(
      `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          kind: 'blogger#post',
          title: postTitle,
          content: htmlContent,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Blogger API error:', errorText);
      return c.json({ error: `Blogger API error: ${response.status}` }, 500);
    }

    const postData = await response.json();

    // Extract Google CDN URL from the created post content
    // Blogger converts base64 images to hosted URLs on Google's CDN
    const content = postData.content || '';
    const imgMatch = content.match(/src="(https:\/\/[^"]+blogspot[^"]+)"/);
    
    let imageUrl = '';
    if (imgMatch) {
      imageUrl = imgMatch[1];
    } else {
      // Fallback: try to get any https image URL
      const anyImgMatch = content.match(/src="(https:\/\/[^"]+)"/);
      if (anyImgMatch) {
        imageUrl = anyImgMatch[1];
      }
    }

    // Delete the post after extracting the URL (optional cleanup)
    if (postData.id) {
      try {
        await fetch(
          `https://www.googleapis.com/blogger/v3/blogs/${blogId}/posts/${postData.id}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${apiKey}` },
          }
        );
      } catch {
        // Non-critical, URL is already extracted
      }
    }

    return c.json({ url: imageUrl, postId: postData.id }, 200);
  } catch (error) {
    console.error('Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
