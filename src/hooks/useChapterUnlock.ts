import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useChapterUnlock(chapterId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: isUnlocked = false, isLoading } = useQuery({
    queryKey: ['chapter-unlock', chapterId, user?.id],
    queryFn: async () => {
      if (!user || !chapterId) return false;
      const { data } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .gt('expires_at', new Date().toISOString())
        .limit(1);
      // Also check permanent unlocks (expires_at is null)
      const { data: permanent } = await supabase
        .from('chapter_unlocks')
        .select('id')
        .eq('chapter_id', chapterId)
        .eq('user_id', user.id)
        .is('expires_at', null)
        .limit(1);
      return (data?.length ?? 0) > 0 || (permanent?.length ?? 0) > 0;
    },
    enabled: !!user && !!chapterId,
  });

  const unlock = useMutation({
    mutationFn: async ({ chapterId }: { chapterId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('unlock_chapter_with_coins', {
        p_user_id: user.id,
        p_chapter_id: chapterId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Unlock failed');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter-unlock'] });
      queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
      queryClient.invalidateQueries({ queryKey: ['user-balances'] });
      queryClient.invalidateQueries({ queryKey: ['earn-profile'] });
    },
  });

  const unlockWithToken = useMutation({
    mutationFn: async ({ chapterId }: { chapterId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.rpc('unlock_chapter_with_token', {
        p_user_id: user.id,
        p_chapter_id: chapterId,
      });
      if (error) throw error;
      const result = data as any;
      if (!result.success) {
        throw new Error(result.error || 'Unlock failed');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter-unlock'] });
      queryClient.invalidateQueries({ queryKey: ['user-balances'] });
      queryClient.invalidateQueries({ queryKey: ['earn-profile'] });
    },
  });

  return { isUnlocked, isLoading, unlock, unlockWithToken };
}

export function useUserCoinBalance() {
  const { user } = useAuth();
  const { data: balance = 0 } = useQuery({
    queryKey: ['coin-balance', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase.from('profiles').select('coin_balance').eq('id', user.id).single();
      return data?.coin_balance ?? 0;
    },
    enabled: !!user,
  });
  return balance;
}

export function useUserTokenBalance() {
  const { user } = useAuth();
  const { data: balance = 0 } = useQuery({
    queryKey: ['token-balance', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase.from('profiles').select('token_balance').eq('id', user.id).single();
      return data?.token_balance ?? 0;
    },
    enabled: !!user,
  });
  return balance;
}
