import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useSubscriptionStats, useHasActiveSubscription } from '@/hooks/useSubscription';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const FAQ = [
  { q: 'What happens when my subscription expires?', a: 'You lose access to subscriber-only chapters. Any bonus coins you received are yours to keep. Chapters that have passed their free release date remain accessible.' },
  { q: 'Can I use coins to unlock subscriber chapters?', a: 'No. Subscriber-only chapters are exclusive to active subscribers and cannot be unlocked with coins or streak tokens.' },
  { q: 'Do I get a refund if I cancel early?', a: 'Subscriptions are non-refundable but you retain access until the end of your billing period.' },
  { q: 'Will subscriber chapters eventually become free?', a: 'Yes, most subscriber-only chapters have a free release countdown. Once it expires, everyone can read them for free.' },
];

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: stats } = useSubscriptionStats();
  const { isSubscriber, subscription } = useHasActiveSubscription();
  const { settings: premiumSettings } = usePremiumSettings();
  const { settings: siteSettings } = useSiteSettings();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const subName = premiumSettings?.subscription_settings?.subscription_name || 'Subscription';
  const badgeLabel = premiumSettings?.subscription_settings?.badge_label || 'Early Access';
  const showSubCount = premiumSettings?.subscription_settings?.show_subscriber_count ?? true;
  const bonusCoinsEnabled = premiumSettings?.subscription_settings?.bonus_coins_enabled ?? true;
  const doubleDailyLogin = premiumSettings?.subscription_settings?.double_daily_login_enabled ?? true;
  const siteName = siteSettings?.general?.site_name || 'Grodex Tantrums';

  const handleSubscribe = (planId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/subscribe/checkout/${planId}`);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full animate-pulse [animation-delay:2s]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 z-10 overflow-hidden">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md shadow-[0_0_20px_rgba(var(--primary),0.1)]">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{badgeLabel} Active</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-[0.9] uppercase italic">
              Level Up Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-400 to-primary bg-[length:200%_auto] animate-gradient-x">
                Reading Experience
              </span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-xl leading-relaxed font-medium">
              Join the elite circle of {siteName}. Get instant access to {badgeLabel} chapters, exclusive rewards, and direct impact on your favorite series.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button 
                size="lg" 
                className="h-16 px-10 rounded-2xl bg-primary text-primary-foreground font-black uppercase tracking-wider text-sm shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:scale-[1.02] transition-all duration-300"
                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Explore Plans
                <Icon icon="ph:arrow-right-bold" className="ml-2 w-5 h-5" />
              </Button>
              <div className="flex -space-x-3 items-center ml-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-[#050505] bg-muted overflow-hidden">
                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
                <span className="pl-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {stats?.activeSubscribers || '500'}+ Members
                </span>
              </div>
            </div>
          </div>

          <div className="relative animate-in fade-in zoom-in duration-1000 delay-300 hidden lg:block">
            <div className="relative z-10 rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-700 bg-black/40 backdrop-blur-xl group">
              <img 
                src="C:\Users\Dreqi\.gemini\antigravity\brain\42a9bd35-fd53-4934-66-427b5b92644b\subscribe_hero_bg_1778938560331.png" 
                alt="Premium" 
                className="w-full aspect-[4/5] object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              <div className="absolute bottom-8 left-8 right-8 p-6 rounded-3xl bg-white/5 backdrop-blur-2xl border border-white/10 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <Icon icon="ph:crown-fill" className="text-white w-4 h-4" />
                  </div>
                  <span className="font-black text-sm uppercase tracking-widest">{subName} Status</span>
                </div>
                <p className="text-xs text-muted-foreground">Unlock thousands of premium panels instantly.</p>
              </div>
            </div>
            {/* Glow effects around the image */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/30 blur-[60px] animate-pulse" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/20 blur-[60px] animate-pulse" />
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter">Subscriber Perks</h2>
            <div className="w-24 h-1.5 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: 'ph:lightning-fill', title: 'Lightning Early Access', desc: 'Read the latest updates 24-48 hours before everyone else.', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
              { icon: 'ph:coins-fill', title: 'Monthly Bonus Tickets', desc: 'Receive recurring coin bonuses to unlock archive content.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
              { icon: 'ph:sparkle-fill', title: 'VIP Community Badge', desc: 'Stand out in the comments with a unique glowing supporter badge.', color: 'text-primary', bg: 'bg-primary/10' },
              { icon: 'ph:shield-star-fill', title: 'Ad-Free Reading', desc: 'A completely clean and immersive reading experience.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { icon: 'ph:rocket-launch-fill', title: 'Direct Creator Support', desc: 'Help us acquire new series and support the hard-working teams.', color: 'text-rose-400', bg: 'bg-rose-500/10' },
              { icon: 'ph:monitor-play-fill', title: 'HD Quality Panels', desc: 'Access ultra-high resolution images for the best viewing experience.', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            ].map((perk, i) => (
              <div key={i} className="group p-8 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] hover:border-primary/30 transition-all duration-500 hover:-translate-y-2">
                <div className={`w-14 h-14 rounded-2xl ${perk.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                  <Icon icon={perk.icon} className={`w-7 h-7 ${perk.color}`} />
                </div>
                <h3 className="text-xl font-bold mb-3 uppercase tracking-tight">{perk.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed font-medium">{perk.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 relative z-10 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter">Choose Your Power</h2>
            <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs">Flexible plans for every type of reader</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {plansLoading ? (
              [1, 2, 3].map(i => <div key={i} className="h-[500px] rounded-[3rem] bg-white/[0.02] animate-pulse border border-white/5" />)
            ) : (
              plans.map((plan, idx) => {
                const isPopular = idx === 1 || plans.length === 1;
                return (
                  <div 
                    key={plan.id}
                    className={`relative p-10 rounded-[3rem] border transition-all duration-500 flex flex-col group ${
                      isPopular 
                        ? 'bg-gradient-to-b from-primary/20 to-primary/5 border-primary/50 shadow-[0_0_50px_rgba(var(--primary),0.15)] scale-105 z-20' 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/20 z-10 hover:scale-[1.02]'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-[0.2em] shadow-xl">
                        Champion Choice
                      </div>
                    )}

                    <div className="mb-10">
                      <h3 className={`text-2xl font-black uppercase tracking-tight mb-2 ${isPopular ? 'text-primary' : 'text-white'}`}>
                        {plan.name}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{plan.duration_days} Days Access</p>
                    </div>

                    <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase align-top mt-2">$</span>
                      <span className="text-6xl font-black tracking-tighter">{Math.floor(Number(plan.price_usd))}</span>
                      <span className="text-2xl font-black text-muted-foreground/50">.{(Number(plan.price_usd) % 1).toFixed(2).split('.')[1]}</span>
                    </div>

                    <div className="flex-1 space-y-4 mb-10">
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                          <Icon icon="ph:check-bold" className="text-emerald-500 w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80 uppercase tracking-tight">Instant {badgeLabel}</span>
                      </div>
                      {plan.bonus_coins > 0 && (
                        <div className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center">
                            <Icon icon="ph:check-bold" className="text-amber-500 w-3 h-3" />
                          </div>
                          <span className="text-sm font-bold text-foreground/80 uppercase tracking-tight">+{plan.bonus_coins} Bonus Tickets</span>
                        </div>
                      )}
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <Icon icon="ph:check-bold" className="text-blue-500 w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80 uppercase tracking-tight">HD Chapter Access</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Icon icon="ph:check-bold" className="text-primary w-3 h-3" />
                        </div>
                        <span className="text-sm font-bold text-foreground/80 uppercase tracking-tight">VIP Profile Badge</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleSubscribe(plan.id)}
                      disabled={isSubscriber}
                      className={`h-16 rounded-2xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${
                        isPopular 
                          ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:scale-[1.03] active:scale-95' 
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {isSubscriber ? 'Already Active' : 'Start Journey'}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* FAQ & Trust */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-4xl mx-auto space-y-24">
          {/* Trust Banner */}
          <div className="p-12 rounded-[3rem] bg-gradient-to-r from-primary/20 to-blue-600/10 border border-white/5 text-center relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Secure & Trusted Payments</h2>
              <p className="text-sm text-muted-foreground font-medium uppercase tracking-widest max-w-md mx-auto">We use industry-standard encryption to protect your transactions.</p>
              <div className="flex flex-wrap justify-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
                <Icon icon="logos:paypal" className="h-8 w-auto filter grayscale hover:grayscale-0 transition-all" />
                <Icon icon="logos:visa" className="h-6 w-auto filter grayscale hover:grayscale-0 transition-all" />
                <Icon icon="logos:bitcoin" className="h-8 w-auto filter grayscale hover:grayscale-0 transition-all" />
                <Icon icon="logos:tether" className="h-8 w-auto filter grayscale hover:grayscale-0 transition-all" />
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="space-y-12">
            <div className="text-center">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter">Common Inquiries</h2>
            </div>
            <div className="grid gap-4">
              {FAQ.map((faq, i) => (
                <div 
                  key={i} 
                  className={`rounded-3xl border transition-all duration-300 ${
                    openFaq === i ? 'bg-white/5 border-primary/30' : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                  }`}
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-6 text-left"
                  >
                    <span className="font-bold text-sm uppercase tracking-tight">{faq.q}</span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300 ${openFaq === i ? 'bg-primary rotate-45' : 'bg-white/5'}`}>
                      <Icon icon="ph:plus-bold" className={`w-4 h-4 ${openFaq === i ? 'text-white' : 'text-muted-foreground'}`} />
                    </div>
                  </button>
                  {openFaq === i && (
                    <div className="px-6 pb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-[4rem] bg-[#0a0a0a] border border-white/5 p-12 md:p-24 overflow-hidden text-center space-y-8">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-blue-600/10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/20 blur-[120px] rounded-full" />
            
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter leading-none">
                Don't Miss <br /> The Next Big Release
              </h2>
              <p className="text-lg text-muted-foreground font-medium">Join thousands of others who are already enjoying the premium experience. Your favorite stories are waiting.</p>
              <Button 
                size="lg" 
                className="h-16 px-12 rounded-2xl bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-white/90 hover:scale-[1.02] transition-all shadow-xl shadow-white/10"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                Back To Top
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Inline styles for custom animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-x {
          animation: gradient-x 5s ease infinite;
        }
      `}} />
    </div>
  );
}
