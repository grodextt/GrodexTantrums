import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useSubscriptionPlans, useSubscriptionStats, useHasActiveSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/contexts/AuthContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';

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
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#cba677] selection:text-black">
      
      {/* Editorial Header */}
      <header className="pt-40 pb-20 px-8 max-w-6xl mx-auto flex flex-col md:flex-row items-end justify-between border-b border-[#222] gap-12">
        <div className="max-w-2xl">
          <h1 className="text-6xl md:text-8xl font-light tracking-tighter mb-6 text-white uppercase" style={{ fontFamily: 'Georgia, serif' }}>
            The <br/>
            <span className="italic text-[#cba677]">Ascension</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#888] font-light leading-relaxed">
            A private tier for those who demand the finest narrative experience. Elevate your status within {siteName}.
          </p>
        </div>
        <div className="text-right pb-4 border-l border-[#333] pl-8">
          <p className="text-sm tracking-[0.3em] uppercase text-[#666] mb-2">Current Inductees</p>
          <p className="text-4xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{stats?.activeSubscribers || 'Elite'}</p>
        </div>
      </header>

      {/* The Manifesto / Core Tenets */}
      <section className="py-32 px-8 max-w-6xl mx-auto">
        <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-16">The Core Tenets</h2>
        
        <div className="grid md:grid-cols-2 gap-x-20 gap-y-16">
          {MANIFESTO.map((item, idx) => (
            <div key={idx} className="group cursor-default">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-sm font-bold text-[#444] group-hover:text-[#cba677] transition-colors duration-500">0{idx + 1}</span>
                <h3 className="text-2xl text-white font-light tracking-wide">{item.title}</h3>
              </div>
              <p className="text-[#888] leading-relaxed pl-8 border-l border-transparent group-hover:border-[#cba677]/30 transition-all duration-500">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* The Offering (Pricing) */}
      <section className="py-32 px-8 bg-[#0a0a0a] border-y border-[#222]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div>
              <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-4">The Offering</h2>
              <p className="text-3xl text-white font-light" style={{ fontFamily: 'Georgia, serif' }}>Secure your passage.</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Interactive Plan Selector */}
            <div className="space-y-4">
              {plansLoading ? (
                <div className="h-64 bg-[#111] animate-pulse rounded-sm" />
              ) : (
                plans.map((plan, idx) => (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlanIdx(idx)}
                    className={`w-full text-left p-8 border transition-all duration-500 flex justify-between items-center ${
                      selectedPlanIdx === idx 
                        ? 'border-[#cba677] bg-[#cba677]/5' 
                        : 'border-[#222] hover:border-[#444]'
                    }`}
                  >
                    <div>
                      <h4 className={`text-xl mb-1 ${selectedPlanIdx === idx ? 'text-[#cba677]' : 'text-white'}`}>{plan.name}</h4>
                      <p className="text-sm text-[#666] uppercase tracking-widest">{plan.duration_days} Days</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg text-[#666] mr-1">$</span>
                      <span className={`text-3xl font-light ${selectedPlanIdx === idx ? 'text-white' : 'text-[#888]'}`}>
                        {Number(plan.price_usd).toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Plan Details & Action */}
            <div className="p-12 border border-[#222] bg-[#050505] relative overflow-hidden">
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-16 h-16 border-t border-r border-[#cba677] opacity-50 m-4" />
              <div className="absolute bottom-0 left-0 w-16 h-16 border-b border-l border-[#cba677] opacity-50 m-4" />

              {plans[selectedPlanIdx] && (
                <div className="relative z-10 space-y-12">
                  <div>
                    <p className="text-[#cba677] text-sm uppercase tracking-widest mb-4">Selected Offering</p>
                    <h3 className="text-4xl text-white font-light mb-2" style={{ fontFamily: 'Georgia, serif' }}>
                      {plans[selectedPlanIdx].name}
                    </h3>
                    {plans[selectedPlanIdx].bonus_coins > 0 && (
                      <p className="text-[#888]">Includes a stipend of {plans[selectedPlanIdx].bonus_coins} tokens.</p>
                    )}
                  </div>

                  <div className="space-y-6">
                    {['Unrestricted Archive Access', 'Ad-Free Reading', 'High-Fidelity Art', 'Exclusive Patron Badge'].map((feature, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <div className="w-1.5 h-1.5 bg-[#cba677] rotate-45" />
                        <span className="text-[#ddd] font-light tracking-wide">{feature}</span>
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
                  
                  <p className="text-center text-[#555] text-xs tracking-widest uppercase mt-4">
                    Secure transaction processing
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="py-20 text-center text-[#444] text-xs tracking-[0.2em] uppercase">
        <p>End of Transmission. The choice is yours.</p>
      </footer>
    </div>
  );
}
