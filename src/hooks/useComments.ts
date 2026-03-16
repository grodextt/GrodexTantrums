import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CommentRow {
  id: string;
  manga_id: string;
  chapter_id: string | null;
  user_id: string;
  parent_id: string | null;
  context_type: string | null;
  context_id: string | null;
  text: string;
  likes_count: number;
  is_pinned: boolean;
  created_at: string;
  profile?: { display_name: string | null; avatar_url: string | null } | null;
  is_admin?: boolean;
  user_has_liked?: boolean;
  replies?: CommentRow[];
}

interface UseCommentsOptions {
  mangaId?: string;
  contextType: 'manga' | 'chapter';
  contextId: string;
}

export const useComments = (mangaId: string | undefined, contextType?: 'manga' | 'chapter', contextId?: string) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const effectiveContextType = contextType || 'manga';
  const effectiveContextId = contextId || mangaId || '';

  const queryKey = ['comments', effectiveContextType, effectiveContextId];

  const { data: comments = [], isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!effectiveContextId) return [];

      let query = supabase
        .from('comments')
        .select('*')
        .eq('context_type', effectiveContextType)
        .eq('context_id', effectiveContextId)
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      const userIds = [...new Set((data || []).map(c => c.user_id))];
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await (supabase
          .from('profiles_public' as any)
          .select('id, display_name, avatar_url')
          .in('id', userIds)) as any;
        (profiles || []).forEach(p => { profilesMap[p.id] = p; });
      }

      let adminUserIds: string[] = [];
      if (userIds.length > 0) {
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'admin')
          .in('user_id', userIds);
        adminUserIds = (roles || []).map(r => r.user_id);
      }

      let userLikes: string[] = [];
      if (user) {
        const { data: likes } = await supabase
          .from('comment_likes')
          .select('comment_id')
          .eq('user_id', user.id);
        userLikes = (likes || []).map(l => l.comment_id);
      }

      const enriched = (data || []).map(c => ({
        ...c,
        is_admin: adminUserIds.includes(c.user_id),
        user_has_liked: userLikes.includes(c.id),
        profile: profilesMap[c.user_id] || null,
      })) as CommentRow[];

      const topLevel = enriched.filter(c => !c.parent_id);
      const replies = enriched.filter(c => c.parent_id);

      topLevel.forEach(c => {
        c.replies = replies
          .filter(r => r.parent_id === c.id)
          .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      });

      return topLevel;
    },
    enabled: !!effectiveContextId,
  });

  const addComment = useMutation({
    mutationFn: async ({ text, parentId, mentions }: { text: string; parentId?: string; mentions?: string[] }) => {
      if (!user || !mangaId) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('comments')
        .insert({
          manga_id: mangaId,
          user_id: user.id,
          parent_id: parentId || null,
          text,
          context_type: effectiveContextType,
          context_id: effectiveContextId,
        })
        .select()
        .single();
      if (error) throw error;

      // If replying, create notification for parent comment author
      if (parentId) {
        const parentComment = comments.find(c => c.id === parentId) ||
          comments.flatMap(c => c.replies || []).find(r => r.id === parentId);
        if (parentComment && parentComment.user_id !== user.id) {
          await supabase.from('notifications').insert({
            user_id: parentComment.user_id,
            type: 'comment_reply' as any,
            manga_id: mangaId,
            comment_id: data.id,
            title: 'New reply to your comment',
            message: text.slice(0, 100),
          });
        }
      }

      // Handle @mentions
      if (mentions && mentions.length > 0) {
        const { data: mentionedProfiles } = await (supabase
          .from('profiles_public' as any)
          .select('id, display_name')
          .in('display_name', mentions)) as any;

        if (mentionedProfiles) {
          const notifications = mentionedProfiles
            .filter(p => p.id !== user.id)
            .map(p => ({
              user_id: p.id,
              type: 'comment_reply' as any,
              manga_id: mangaId,
              comment_id: data.id,
              title: `${user.user_metadata?.full_name || 'Someone'} mentioned you`,
              message: text.slice(0, 100),
            }));

          if (notifications.length > 0) {
            await supabase.from('notifications').insert(notifications);
          }
        }
      }

      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const editComment = useMutation({
    mutationFn: async ({ commentId, text }: { commentId: string; text: string }) => {
      const { error } = await supabase
        .from('comments')
        .update({ text })
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteComment = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const toggleLike = useMutation({
    mutationFn: async ({ commentId, hasLiked }: { commentId: string; hasLiked: boolean }) => {
      if (!user) throw new Error('Not authenticated');
      if (hasLiked) {
        await supabase.from('comment_likes').delete().eq('comment_id', commentId).eq('user_id', user.id);
      } else {
        await supabase.from('comment_likes').insert({ comment_id: commentId, user_id: user.id });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const togglePin = useMutation({
    mutationFn: async ({ commentId, isPinned }: { commentId: string; isPinned: boolean }) => {
      await supabase.from('comments').update({ is_pinned: !isPinned }).eq('id', commentId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return { comments, isLoading, addComment, toggleLike, togglePin, editComment, deleteComment };
};
