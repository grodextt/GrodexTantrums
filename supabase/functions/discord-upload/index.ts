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
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

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

    const { discord_webhook_url: webhookUrl } = storageRow.value;

    if (!webhookUrl) {
      return c.json({ error: 'Discord Webhook URL is not configured in site_settings' }, 400);
    }

    // Upload to Discord via Webhook
    const discordFormData = new FormData();
    discordFormData.append('file', file, file.name);

    console.log(`Uploading ${file.name} to Discord Webhook...`);
    const discordResponse = await fetch(webhookUrl, {
      method: 'POST',
      body: discordFormData,
    });

    if (!discordResponse.ok) {
      const errorText = await discordResponse.text();
      console.error('Discord API error:', errorText);
      return c.json({ error: `Discord API error: ${discordResponse.status} - ${errorText}` }, 500);
    }

    const result = await discordResponse.json();
    
    // Extract the attachment URL from the message result
    const attachment = result.attachments?.[0];
    if (!attachment?.url) {
      return c.json({ error: 'Discord upload succeeded but no attachment URL was found' }, 500);
    }

    return c.json({ url: attachment.url }, 200);
  } catch (error) {
    console.error('Global Error:', error);
    return c.json({ error: error.message }, 500);
  }
});

Deno.serve(app.fetch);
