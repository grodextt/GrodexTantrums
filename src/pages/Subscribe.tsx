import { useState } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useSubscriptionStats, useHasActiveSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

const FAQ = [
  { q: "What is the nature of The Ascension?", a: "It is an exclusive tier granting uninterrupted, pristine access to our entire catalog." },
  { q: "Are transactions secure?", a: "All transactions are heavily encrypted and processed via industry-leading secure gateways." },
  { q: "Can I sever my connection?", a: "Yes. You may cancel your passage at any time, retaining access until the end of your billing cycle." },
  { q: "Do the stipends roll over?", a: "Monthly tokens are credited to your account and remain yours to spend indefinitely." }
];

const MANIFESTO = [
  { title: "The Sanctuary", description: "Your reading environment is sacred. We strip away all advertisements, banners, and interruptions to provide a pure, unadulterated connection with the story." },
  { title: "The Vault", description: "Gain absolute access to the deepest archives. No more waiting. No more locked doors. The entire library is yours to explore." },
  { title: "The Fidelity", description: "Experience the artwork precisely as the creators intended. Uncompressed, high-definition panels that showcase every meticulous detail." },
  { title: "The Patronage", description: "Your support fuels the ecosystem. In return, you receive exclusive monthly stipends to reward your favorite artists directly." }
];

export default function SubscribePage() {
  const navigate = useNavigate();
  const { user, setShowLoginModal } = useAuth();
  const { data: plans = [], isLoading: plansLoading } = useSubscriptionPlans();
  const { data: stats } = useSubscriptionStats();
  const { isSubscriber } = useHasActiveSubscription();
  const { settings: siteSettings } = useSiteSettings();

  const siteName = siteSettings?.general?.site_name || 'Grodex Tantrums';
  const [selectedPlanIdx, setSelectedPlanIdx] = useState(0);

  const handleSubscribe = (planId: string) => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    navigate(`/subscribe/checkout/${planId}`);
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-[#cba677] selection:text-white">
      
      {/* Editorial Header */}
      <header className="pt-40 pb-20 px-8 max-w-6xl mx-auto flex flex-col md:flex-row items-end justify-between border-b border-border gap-12">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-6 text-foreground uppercase" style={{ fontFamily: 'Georgia, serif' }}>
            The <br/>
            <span className="italic text-[#cba677]">Ascension</span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground font-light leading-relaxed">
            A private tier for those who demand the finest narrative experience. Elevate your status within {siteName}.
          </p>
        </div>
        <div className="text-right pb-4 border-l border-border pl-8">
          <p className="text-sm tracking-[0.3em] uppercase text-muted-foreground mb-2">Current Inductees</p>
          <p className="text-4xl font-light text-foreground" style={{ fontFamily: 'Georgia, serif' }}>{stats?.activeSubscribers || 'Elite'}</p>
        </div>
      </header>

      {/* The Manifesto / Core Tenets */}
      <section className="py-32 px-8 max-w-6xl mx-auto">
        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-16">The Core Tenets</h2>
        
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-16">
          {MANIFESTO.map((item, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold text-muted-foreground group-hover:text-[#cba677] transition-colors duration-500">0{idx + 1}</span>
                <h3 className="text-2xl text-foreground font-light tracking-wide">{item.title}</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed pl-8 border-l border-transparent group-hover:border-[#cba677]/30 transition-all duration-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The Offering (Pricing) */}
      <section className="py-32 px-8 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-4">The Offering</h2>
              <p className="text-3xl text-foreground font-light" style={{ fontFamily: 'Georgia, serif' }}>Secure your passage.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Plan Selector */}
            <div className="space-y-4">
              {plansLoading ? (
                <div className="h-64 bg-muted animate-pulse rounded-sm" />
              ) : (
                plans.map((plan, idx) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanIdx(idx)}
                    className={`w-full text-left p-8 border transition-all duration-500 flex justify-between items-center ${
                      selectedPlanIdx === idx 
                        ? 'border-[#cba677] bg-[#cba677]/5' 
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xl mb-1 ${selectedPlanIdx === idx ? 'text-[#cba677]' : 'text-foreground'}`}>{plan.name}</h4>
                      <p className="text-sm text-muted-foreground uppercase tracking-widest">{plan.duration_days} Days</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg text-muted-foreground mr-1">$</span>
                      <span className={`text-3xl font-light ${selectedPlanIdx === idx ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {Number(plan.price_usd).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Plan Details & Action */}
            <div className="p-12 border border-border bg-background relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#cba677] opacity-50 m-4" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#cba677] opacity-50 m-4" />

              {plans[selectedPlanIdx] && (
                <div className="relative z-10 space-y-12">
                  <div>
                    <p className="text-[#cba677] text-sm uppercase tracking-widest mb-4">Selected Offering</p>
                    <h3 className="text-4xl text-foreground font-light mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      {plans[selectedPlanIdx].name}
                    </h3>
                    {plans[selectedPlanIdx].bonus_coins > 0 && (
                      <p className="text-muted-foreground">Includes a stipend of {plans[selectedPlanIdx].bonus_coins} tokens.</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {['Unrestricted Archive Access', 'Ad-Free Reading', 'High-Fidelity Art', 'Exclusive Patron Badge'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 bg-[#cba677] rotate-45" />
                        <span className="text-foreground/90 font-light tracking-wide">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSubscribe(plans[selectedPlanIdx].id)}
                    disabled={isSubscriber}
                    className="w-full h-16 bg-[#cba677] hover:bg-[#b59265] text-black uppercase tracking-[0.2em] font-bold text-xs transition-colors rounded-none"
                  >
                    {isSubscriber ? 'Status Already Attained' : 'Initiate Ascension'}
                  </Button>
                  
                  <p className="text-center text-muted-foreground text-xs tracking-widest uppercase mt-4">
                    Secure transaction processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-32 px-8 max-w-4xl mx-auto">
        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-16 text-center">Inquiries</h2>
        <div className="space-y-4">
          {FAQ.map((faq, i) => (
            <details key={i} className="group border border-border bg-card open:border-[#cba677]/30 transition-colors duration-300">
              <summary className="flex justify-between items-center cursor-pointer p-8 list-none outline-none [&::-webkit-details-marker]:hidden">
                <span className="text-lg text-foreground font-light tracking-wide">{faq.q}</span>
                <span className="text-[#cba677] group-open:rotate-45 transition-transform duration-300">
                  <Icon icon="ph:plus-light" className="w-6 h-6" />
                </span>
              </summary>
              <div className="px-8 pb-8 text-muted-foreground leading-relaxed border-t border-border/50 pt-6 mt-2">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-20 text-center text-muted-foreground text-xs tracking-[0.2em] uppercase">
        <p>End of Transmission. The choice is yours.</p>
      </footer>
    </div>
  );
}
