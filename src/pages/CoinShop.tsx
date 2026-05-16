import { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Credit Card', icon: 'ph:credit-card-light' },
  { id: 'paypal', label: 'PayPal', icon: 'ph:paypal-logo-light' },
  { id: 'usdt', label: 'Crypto (USDT)', icon: 'ph:currency-circle-dollar-light' },
] as const;

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function CoinShop() {
  const { settings, isLoading: settingsLoading } = usePremiumSettings();
  const [selectedPkg, setSelectedPkg] = useState<string | number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [usdtPayment, setUsdtPayment] = useState<any>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered = useRef(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { premium_config: general, coin_system } = settings || {};
  const {
    currency_name: currencyName = 'Coins',
    currency_icon_url: currencyIconUrl,
  } = coin_system || {};
  
  const baseAmount = coin_system?.base_amount || 50;
  const basePrice = coin_system?.base_price || 0.99;

  const activeMethods = useMemo(() => {
    if (!general) return [];
    return PAYMENT_METHODS.filter(m => {
      if (m.id === 'stripe') return general.enable_stripe;
      if (m.id === 'paypal') return general.enable_paypal;
      if (m.id === 'usdt') return general.enable_usdt;
      return false;
    });
  }, [general]);

  useEffect(() => {
    if (activeMethods.length > 0 && !paymentMethod) {
      setPaymentMethod(activeMethods[0].id);
    }
  }, [activeMethods, paymentMethod]);

  const { data: profile } = useQuery({
    queryKey: ['coin-balance', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('profiles').select('coin_balance').eq('id', user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const coinBalance = profile?.coin_balance ?? 0;

  // Handle Stripe return
  useEffect(() => {
    const status = searchParams.get('status');
    const stripeSessionId = searchParams.get('stripe_session_id');

    if (status === 'cancelled') {
      toast.info('Transaction aborted.');
      setSearchParams({}, { replace: true });
      return;
    }

    if (status === 'success' && stripeSessionId) {
      (async () => {
        setProcessing(true);
        try {
          const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: { action: 'verify-session', sessionId: stripeSessionId },
          });
          if (error || !data?.success) {
            toast.error(data?.error || 'Verification failed');
          } else {
            toast.success(`Successfully acquired ${data.coins_added} ${currencyName}.`);
            queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
          }
        } catch {
          toast.error('Could not verify transaction');
        }
        setProcessing(false);
        setSearchParams({}, { replace: true });
      })();
    }
  }, [searchParams, queryClient, currencyName]);

  const COIN_PACKAGES = useMemo(() => {
    if (coin_system?.packages && coin_system.packages.length > 0) {
      return coin_system.packages;
    }
    return [
      { id: '1', coins: baseAmount, price: +(basePrice).toFixed(2), label: 'Starter', popular: false, bonus: 0 },
      { id: '2', coins: Math.round(baseAmount * 3), price: +(basePrice * 3).toFixed(2), label: 'Popular', popular: true, bonus: 0 },
      { id: '3', coins: Math.round(baseAmount * 7), price: +(basePrice * 7).toFixed(2), label: 'Value', bonus: Math.round(baseAmount), popular: false },
      { id: '4', coins: Math.round(baseAmount * 15), price: +(basePrice * 15).toFixed(2), label: 'Premium', bonus: Math.round(baseAmount * 3), popular: false },
      { id: '5', coins: Math.round(baseAmount * 32), price: +(basePrice * 32).toFixed(2), label: 'Mega', bonus: Math.round(baseAmount * 8), popular: false },
      { id: '6', coins: Math.round(baseAmount * 100), price: +(basePrice * 100).toFixed(2), label: 'Ultimate', bonus: Math.round(baseAmount * 30), popular: false },
    ];
  }, [baseAmount, basePrice, coin_system?.packages]);

  const selectedPkgData = COIN_PACKAGES.find(p => String(p.id) === String(selectedPkg));

  // ── PayPal JS SDK loader ──
  const { data: paypalClientId } = useQuery({
    queryKey: ['paypal-client-id'],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('paypal-purchase', {
        body: { action: 'get-client-id' },
      });
      return data?.clientId as string | undefined;
    },
    enabled: paymentMethod === 'paypal',
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (paymentMethod !== 'paypal' || !paypalClientId) return;
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }
    const oldScript = document.getElementById('paypal-sdk-script');
    if (oldScript) oldScript.remove();
    setPaypalLoading(true);
    const script = document.createElement('script');
    script.id = 'paypal-sdk-script';
    script.src = `https://www.paypal.com/sdk/js?client-id=${paypalClientId}&currency=USD&components=buttons`;
    script.async = true;
    script.onload = () => {
      setPaypalReady(true);
      setPaypalLoading(false);
    };
    script.onerror = () => {
      toast.error('Failed to load PayPal SDK');
      setPaypalLoading(false);
    };
    document.head.appendChild(script);
  }, [paymentMethod, paypalClientId]);

  // Render PayPal buttons
  useEffect(() => {
    if (paymentMethod !== 'paypal' || !paypalReady || !window.paypal || !selectedPkgData || !user || !paypalContainerRef.current) return;
    paypalContainerRef.current.innerHTML = '';
    paypalButtonsRendered.current = false;
    window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 45 },
      createOrder: async () => {
        const { data, error } = await supabase.functions.invoke('paypal-purchase', {
          body: { action: 'create-order', amount: selectedPkgData.price, coins: selectedPkgData.coins },
        });
        if (error || !data?.orderId) throw new Error(data?.error || 'Failed to create order');
        return data.orderId;
      },
      onApprove: async (data: any) => {
        setProcessing(true);
        try {
          const { data: captureData, error } = await supabase.functions.invoke('paypal-purchase', {
            body: { action: 'capture-order', orderId: data.orderID },
          });
          if (error || !captureData?.success) {
            toast.error(captureData?.error || 'Payment capture failed');
          } else {
            toast.success(`Successfully acquired ${captureData.coins_added} ${currencyName}.`);
            queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
          }
        } catch {
          toast.error('Could not verify transaction');
        }
        setProcessing(false);
      },
      onCancel: () => toast.info('Transaction aborted.'),
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('Transaction failed. Please try again.');
      },
    }).render(paypalContainerRef.current);
    paypalButtonsRendered.current = true;
  }, [paymentMethod, paypalReady, selectedPkgData, user, queryClient, currencyName]);

  const CurrencyIcon = ({ className, size, style }: { className?: string; size?: number; style?: React.CSSProperties }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
    ) : (
      <Icon icon="ph:coin-duotone" className={className} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
    );

  const handlePurchase = async () => {
    if (!selectedPkgData || !user) return;
    const returnUrl = window.location.origin + '/coin-shop';
    if (paymentMethod === 'stripe') {
      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: { action: 'create-checkout', coins: selectedPkgData.coins, amount: selectedPkgData.price, returnUrl },
        });
        if (error || !data?.url) {
          toast.error(data?.error || 'Failed to initialize gateway');
          setProcessing(false);
          return;
        }
        window.location.href = data.url;
      } catch (err: any) {
        toast.error(err.message || 'Transaction failed');
        setProcessing(false);
      }
    } else if (paymentMethod === 'usdt') {
      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('cryptomus-purchase', {
          body: { action: 'create-payment', coins: selectedPkgData.coins, amount: selectedPkgData.price },
        });
        if (error || !data?.payAddress) {
          toast.error(data?.error || 'Failed to initialize crypto gateway');
          setProcessing(false);
          return;
        }
        setUsdtPayment(data);
        setProcessing(false);
      } catch (err: any) {
        toast.error(err.message || 'Transaction failed');
        setProcessing(false);
      }
    }
  };

  if (!general?.enable_coins && !settingsLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-center p-6">
        <h2 className="text-3xl font-light text-white mb-4" style={{ fontFamily: 'Georgia, serif' }}>The Exchange is Closed</h2>
        <p className="text-[#888] tracking-widest uppercase text-xs">Return at a later time.</p>
        <Button className="mt-8 bg-transparent border border-[#333] text-white hover:bg-[#111]" onClick={() => window.history.back()}>Retreat</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#cba677] selection:text-black">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-32 flex flex-col lg:flex-row gap-20">
        
        {/* Left Column - Information */}
        <div className="lg:w-1/3 flex flex-col gap-12">
          <div>
            <h1 className="text-5xl lg:text-7xl font-light text-white mb-6" style={{ fontFamily: 'Georgia, serif' }}>
              The <br/><span className="text-[#cba677] italic">Exchange</span>
            </h1>
            <p className="text-[#888] leading-relaxed">
              Acquire {currencyName.toLowerCase()} to permanently unlock deep archive entries. Your acquisitions directly support the scribes and artisans.
            </p>
          </div>

          <div className="p-8 border border-[#222] bg-[#0a0a0a]">
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-[#666] mb-4">Your Ledger</p>
            <div className="flex items-end gap-3">
              <CurrencyIcon className="text-[#cba677] w-8 h-8 mb-1" />
              <span className="text-5xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>{coinBalance.toLocaleString()}</span>
            </div>
            <p className="text-[#666] text-sm mt-2">Available Balance</p>
          </div>

          <div className="space-y-6 pt-12 border-t border-[#222]">
            <div>
              <p className="text-sm font-bold text-white mb-1 tracking-wide">Are assets permanent?</p>
              <p className="text-[#888] text-sm leading-relaxed">Yes. Once a chapter is unlocked, it remains in your possession indefinitely.</p>
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1 tracking-wide">Are transactions secure?</p>
              <p className="text-[#888] text-sm leading-relaxed">All exchanges are processed through encrypted, industry-standard gateways.</p>
            </div>
          </div>
        </div>

        {/* Right Column - Packages and Checkout */}
        <div className="lg:w-2/3 flex flex-col gap-16">
          
          {/* Packages */}
          <section>
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-8">Select Acquisition</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COIN_PACKAGES.map((pkg, idx) => (
                <button
                  key={pkg.id}
                  onClick={() => setSelectedPkg(pkg.id)}
                  className={`text-left p-6 border transition-all duration-500 relative flex flex-col justify-between h-32 ${
                    selectedPkg === pkg.id 
                      ? 'border-[#cba677] bg-[#cba677]/5' 
                      : 'border-[#222] bg-[#0a0a0a] hover:border-[#444]'
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <div className="flex items-center gap-2">
                      <CurrencyIcon className={`w-5 h-5 ${selectedPkg === pkg.id ? 'text-[#cba677]' : 'text-[#666]'}`} />
                      <span className={`text-2xl font-light ${selectedPkg === pkg.id ? 'text-white' : 'text-[#888]'}`}>
                        {pkg.coins.toLocaleString()}
                      </span>
                    </div>
                    {pkg.bonus > 0 && (
                      <span className="text-[10px] uppercase tracking-widest text-[#cba677] border border-[#cba677]/30 px-2 py-1 bg-[#cba677]/10">
                        +{pkg.bonus} Bonus
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-end w-full mt-auto">
                    <span className="text-xs text-[#555] uppercase tracking-widest">{pkg.label}</span>
                    <span className={`text-xl ${selectedPkg === pkg.id ? 'text-white' : 'text-[#666]'}`}>
                      ${pkg.price.toFixed(2)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Checkout Area */}
          <section className={`transition-opacity duration-500 ${selectedPkgData ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
            <h2 className="text-xs font-bold tracking-[0.4em] uppercase text-[#cba677] mb-8">Gateway Selection</h2>
            
            {activeMethods.length === 0 ? (
              <p className="text-[#666] italic">No active gateways available.</p>
            ) : (
              <div className="flex flex-wrap gap-4 mb-10">
                {activeMethods.map((method) => (
                  <button 
                    key={method.id} 
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-3 px-6 py-4 border transition-colors ${
                      paymentMethod === method.id 
                        ? 'border-[#cba677] text-[#cba677] bg-[#cba677]/5' 
                        : 'border-[#222] text-[#666] hover:text-[#888] hover:border-[#444]'
                    }`}
                  >
                    <Icon icon={method.icon} className="w-5 h-5" />
                    <span className="text-sm tracking-wide">{method.label}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedPkgData && (
              <div className="p-8 border border-[#222] bg-[#0a0a0a]">
                <div className="flex justify-between items-end mb-8 border-b border-[#222] pb-8">
                  <div>
                    <p className="text-xs text-[#555] uppercase tracking-widest mb-2">Total Payable</p>
                    <p className="text-4xl font-light text-white" style={{ fontFamily: 'Georgia, serif' }}>
                      ${selectedPkgData.price.toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#cba677] text-xl font-light">{selectedPkgData.coins.toLocaleString()} {currencyName}</p>
                    {selectedPkgData.bonus > 0 && <p className="text-xs text-[#666] mt-1">Includes {selectedPkgData.bonus} bonus tokens</p>}
                  </div>
                </div>

                {paymentMethod !== 'paypal' && (
                  <Button 
                    className="w-full h-16 bg-[#cba677] hover:bg-[#b59265] text-black uppercase tracking-[0.2em] font-bold text-xs transition-colors rounded-none"
                    onClick={handlePurchase} 
                    disabled={processing || !user}
                  >
                    {processing ? 'Processing...' : 'Authorize Transaction'}
                  </Button>
                )}

                {paymentMethod === 'paypal' && (
                  <div className="mt-4">
                    {paypalLoading && <p className="text-[#666] text-sm mb-4">Initializing PayPal Gateway...</p>}
                    <div ref={paypalContainerRef} className={processing ? 'opacity-50 pointer-events-none' : ''} />
                  </div>
                )}
              </div>
            )}
          </section>

        </div>
      </div>

      <Dialog open={!!usdtPayment} onOpenChange={(open) => !open && setUsdtPayment(null)}>
        <DialogContent className="sm:max-w-md p-8 bg-[#0a0a0a] border border-[#222] text-white">
          <DialogHeader><DialogTitle className="font-light tracking-wide text-[#cba677]">USDT Gateway Initiated</DialogTitle></DialogHeader>
          {usdtPayment && (
            <div className="space-y-8 pt-4">
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-sm mx-auto w-fit">
                <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${usdtPayment.payAddress}`} 
                   alt="Wallet Address QR" 
                   className="w-40 h-40 object-contain"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">Exact Transfer Amount</label>
                <div className="flex gap-2">
                  <Input readOnly value={`${usdtPayment.payAmount} ${usdtPayment.payCurrency?.toUpperCase()}`} className="font-mono bg-[#111] border-[#333] rounded-none h-12 text-[#cba677]" />
                  <Button variant="secondary" className="h-12 rounded-none bg-[#222] hover:bg-[#333] border-0 text-white" onClick={() => { navigator.clipboard.writeText(usdtPayment.payAmount); toast.success('Copied to clipboard'); }}>
                    <Icon icon="ph:copy-light" className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold tracking-[0.2em] text-[#666] uppercase">Destination Address ({usdtPayment.network || 'BSC'})</label>
                <div className="flex gap-2">
                  <Input readOnly value={usdtPayment.payAddress} className="font-mono bg-[#111] border-[#333] rounded-none h-12 text-xs" />
                  <Button variant="secondary" className="h-12 rounded-none bg-[#222] hover:bg-[#333] border-0 text-white" onClick={() => { navigator.clipboard.writeText(usdtPayment.payAddress); toast.success('Copied to clipboard'); }}>
                    <Icon icon="ph:copy-light" className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <p className="text-[10px] tracking-widest uppercase text-[#555] text-center flex items-center justify-center gap-2">
                <Icon icon="ph:spinner-gap-light" className="w-4 h-4 animate-spin" />
                Awaiting confirmation
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
