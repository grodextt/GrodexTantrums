import { useState } from 'react';
import { Coins, Eye, Share2, Star, Trophy, Gift, CheckCircle2, Lock, Flame, BookOpen, Clock, Ticket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

/* ─── 7-day check-in rewards ─── */
const DAILY_REWARDS = [
  { day: 1, coins: 5, label: '5 Coins' },
  { day: 2, coins: 5, label: '5 Coins' },
  { day: 3, coins: 10, label: '10 Coins' },
  { day: 4, coins: 10, label: '10 Coins' },
  { day: 5, coins: 15, label: '15 Coins' },
  { day: 6, coins: 20, label: '20 Coins' },
  { day: 7, coins: 0, tickets: 1, label: '1 Ticket', special: true },
];

/* ─── Missions ─── */
const MISSIONS = [
  { id: 1, icon: BookOpen, title: 'Read 3 Chapters', desc: 'Read any 3 chapters today', reward: '10 Coins', progress: 2, total: 3, type: 'daily' as const },
  { id: 2, icon: Eye, title: 'Visit 5 Series Pages', desc: 'Browse through 5 different series', reward: '8 Coins', progress: 5, total: 5, type: 'daily' as const, completed: true },
  { id: 3, icon: Clock, title: 'Spend 15 Minutes Reading', desc: 'Accumulate 15 min of reading time', reward: '12 Coins', progress: 9, total: 15, type: 'daily' as const },
  { id: 4, icon: Share2, title: 'Share a Series', desc: 'Share any series with a friend', reward: '15 Coins', progress: 0, total: 1, type: 'daily' as const },
  { id: 5, icon: Trophy, title: 'Read 50 Chapters', desc: 'Complete 50 chapters total', reward: '1 Ticket', progress: 34, total: 50, type: 'weekly' as const },
  { id: 6, icon: Flame, title: '7-Day Streak', desc: 'Log in 7 days in a row', reward: '2 Tickets', progress: 4, total: 7, type: 'weekly' as const },
  { id: 7, icon: Star, title: 'Rate 10 Series', desc: 'Leave ratings on 10 different series', reward: '1 Ticket', progress: 6, total: 10, type: 'weekly' as const },
];

export default function EarnCoins() {
  const [claimedDay, setClaimedDay] = useState(3); // mock: user claimed up to day 3
  const [missionTab, setMissionTab] = useState<'daily' | 'weekly'>('daily');

  const todayDay = claimedDay + 1; // next day to claim
  const canClaim = todayDay <= 7;

  const handleClaim = () => {
    if (canClaim) setClaimedDay(todayDay);
  };

  const filteredMissions = MISSIONS.filter(m => m.type === missionTab);

  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-primary/15 flex items-center justify-center">
            <Coins className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Earn Rewards</h1>
            <p className="text-sm text-muted-foreground">Complete tasks to earn coins & tickets</p>
          </div>
        </div>

        {/* Balance pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2">
            <Coins className="w-4 h-4 text-coin-gold" />
            <span className="font-semibold text-sm text-foreground">240</span>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2">
            <Ticket className="w-4 h-4 text-primary" />
            <span className="font-semibold text-sm text-foreground">3</span>
          </div>
        </div>
      </div>

      {/* ──────── Daily Check-in ──────── */}
      <section className="mb-10">
        <div className="flex items-center gap-2 mb-4">
          <Gift className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Daily Check-in</h2>
          <span className="text-xs text-muted-foreground ml-2">Day {Math.min(claimedDay + 1, 7)} / 7</span>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 sm:p-6">
          {/* 7-day row */}
          <div className="grid grid-cols-7 gap-2 sm:gap-3 mb-5">
            {DAILY_REWARDS.map((r) => {
              const claimed = r.day <= claimedDay;
              const isToday = r.day === todayDay;
              const locked = r.day > todayDay;

              return (
                <div
                  key={r.day}
                  className={`relative flex flex-col items-center rounded-xl p-2 sm:p-3 transition-all duration-200 ${
                    claimed
                      ? 'bg-primary/10 border border-primary/30'
                      : isToday
                      ? 'bg-accent border-2 border-primary shadow-md ring-2 ring-primary/20'
                      : 'bg-muted/40 border border-border/40 opacity-60'
                  }`}
                >
                  <span className="text-[10px] sm:text-xs font-semibold text-muted-foreground mb-1">
                    Day {r.day}
                  </span>

                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-1 ${
                    claimed ? 'bg-primary/20' : isToday ? 'bg-primary/15' : 'bg-muted/60'
                  }`}>
                    {claimed ? (
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    ) : locked ? (
                      <Lock className="w-4 h-4 text-muted-foreground/50" />
                    ) : r.special ? (
                      <Ticket className="w-5 h-5 text-primary" />
                    ) : (
                      <Coins className="w-5 h-5 text-yellow-500" />
                    )}
                  </div>

                  <span className={`text-[10px] sm:text-xs font-medium ${
                    claimed ? 'text-primary' : isToday ? 'text-foreground' : 'text-muted-foreground'
                  }`}>
                    {r.label}
                  </span>

                  {r.special && !claimed && (
                    <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full">
                      BONUS
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Claim button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {canClaim
                ? `Claim your Day ${todayDay} reward!`
                : "You've completed this week's check-in! 🎉"}
            </p>
            <Button
              onClick={handleClaim}
              disabled={!canClaim}
              className="rounded-xl px-6 gap-2"
            >
              <Gift className="w-4 h-4" />
              {canClaim ? 'Claim Reward' : 'All Claimed'}
            </Button>
          </div>
        </div>
      </section>

      {/* ──────── Missions ──────── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Missions</h2>
          </div>

          {/* Tab toggle */}
          <div className="flex rounded-xl bg-muted/60 border border-border/40 p-1">
            {(['daily', 'weekly'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMissionTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  missionTab === tab
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'daily' ? 'Daily' : 'Weekly'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {filteredMissions.map((mission) => {
            const pct = Math.round((mission.progress / mission.total) * 100);
            const done = mission.completed || mission.progress >= mission.total;

            return (
              <div
                key={mission.id}
                className={`rounded-2xl border bg-card p-4 sm:p-5 flex items-center gap-4 transition-all duration-200 ${
                  done ? 'border-primary/30 bg-primary/[0.03]' : 'border-border/60'
                }`}
              >
                {/* Icon */}
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  done ? 'bg-primary/15' : 'bg-muted/50'
                }`}>
                  <mission.icon className={`w-5 h-5 ${done ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className={`font-semibold text-sm ${done ? 'text-primary' : 'text-foreground'}`}>
                      {mission.title}
                    </h3>
                    {done && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{mission.desc}</p>
                  <div className="flex items-center gap-3">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-xs font-medium text-muted-foreground shrink-0">
                      {mission.progress}/{mission.total}
                    </span>
                  </div>
                </div>

                {/* Reward */}
                <div className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                  done
                    ? 'bg-primary/15 text-primary'
                    : 'bg-muted/50 text-muted-foreground'
                }`}>
                  {mission.reward}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
