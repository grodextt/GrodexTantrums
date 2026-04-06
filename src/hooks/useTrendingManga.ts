import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrendingManga {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  type: string;
  view_count: number;
  genres: string[] | null;
  status: string | null;
}

export function useTrendingManga(limit = 6) {
  return useQuery({
    queryKey: ['trending-manga', limit],
    queryFn: async () => {
      const now = new Date();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get view counts for last 7 days (weekly popularity)
      const { data: views7d } = await supabase
        .from('manga_views') // Remove 'as any' if possible or keep if needed for lint
        .select('manga_id')
        .gte('created_at', last7d);

      // Count views per manga
      const countMap = new Map<string, number>();
      ((views7d as any[]) || []).forEach((v: any) => {
        countMap.set(v.manga_id, (countMap.get(v.manga_id) || 0) + 1);
      });

      // Sort by count descending
      let ranked = Array.from(countMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // If fewer than limit, fill from all-time most viewed manga
      if (ranked.length < limit) {
        const existingIds = new Set(ranked.map(r => r[0]));
        const { data: topAllTime } = await supabase
          .from('manga')
          .select('id')
          .order('views', { ascending: false })
          .limit(limit);

        const extra = (topAllTime || [])
          .filter(m => !existingIds.has(m.id))
          .map(m => [m.id, 0] as [string, number])
          .slice(0, limit - ranked.length);
        ranked = [...ranked, ...extra];
      }

      if (ranked.length === 0) return [];

      // Fetch manga details
      const mangaIds = ranked.map(r => r[0]);
      const { data: mangaData } = await supabase
        .from('manga')
        .select('id, title, slug, cover_url, type, genres, status')
        .in('id', mangaIds);

      if (!mangaData) return [];

      // Merge and preserve order
      const mangaMap = new Map(mangaData.map(m => [m.id, m]));
      return ranked
        .map(([id, count]) => {
          const m = mangaMap.get(id);
          if (!m) return null;
          return { ...m, view_count: count } as TrendingManga;
        })
        .filter(Boolean) as TrendingManga[];
    },
    staleTime: 2 * 60 * 1000, // 2 min
  });
}
