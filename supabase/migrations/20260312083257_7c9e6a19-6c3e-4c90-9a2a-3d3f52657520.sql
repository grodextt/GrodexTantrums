
-- 1. Fix bookmarks: replace public SELECT with user-scoped SELECT
DROP POLICY IF EXISTS "Anyone can read bookmarks" ON public.bookmarks;
CREATE POLICY "Users can read own bookmarks"
  ON public.bookmarks
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2. Create manga_discord_settings table with admin-only RLS
CREATE TABLE IF NOT EXISTS public.manga_discord_settings (
  manga_id uuid PRIMARY KEY REFERENCES public.manga(id) ON DELETE CASCADE,
  webhook_url text,
  channel_name text,
  primary_role_id text,
  secondary_role_id text,
  notification_template text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.manga_discord_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage discord settings"
  ON public.manga_discord_settings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Migrate existing discord data from manga table
INSERT INTO public.manga_discord_settings (manga_id, webhook_url, channel_name, primary_role_id, secondary_role_id, notification_template)
SELECT id, discord_webhook_url, discord_channel_name, discord_primary_role_id, discord_secondary_role_id, discord_notification_template
FROM public.manga
WHERE discord_webhook_url IS NOT NULL
ON CONFLICT (manga_id) DO NOTHING;

-- Drop discord columns from manga table
ALTER TABLE public.manga DROP COLUMN IF EXISTS discord_webhook_url;
ALTER TABLE public.manga DROP COLUMN IF EXISTS discord_channel_name;
ALTER TABLE public.manga DROP COLUMN IF EXISTS discord_primary_role_id;
ALTER TABLE public.manga DROP COLUMN IF EXISTS discord_secondary_role_id;
ALTER TABLE public.manga DROP COLUMN IF EXISTS discord_notification_template;
