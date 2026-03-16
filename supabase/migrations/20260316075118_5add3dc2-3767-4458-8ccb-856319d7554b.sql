
-- 1. CHAPTERS: Remove the public SELECT policy, rely on chapters_public view + get_chapter_pages RPC
DROP POLICY IF EXISTS "Anyone can read chapters" ON chapters;

-- Only admins can directly query the chapters table (for admin panel operations)
CREATE POLICY "Admins can read chapters directly" ON chapters
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 2. BLOCKED_IPS: Remove public read, keep admin-only
DROP POLICY IF EXISTS "Anyone can read blocked_ips" ON blocked_ips;
