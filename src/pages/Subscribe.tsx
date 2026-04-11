import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useSubscriptionStats, useHasActiveSubscription } from '@/hooks/useSubscription';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const PLAN_COLORS = [
  { border: 'border-blue-500/30', bg: 'bg-blue-500/5', accent: 'text-blue-500', glow: 'shadow-blue-500/10', btnBg: 'bg-blue-600 hover:bg-blue-500' },
  { border: 'border-purple-500/30', bg: 'bg-purple-500/5', accent: 'text-purple-500', glow: 'shadow-purple-500/10', btnBg: 'bg-purple-600 hover:bg-purple-500' },
  { border: 'border-amber-500/30', bg: 'bg-amber-500/5', accent: 'text-amber-500', glow: 'shadow-amber-500/10', btnBg: 'bg-amber-600 hover:bg-amber-500' },
];

const FAQ = [
  { q: 'What happens when my subscription expires?', a: 'You lose access to subscriber-only chapters. Any bonus coins you received are yours to keep. Chapters that have passed their free release date remain accessible.' },
  { q: 'Can I use coins to unlock subscriber chapters?', a: 'No. Subscriber-only chapters are exclusive to active subscribers and cannot be unlocked with coins or streak tokens.' },
  { q: 'Do I get a refund if I cancel early?', a: 'Subscriptions are non-refundable but you retain access until the end of your billing period.' },
  { q: 'Will subscriber chapters eventually become free?', a: 'Yes, most subscriber-only chapters have a free release countdown. Once it expires, everyone can read them for free.' },
];

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: stats } = useSubscriptionStats();
  const { isSubscriber, subscription } = useHasActiveSubscription();
  const { settings: premiumSettings } = usePremiumSettings();
  const { settings: siteSettings } = useSiteSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const subName = premiumSettings?.subscription_settings?.subscription_name || 'Subscription';
  const badgeLabel = premiumSettings?.subscription_settings?.badge_label || 'Early Access';
  const showSubCount = premiumSettings?.subscription_settings?.show_subscriber_count ?? true;
  const bonusCoinsEnabled = premiumSettings?.subscription_settings?.bonus_coins_enabled ?? true;
  const doubleDailyLogin = premiumSettings?.subscription_settings?.double_daily_login_enabled ?? true;
  const siteName = siteSettings?.general?.site_name || 'MangaZ';

  const handleSubscribe = (planId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    // TODO: integrate payment flow in Phase 4
    navigate(`/subscribe/checkout/${planId}`);
  };

  return (
    <div className="min-h-screen bg-[#0f1117] text-gray-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-40 right-1/4 w-56 h-56 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 pt-20 pb-16 text-center space-y-8">
          <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 w-fit mx-auto">
            <Icon icon="mdi:new-releases" className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">{badgeLabel}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
            Join <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">{siteName} {subName}</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Get early access to the latest chapters before anyone else. Support the creators and enjoy exclusive subscriber benefits.
          </p>

          {isSubscriber && subscription && (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <Icon icon="ph:check-circle-fill" className="w-6 h-6 text-emerald-500" />
              <div className="text-left">
                <p className="text-sm font-bold text-emerald-400">Active Subscriber</p>
                <p className="text-xs text-gray-400">
                  Expires {new Date(subscription.expires_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Stats Bar */}
      <section className="max-w-4xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {showSubCount && (
            <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
              <p className="text-2xl font-black text-purple-400">{stats?.activeSubscribers || 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Active Members</p>
            </div>
          )}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <p className="text-2xl font-black text-blue-400">{stats?.subscriptionChapters || 0}</p>
            <p className="text-xs text-gray-500 font-medium mt-1">{badgeLabel} Chapters</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 text-center">
            <p className="text-2xl font-black text-amber-400">24/7</p>
            <p className="text-xs text-gray-500 font-medium mt-1">Instant Access</p>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-4xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-center mb-8">Why Subscribe?</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            { icon: 'ph:lightning-bold', title: 'Early Access', desc: 'Read new chapters the moment they drop, before free release.', color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ...(bonusCoinsEnabled ? [{ icon: 'ph:coins-bold', title: 'Bonus Coins', desc: 'Get bonus coins with every subscription purchase.', color: 'text-amber-400', bg: 'bg-amber-500/10' }] : []),
            ...(doubleDailyLogin ? [{ icon: 'ph:star-bold', title: '2× Daily Rewards', desc: 'Double your daily login rewards while subscribed.', color: 'text-blue-400', bg: 'bg-blue-500/10' }] : []),
            { icon: 'ph:heart-bold', title: 'Support Creators', desc: 'Your subscription directly supports the artists and translators.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
            { icon: 'ph:shield-check-bold', title: 'No Ads', desc: 'Enjoy an ad-free reading experience.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { icon: 'ph:clock-countdown-bold', title: 'Countdown Timers', desc: 'See exactly when chapters become free for everyone.', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
          ].map((b, i) => (
            <div key={i} className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors space-y-3">
              <div className={`w-10 h-10 rounded-xl ${b.bg} flex items-center justify-center`}>
                <Icon icon={b.icon} className={`w-5 h-5 ${b.color}`} />
              </div>
              <h3 className="font-bold text-sm">{b.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-black">Choose Your Plan</h2>
          <p className="text-gray-400 mt-2">Cancel anytime. Keep your bonus coins forever.</p>
        </div>

        {plansLoading ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon="ph:spinner-bold" className="w-8 h-8 animate-spin mx-auto" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Icon icon="ph:info-bold" className="w-8 h-8 mx-auto mb-3" />
            <p className="text-sm">No subscription plans available yet. Check back soon!</p>
          </div>
        ) : (
          <div className={`grid gap-6 ${plans.length === 1 ? 'max-w-sm mx-auto' : plans.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            {plans.map((plan, idx) => {
              const c = PLAN_COLORS[idx % PLAN_COLORS.length];
              const isPopular = idx === Math.min(1, plans.length - 1);
              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl border ${c.border} ${c.bg} p-7 space-y-6 transition-all hover:scale-[1.02] shadow-lg ${c.glow} ${isPopular ? 'ring-2 ring-purple-500/30' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-purple-600 text-white text-[10px] font-bold uppercase tracking-widest shadow-lg">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <h3 className={`text-xl font-black ${c.accent}`}>{plan.name}</h3>
                    {plan.description && <p className="text-xs text-gray-400 mt-1">{plan.description}</p>}
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">${Number(plan.price_usd).toFixed(2)}</span>
                    <span className="text-sm text-gray-500">/ {plan.duration_days} days</span>
                  </div>

                  <ul className="space-y-2.5">
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <Icon icon="ph:check-circle-fill" className={`w-4 h-4 ${c.accent} shrink-0`} /> Full {badgeLabel} access
                    </li>
                    {plan.bonus_coins > 0 && bonusCoinsEnabled && (
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Icon icon="ph:check-circle-fill" className={`w-4 h-4 ${c.accent} shrink-0`} /> +{plan.bonus_coins} Bonus Coins
                      </li>
                    )}
                    {doubleDailyLogin && (
                      <li className="flex items-center gap-2 text-sm text-gray-300">
                        <Icon icon="ph:check-circle-fill" className={`w-4 h-4 ${c.accent} shrink-0`} /> 2× Daily Rewards
                      </li>
                    )}
                    <li className="flex items-center gap-2 text-sm text-gray-300">
                      <Icon icon="ph:check-circle-fill" className={`w-4 h-4 ${c.accent} shrink-0`} /> Support Creators
                    </li>
                  </ul>

                  <Button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isSubscriber}
                    className={`w-full h-12 rounded-xl font-bold text-base text-white ${c.btnBg} shadow-lg transition-all`}
                  >
                    {isSubscriber ? 'Already Subscribed' : 'Subscribe Now'}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-10">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            { step: '01', title: 'Choose a Plan', desc: 'Pick the duration that works best for you.', icon: 'ph:cursor-click-bold' },
            { step: '02', title: 'Complete Payment', desc: 'Pay securely with PayPal or USDT.', icon: 'ph:credit-card-bold' },
            { step: '03', title: 'Start Reading', desc: 'Instantly unlock all subscriber-only chapters.', icon: 'ph:book-open-bold' },
          ].map((s, i) => (
            <div key={i} className="text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto">
                <Icon icon={s.icon} className="w-7 h-7 text-purple-400" />
              </div>
              <p className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em]">Step {s.step}</p>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
        <div className="space-y-3">
          {FAQ.map((faq, i) => (
            <div key={i} className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                <Icon
                  icon={openFaq === i ? 'ph:minus-bold' : 'ph:plus-bold'}
                  className="w-4 h-4 text-gray-400 shrink-0"
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 -mt-1">
                  <p className="text-sm text-gray-400 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="rounded-3xl bg-gradient-to-br from-purple-900/30 to-blue-900/20 border border-purple-500/10 p-10 sm:p-14 text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl font-black relative z-10">Ready to get started?</h2>
          <p className="text-gray-400 relative z-10 max-w-md mx-auto">Join {stats?.activeSubscribers || 0}+ members and start reading subscriber-only content today.</p>
          <Button
            onClick={() => {
              const el = document.querySelector('#pricing');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="relative z-10 h-14 px-10 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold text-base shadow-lg shadow-purple-500/20"
          >
            View Plans
          </Button>
        </div>
      </section>
    </div>
  );
}
