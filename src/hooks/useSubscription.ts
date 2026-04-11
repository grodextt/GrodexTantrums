import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export function useUserSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-subscription', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*, subscription_plans(*)')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('expires_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useHasActiveSubscription() {
  const { data: sub, isLoading } = useUserSubscription();
  return { isSubscriber: !!sub, isLoading, subscription: sub };
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ['subscription-plans-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('duration_days', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useSubscriptionStats() {
  return useQuery({
    queryKey: ['subscription-stats'],
    queryFn: async () => {
      // Count active subscribers
      const { count: subCount } = await supabase
        .from('user_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString());

      // Count subscription chapters
      const { count: chapterCount } = await supabase
        .from('chapters')
        .select('*', { count: 'exact', head: true })
        .eq('is_subscription', true);

      return {
        activeSubscribers: subCount || 0,
        subscriptionChapters: chapterCount || 0,
      };
    },
  });
}
