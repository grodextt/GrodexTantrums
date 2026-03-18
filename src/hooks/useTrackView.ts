import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Tracks a view for a manga. Deduplicates: same user+manga max once per hour.
 * For guests, user_id is null — no dedup (could add IP-based later).
 */
export function useTrackView(mangaId: string | undefined) {
  const { user } = useAuth();
  const tracked = useRef<string | null>(null);

  useEffect(() => {
    if (!mangaId || tracked.current === mangaId) return;
    tracked.current = mangaId;

    const record = async () => {
      const userId = user?.id ?? null;

      // Dedup: check if this user already viewed this manga in the last hour
      if (userId) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
          .from('manga_views' as any)
          .select('id')
          .eq('manga_id', mangaId)
          .eq('user_id', userId)
          .gte('created_at', oneHourAgo)
          .limit(1);
        if (existing && existing.length > 0) return;
      }

      await supabase.from('manga_views' as any).insert({
        manga_id: mangaId,
        user_id: userId,
      } as any);
    };

    record();
  }, [mangaId, user?.id]);
}
