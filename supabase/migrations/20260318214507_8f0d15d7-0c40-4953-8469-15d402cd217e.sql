
-- Create manga_views table for view tracking
CREATE TABLE public.manga_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  manga_id uuid NOT NULL REFERENCES public.manga(id) ON DELETE CASCADE,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for trending queries (last 24h/7d counts by manga)
CREATE INDEX idx_manga_views_created_at ON public.manga_views (created_at DESC);
CREATE INDEX idx_manga_views_manga_id ON public.manga_views (manga_id);
CREATE INDEX idx_manga_views_dedup ON public.manga_views (user_id, manga_id, created_at DESC);

-- RLS: anyone can insert (guests too), anyone can read
ALTER TABLE public.manga_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views" ON public.manga_views
  FOR INSERT TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can read views" ON public.manga_views
  FOR SELECT TO public
  USING (true);
