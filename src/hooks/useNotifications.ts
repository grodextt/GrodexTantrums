import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Notification {
  id: string;
  user_id: string;
  type: 'chapter_update' | 'comment_reply';
  manga_id: string | null;
  chapter_id: string | null;
  comment_id: string | null;
  title: string;
  message: string;
  is_read: boolean;
  is_premium: boolean;
  created_at: string;
  manga?: { title: string; cover_url: string; slug: string } | null;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('notifications')
        .select('*, manga:manga_id(title, cover_url, slug)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as unknown as Notification[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
      if (error) throw error;
    },
  const clearAll = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead, clearAll };
};

export const useMangaSubscription = (mangaId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isSubscribed = false } = useQuery({
    queryKey: ['manga-subscription', mangaId, user?.id],
    queryFn: async () => {
      if (!user || !mangaId) return false;
      const { data } = await supabase
        .from('manga_subscriptions')
        .select('id')
        .eq('user_id', user.id)
        .eq('manga_id', mangaId)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user && !!mangaId,
  });

  const toggleSubscription = useMutation({
    mutationFn: async () => {
      if (!user || !mangaId) return;
      if (isSubscribed) {
        await supabase
          .from('manga_subscriptions')
          .delete()
          .eq('user_id', user.id)
          .eq('manga_id', mangaId);
      } else {
        await supabase
          .from('manga_subscriptions')
          .insert({ user_id: user.id, manga_id: mangaId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manga-subscription', mangaId] });
    },
  });

  return { isSubscribed, toggleSubscription };
};
