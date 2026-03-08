import { Coins, Eye, Share2, Star, Trophy } from 'lucide-react';

const EARN_METHODS = [
  { icon: Eye, title: 'Daily Reading', desc: 'Read chapters daily to earn coins automatically.' },
  { icon: Star, title: 'Daily Check-in', desc: 'Log in every day to claim bonus tickets.' },
  { icon: Share2, title: 'Share Series', desc: 'Share your favorite series with friends for bonus coins.' },
  { icon: Trophy, title: 'Complete Missions', desc: 'Finish reading milestones to unlock ticket rewards.' },
];

export default function EarnCoins() {
  return (
    <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Coins className="w-7 h-7 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Earn Coins & Tickets</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {EARN_METHODS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border/60 bg-card p-6 flex flex-col gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
