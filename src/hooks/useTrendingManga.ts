import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface TrendingManga {
  id: string;
  title: string;
  slug: string;
  cover_url: string;
  type: string;
  view_count: number;
}

export function useTrendingManga(limit = 6) {
  return useQuery({
    queryKey: ['trending-manga', limit],
    queryFn: async () => {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

      // Get view counts for last 24h
      const { data: views24h } = await supabase
        .from('manga_views' as any)
        .select('manga_id')
        .gte('created_at', last24h);

      // Count views per manga
      const countMap24h = new Map<string, number>();
      ((views24h as any[]) || []).forEach((v: any) => {
        countMap24h.set(v.manga_id, (countMap24h.get(v.manga_id) || 0) + 1);
      });

      // Sort by count descending
      let ranked = Array.from(countMap24h.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit);

      // If fewer than limit, fill from last 7 days
      if (ranked.length < limit) {
        const existingIds = new Set(ranked.map(r => r[0]));
        const { data: views7d } = await supabase
          .from('manga_views' as any)
          .select('manga_id')
          .gte('created_at', last7d);

        const countMap7d = new Map<string, number>();
        ((views7d as any[]) || []).forEach((v: any) => {
          if (!existingIds.has(v.manga_id)) {
            countMap7d.set(v.manga_id, (countMap7d.get(v.manga_id) || 0) + 1);
          }
        });

        const extra = Array.from(countMap7d.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, limit - ranked.length);
        ranked = [...ranked, ...extra];
      }

      if (ranked.length === 0) return [];

      // Fetch manga details
      const mangaIds = ranked.map(r => r[0]);
      const { data: mangaData } = await supabase
        .from('manga')
        .select('id, title, slug, cover_url, type')
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
