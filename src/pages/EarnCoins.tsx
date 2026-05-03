import { Icon } from '@iconify/react';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Navigate } from 'react-router-dom';

export default function EarnCoins() {
  const { user, isAuthenticated, setShowLoginModal } = useAuth();
  const { settings } = usePremiumSettings();
  const tokensUiEnabled = settings.token_settings.enable_tokens_ui ?? true;
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);

  const cycleDays = settings.token_settings.checkin_cycle_days;
  const checkinReward = settings.token_settings.checkin_reward;
  const streakEnabled = settings.token_settings.comment_streak_enabled;
  const streakDays = settings.token_settings.comment_streak_days;
  const streakReward = settings.token_settings.comment_streak_reward;

  // Fetch token balance
  const { data: profile } = useQuery({
    queryKey: ['earn-profile', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('token_balance, consecutive_comment_days').eq('id', user.id).single();
      return data;
    },
    enabled: !!user,
  });

  // Fetch check-ins for current cycle
  const { data: checkins = [] } = useQuery({
    queryKey: ['user-checkins', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from('user_checkins')
        .select('checked_in_at')
        .eq('user_id', user.id)
        .order('checked_in_at', { ascending: false })
        .limit(cycleDays);
      return data || [];
    },
    enabled: !!user,
  });

  // Calculate which days in the current cycle are completed
  const { claimedDays, canClaimToday } = useMemo(() => {
    if (checkins.length === 0) return { claimedDays: 0, canClaimToday: true };

    // Count recent consecutive daily check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkinDates = checkins.map(c => {
      const d = new Date(c.checked_in_at);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });

    const uniqueDates = [...new Set(checkinDates)].sort((a, b) => b - a);
    const todayTime = today.getTime();
    const alreadyCheckedToday = uniqueDates.includes(todayTime);

    // Count consecutive days backward from today or yesterday
    let count = 0;
    let checkDate = alreadyCheckedToday ? todayTime : todayTime - 86400000;
    
    for (const d of uniqueDates) {
      if (d === checkDate) {
        count++;
        checkDate -= 86400000;
      } else if (d < checkDate) {
        break;
      }
    }

    // Cycle position
    const cyclePos = count % cycleDays;

    return {
      claimedDays: cyclePos,
      canClaimToday: !alreadyCheckedToday,
    };
  }, [checkins, cycleDays]);

  const todayDay = claimedDays + 1;

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (!canClaimToday || claiming) return;

    setClaiming(true);
    try {
      // Check if user can check in (server-side 20h cooldown)
      const { data: canCheckin } = await supabase.rpc('can_user_checkin', { p_user_id: user!.id });
      if (!canCheckin) {
        toast.error('Please wait before checking in again.');
        setClaiming(false);
        return;
      }

      // Insert check-in
      const { error: checkinError } = await supabase.from('user_checkins').insert({ user_id: user!.id });
      if (checkinError) throw checkinError;

      // If completing the cycle, award tokens
      if (todayDay >= cycleDays) {
        await supabase.rpc('secure_increment_tokens', { p_user_id: user!.id, p_amount: checkinReward });
        toast.success(`Cycle complete! You earned ${checkinReward} ticket(s)!`);
      } else {
        toast.success(`Day ${todayDay} checked in!`);
      }

      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['user-checkins'] });
      queryClient.invalidateQueries({ queryKey: ['earn-profile'] });
    } catch (err: any) {
      toast.error(err.message || 'Check-in failed');
    }
    setClaiming(false);
  };

  // Build daily rewards array dynamically
  const dailyRewards = Array.from({ length: cycleDays }, (_, i) => ({
    day: i + 1,
    label: i + 1 === cycleDays ? `${checkinReward} Ticket` : '—',
    reward: i + 1 === cycleDays,
  }));

  const tokenBalance = profile?.token_balance ?? 0;
  const commentStreak = profile?.consecutive_comment_days ?? 0;
  const streakProgress = Math.min(commentStreak, streakDays);
  const streakComplete = streakProgress >= streakDays;

  if (!tokensUiEnabled) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Icon icon="ph:ticket-bold" className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earn Rewards</h1>
            <p className="text-sm text-muted-foreground">Complete tasks to earn free tickets</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2">
          <Icon icon="ph:ticket-bold" className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm text-foreground">{tokenBalance}</span>
        </div>
      </div>

      {/* Daily Check-in */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Icon icon="ph:gift-bold" className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Daily Check-in</h2>
          <span className="text-xs text-muted-foreground ml-2">Day {Math.min(todayDay, cycleDays)} / {cycleDays}</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
          <div className={`grid gap-2 sm:gap-3 mb-5`} style={{ gridTemplateColumns: `repeat(${cycleDays}, minmax(0, 1fr))` }}>
            {dailyRewards.map((r) => {
              const claimed = r.day <= claimedDays;
              const isToday = r.day === todayDay && canClaimToday;
              const locked = r.day > todayDay;

              return (
                <div
                  key={r.day}
                  className={`relative flex flex-col items-center rounded-xl p-3 sm:p-4 transition-all duration-200 ${
                    claimed
                      ? 'bg-primary/10 border border-primary/30'
                      : isToday
                      ? 'bg-accent border-2 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-muted/40 border border-border/40 opacity-60'
                  }`}
                >
                  <span className="text-xs font-semibold text-muted-foreground mb-1.5">Day {r.day}</span>
                  <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-1.5 ${
                    claimed ? 'bg-primary/20' : isToday ? 'bg-primary/15' : 'bg-muted/60'
                  }`}>
                    {claimed ? (
                      <Icon icon="ph:check-circle-bold" className="w-5 h-5 text-primary" />
                    ) : locked ? (
                      <Icon icon="ph:lock-key-bold" className="w-4 h-4 text-muted-foreground/50" />
                    ) : r.reward ? (
                      <Icon icon="ph:ticket-bold" className="w-5 h-5 text-primary" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${claimed ? 'text-primary' : isToday ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {r.label}
                  </span>
                  {r.reward && !claimed && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      REWARD
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {!isAuthenticated
                ? 'Log in to start checking in!'
                : canClaimToday
                ? `Check in for Day ${todayDay}${todayDay === cycleDays ? ' to earn your ticket!' : ''}`
                : claimedDays >= cycleDays
                ? "Cycle complete! Resets tomorrow 🎉"
                : "Already checked in today! Come back tomorrow."}
            </p>
            <Button onClick={handleClaim} disabled={!canClaimToday || claiming} className="rounded-xl px-6 gap-2">
              <Icon icon="ph:gift-bold" className="w-4 h-4" />
              {claiming ? 'Claiming...' : canClaimToday ? 'Check In' : 'Done'}
            </Button>
          </div>
        </div>
      </section>

      {/* Mission */}
      {streakEnabled && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Icon icon="ph:trophy-bold" className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Mission</h2>
          </div>

          <div className="flex flex-col gap-3">
            <div className={`rounded-2xl border bg-card p-4 sm:p-5 flex items-center gap-4 transition-all duration-200 ${
              streakComplete ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/60'
            }`}>
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                streakComplete ? 'bg-primary/15' : 'bg-muted/50'
              }`}>
                <Icon icon="ph:chat-teardrop-dots-bold" className={`w-5 h-5 ${streakComplete ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className={`font-semibold text-sm ${streakComplete ? 'text-primary' : 'text-foreground'}`}>
                    Comment Streak
                  </h3>
                  {streakComplete && <Icon icon="ph:check-circle-bold" className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground mb-2">Leave a comment for {streakDays} days in a row</p>
                <div className="flex items-center gap-3">
                  <Progress value={Math.round((streakProgress / streakDays) * 100)} className="h-1.5 flex-1" />
                  <span className="text-xs font-medium text-muted-foreground shrink-0">
                    {streakProgress}/{streakDays}
                  </span>
                </div>
              </div>
              <div className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                streakComplete ? 'bg-primary/15 text-primary' : 'bg-muted/50 text-muted-foreground'
              }`}>
                {streakReward} Ticket
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
