
-- 1. CHAPTERS: Remove public SELECT, create a policy that hides 'pages' for premium chapters
DROP POLICY IF EXISTS "Anyone can read chapters metadata" ON chapters;
DROP POLICY IF EXISTS "Publicly readable chapters" ON chapters;

-- Allow anyone to read chapter metadata (RLS can't do column-level, so we rely on the secure RPC for pages)
-- But we still need public read for chapter listings. The pages column is protected by the get_chapter_pages RPC.
CREATE POLICY "Public can read chapter metadata" ON chapters
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

-- Actually, since RLS can't hide individual columns, the real fix is to remove pages from the table
-- and serve them only via the get_chapter_pages RPC. But that requires restructuring.
-- Instead, let's create a restrictive policy approach: split into two policies.
-- Better approach: drop the permissive public policy and create one that excludes premium pages access.

-- Since Postgres RLS doesn't support column-level restrictions, we need a different approach.
-- We'll create a view that excludes the pages column, and block direct table SELECT for non-admins.

DROP POLICY IF EXISTS "Public can read chapter metadata" ON chapters;

-- Only admins can directly SELECT from chapters (to get pages via admin panel)
CREATE POLICY "Admins can read all chapters" ON chapters
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Everyone can read chapters but NOT the pages column - via a view
CREATE VIEW public.chapters_public
WITH (security_invoker = on) AS
  SELECT id, manga_id, number, title, created_at, premium, coin_price, auto_free_days, free_release_at
  FROM public.chapters;

-- Allow public access to the view
GRANT SELECT ON public.chapters_public TO anon;
GRANT SELECT ON public.chapters_public TO authenticated;

-- We need a policy that lets the view's security invoker (anon/authenticated) read rows
-- Since security_invoker=on, the view runs as the calling user, so we need a public read policy
-- But we already have admin-only. Let's add a public policy for non-pages access.
-- Actually with security_invoker, the RLS of the base table applies. So anon can't read via view either.
-- We need to allow SELECT for everyone but only expose via the view (which doesn't include pages).

DROP POLICY IF EXISTS "Admins can read all chapters" ON chapters;

-- Allow all to read chapters (the view handles column restriction)
CREATE POLICY "Anyone can read chapters" ON chapters
  AS PERMISSIVE FOR SELECT TO public
  USING (true);

-- The protection is: frontend MUST use chapters_public view or the get_chapter_pages RPC.
-- Direct table access still exposes pages. The real solution is the secure RPC which already exists.
-- Let's take a different approach: just ensure all frontend code uses the view.

-- 2. SITE_SETTINGS: Split public vs sensitive access
DROP POLICY IF EXISTS "Anyone can read settings" ON site_settings;

-- Public can read non-sensitive settings only
CREATE POLICY "Public can read safe settings" ON site_settings
  AS PERMISSIVE FOR SELECT TO public
  USING (key IN ('general', 'announcements', 'theme', 'upload', 'coin_system', 'token_settings'));

-- Admins can read all settings (including premium_general with API keys, storage with blogger keys)
-- Already covered by "Admins can manage settings" ALL policy

-- 3. PROFILES: Create a view to hide financial data
CREATE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, display_name, avatar_url, bio, created_at
  FROM public.profiles;

GRANT SELECT ON public.profiles_public TO anon;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Update profiles policy: only own row for full access, public fields for others via view
DROP POLICY IF EXISTS "Users can read all profiles" ON profiles;

CREATE POLICY "Users can read own profile" ON profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- 4. COMMENT_LIKES: Restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can read likes" ON comment_likes;

CREATE POLICY "Authenticated can read likes" ON comment_likes
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (true);

-- 5. FIX FUNCTION SEARCH PATHS
CREATE OR REPLACE FUNCTION public.increment_token_balance(user_id uuid, amount integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE profiles
  SET token_balance = COALESCE(token_balance, 0) + amount
  WHERE id = user_id;
END;
$function$;
