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

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Card / Stripe', icon: 'ph:credit-card-bold' },
  { id: 'paypal', label: 'PayPal', icon: 'ph:wallet-bold' },
  { id: 'usdt', label: 'USDT', icon: 'ph:currency-circle-dollar-bold' },
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

  const { premium_config: general, premium_general, coin_system } = settings;
  const {
    currency_name: currencyName,
    currency_icon_url: currencyIconUrl,
    badge_bg_color = '#E8D47E',
    badge_text_color = '#A57C1B',
    badge_padding_x = 12,
    badge_padding_y = 3,
    badge_icon_size = 14,
  } = coin_system;
  
  const baseAmount = coin_system.base_amount || 50;
  const basePrice = coin_system.base_price || 0.99;

  const activeMethods = useMemo(() => {
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
      toast.info('Payment was cancelled.');
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
            toast.error(data?.error || 'Payment verification failed');
          } else {
            toast.success(`${data.coins_added} ${currencyName} added to your balance!`);
            queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
          }
        } catch {
          toast.error('Could not verify payment');
        }
        setProcessing(false);
        setSearchParams({}, { replace: true });
      })();
    }
  }, [searchParams, queryClient, currencyName]);

  const COIN_PACKAGES = useMemo(() => {
    if (coin_system.packages && coin_system.packages.length > 0) {
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
  }, [baseAmount, basePrice, coin_system.packages]);

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
            toast.success(`${captureData.coins_added} ${currencyName} added to your balance!`);
            queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
          }
        } catch {
          toast.error('Could not verify payment');
        }
        setProcessing(false);
      },
      onCancel: () => toast.info('Payment cancelled.'),
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('Payment failed. Please try again.');
      },
    }).render(paypalContainerRef.current);
    paypalButtonsRendered.current = true;
  }, [paymentMethod, paypalReady, selectedPkgData, user, queryClient, currencyName]);

  const CurrencyIcon = ({ className, size, style }: { className?: string; size?: number; style?: React.CSSProperties }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
    ) : (
      <Icon icon="ph:coins-bold" className={className} style={{ ...style, ...(size ? { width: size, height: size } : {}) }} />
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
          toast.error(data?.error || 'Failed to create checkout session');
          setProcessing(false);
          return;
        }
        window.location.href = data.url;
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
        setProcessing(false);
      }
    } else if (paymentMethod === 'usdt') {
      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('nowpayments', {
          body: { action: 'create-payment', coins: selectedPkgData.coins, amount: selectedPkgData.price },
        });
        if (error || !data?.payAddress) {
          toast.error(data?.error || 'Failed to create USDT payment');
          setProcessing(false);
          return;
        }
        setUsdtPayment(data);
        setProcessing(false);
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
        setProcessing(false);
      }
    }
  };

  if (!general.enable_coins && !settingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-vh-[60vh] text-center p-6 bg-background">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Icon icon="ph:storefront-bold" className="w-10 h-10 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Shop is Closed</h2>
        <p className="text-muted-foreground max-w-md">The coin shop is currently unavailable. Please check back later.</p>
        <Button variant="outline" className="mt-8 rounded-xl" onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 xl:px-16 py-6 sm:py-10 max-w-7xl mx-auto min-h-[80vh] flex flex-col">
      {/* Dynamic Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card border border-border/60 shadow-sm mb-8">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
        <div className="relative p-6 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0">
              <Icon icon="ph:shopping-cart-duotone" className="w-8 sm:w-10 h-8 sm:h-10 text-amber-500" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">{currencyName} Shop</h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">Unlock premium chapters and support creators.</p>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Current Balance</p>
            <div
              className="flex items-center gap-2 shadow-sm rounded-xl"
              style={{
                backgroundColor: badge_bg_color,
                padding: `${badge_padding_y + 4}px ${badge_padding_x + 8}px`
              }}
            >
              <CurrencyIcon size={badge_icon_size + 4} className="text-current" style={{ color: badge_text_color }} />
              <span style={{ color: badge_text_color, fontSize: '18px', fontWeight: 900, letterSpacing: '-0.025em' }}>
                {coinBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
        {/* Main Content Area */}
        <div className="flex-1 space-y-10">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
              <Icon icon="ph:sparkle-fill" className="w-5 h-5 text-amber-500" />
              Select a Package
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {COIN_PACKAGES.map((pkg, idx) => {
                const isPremiumTier = idx >= COIN_PACKAGES.length - 2;
                return (
                  <button
                    key={pkg.id}
                    onClick={() => setSelectedPkg(pkg.id)}
                    className={`relative rounded-3xl border p-5 text-left transition-all duration-300 group overflow-hidden focus:outline-none ${
                      selectedPkg === pkg.id 
                        ? 'border-primary bg-primary/[0.03] ring-4 ring-primary/20 shadow-lg scale-[1.02]' 
                        : 'border-border/60 bg-card hover:border-primary/50 hover:bg-muted/30 hover:scale-[1.01] hover:shadow-md'
                    }`}
                  >
                    {isPremiumTier && (
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent pointer-events-none" />
                    )}
                    {pkg.popular && (
                      <span className="absolute top-0 right-0 rounded-bl-xl rounded-tr-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1.5 flex items-center gap-1 shadow-sm z-10">
                        <Icon icon="ph:star-fill" className="w-3 h-3" /> BEST VALUE
                      </span>
                    )}

                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <CurrencyIcon className={`w-8 h-8 ${isPremiumTier ? 'text-amber-500 drop-shadow-md' : 'text-amber-500/80'}`} />
                        <span className={`text-2xl font-black tracking-tight ${isPremiumTier ? 'bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent' : 'text-foreground'}`}>
                          {pkg.coins.toLocaleString()}
                        </span>
                      </div>

                      {pkg.bonus && pkg.bonus > 0 ? (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/10 text-emerald-500 px-2.5 py-1 rounded-md border border-emerald-500/20">
                            <Icon icon="ph:gift-fill" className="w-3 h-3" />
                            +{pkg.bonus.toLocaleString()} BONUS
                          </span>
                        </div>
                      ) : (
                        <div className="h-6 mb-4"></div>
                      )}

                      <div className="flex items-baseline justify-between pt-4 border-t border-border/50">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{pkg.label}</span>
                        <span className="text-xl font-bold text-foreground">${pkg.price}</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-5">Payment Method</h2>
            {activeMethods.length === 0 ? (
              <div className="p-8 rounded-3xl border-2 border-dashed border-border bg-muted/20 text-center text-muted-foreground flex flex-col items-center">
                <Icon icon="ph:warning-circle-duotone" className="w-10 h-10 mb-3 text-muted-foreground/50" />
                No payment methods are currently active. Please contact support.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                {activeMethods.map((method) => (
                  <button key={method.id} onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 rounded-2xl border px-5 py-4 sm:flex-1 transition-all duration-200 focus:outline-none ${
                      paymentMethod === method.id 
                        ? 'border-primary bg-primary/[0.04] ring-2 ring-primary/30 shadow-sm' 
                        : 'border-border/60 bg-card hover:border-border/80'
                    }`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === method.id ? 'bg-primary/10' : 'bg-muted/60'}`}>
                      <Icon icon={method.icon} className={`w-5 h-5 ${paymentMethod === method.id ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <span className={`text-base font-semibold ${paymentMethod === method.id ? 'text-foreground' : 'text-muted-foreground'}`}>{method.label}</span>
                    {paymentMethod === method.id && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Icon icon="ph:check-bold" className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </section>

          <div className="rounded-3xl border border-border/80 bg-card shadow-sm overflow-hidden relative">
            <div className="h-1.5 w-full bg-gradient-to-r from-primary via-emerald-400 to-amber-500" />
            <div className="p-6 sm:p-8">
              {selectedPkgData ? (
                <>
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-2">
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                        <CurrencyIcon className="w-6 h-6 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xl font-bold text-foreground">
                          {selectedPkgData.coins.toLocaleString()} {currencyName}
                          {selectedPkgData.bonus ? <span className="text-emerald-500 text-sm ml-2">({selectedPkgData.bonus} Free)</span> : ''}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                          Checkout via <strong>{PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}</strong>
                          <Icon icon="ph:lock-key-fill" className="w-3.5 h-3.5 text-muted-foreground/60" />
                        </p>
                      </div>
                    </div>
                    
                    <div className="w-full md:w-auto text-center md:text-right">
                      <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Total Due</p>
                      <p className="text-3xl font-black">${selectedPkgData.price.toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">USD • Secure Checkout</p>
                    </div>
                  </div>

                  {paymentMethod !== 'paypal' && (
                    <div className="mt-8">
                      <Button className="rounded-2xl px-8 h-14 w-full text-base font-bold shadow-md hover:shadow-lg transition-all" onClick={handlePurchase} disabled={processing || !user}>
                        {processing ? <Icon icon="ph:spinner-gap-bold" className="w-5 h-5 animate-spin mr-2" /> : <Icon icon="ph:lock-key-fill" className="w-5 h-5 mr-2" />}
                        {processing ? 'Processing Payment...' : `Pay $${selectedPkgData.price.toFixed(2)} Securely`}
                      </Button>
                    </div>
                  )}

                  {paymentMethod === 'paypal' && (
                    <div className="mt-8 text-center bg-muted/20 p-4 rounded-2xl border border-border/40">
                      {paypalLoading && (
                        <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                          <Icon icon="ph:spinner-gap-bold" className="w-5 h-5 animate-spin" />
                          <span className="text-sm font-medium">Loading PayPal Secure Gateway...</span>
                        </div>
                      )}
                      <div ref={paypalContainerRef} className={processing ? 'opacity-50 pointer-events-none' : ''} />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                   <div className="w-16 h-16 rounded-full bg-muted/40 flex items-center justify-center mx-auto mb-4">
                     <Icon icon="ph:cursor-click-duotone" className="w-8 h-8 text-muted-foreground/60" />
                   </div>
                   <p className="text-base font-medium text-foreground">Awaiting Selection</p>
                   <p className="text-sm text-muted-foreground mt-1">Please select a package above to proceed to checkout.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="hidden lg:block w-[320px] shrink-0 space-y-6">
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
            <h3 className="font-bold text-foreground flex items-center gap-2 mb-5">
               <Icon icon="ph:shield-check-fill" className="w-5 h-5 text-emerald-500" />
               Safe & Secure
            </h3>
            <ul className="space-y-4 text-left">
               <li className="flex gap-3">
                 <Icon icon="ph:lock-key-fill" className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                 <div>
                   <p className="text-sm font-semibold text-foreground">Encrypted Checkout</p>
                   <p className="text-xs text-muted-foreground mt-0.5">Your payment is encrypted and handled by bank-grade providers.</p>
                 </div>
               </li>
               <li className="flex gap-3">
                 <Icon icon="ph:lightning-fill" className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                 <div>
                   <p className="text-sm font-semibold text-foreground">Instant Delivery</p>
                   <p className="text-xs text-muted-foreground mt-0.5">Coins are instantly credited to your wallet securely.</p>
                 </div>
               </li>
               <li className="flex gap-3">
                 <Icon icon="ph:headset-fill" className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                 <div>
                   <p className="text-sm font-semibold text-foreground">Fast Support</p>
                   <p className="text-xs text-muted-foreground mt-0.5">We are always available to help resolve any issues.</p>
                 </div>
               </li>
            </ul>
          </div>
          
          <div className="rounded-3xl border border-border/60 bg-card p-6 shadow-sm">
             <h3 className="font-bold text-foreground mb-4">Frequently Asked Questions</h3>
             <div className="space-y-4 text-left">
                <div>
                   <p className="text-sm font-semibold text-foreground">Do {currencyName.toLowerCase()} expire?</p>
                   <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">No, any {currencyName.toLowerCase()} you purchase or earn via bonuses remain in your wallet forever.</p>
                </div>
                <div>
                   <p className="text-sm font-semibold text-foreground">Are chapters permanently unlocked?</p>
                   <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">Yes! Once you spend {currencyName.toLowerCase()} to unlock a premium chapter, you retain access to it permanently.</p>
                </div>
                <div>
                   <p className="text-sm font-semibold text-foreground">Is my payment recurring?</p>
                   <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">No, these are strictly one-time payments. There are no hidden subscription charges.</p>
                </div>
             </div>
          </div>
        </div>
      </div>

      <Dialog open={!!usdtPayment} onOpenChange={(open) => !open && setUsdtPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Icon icon="ph:currency-circle-dollar-bold" className="w-5 h-5 text-primary" /> USDT Payment</DialogTitle></DialogHeader>
          {usdtPayment && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div><p className="text-xs text-muted-foreground mb-1">Send exactly</p><p className="text-lg font-bold text-foreground">{usdtPayment.payAmount} {usdtPayment.payCurrency?.toUpperCase()}</p></div>
                <div><p className="text-xs text-muted-foreground mb-1">To this address</p>
                  <div className="flex items-center gap-2"><code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 break-all">{usdtPayment.payAddress}</code><Button size="icon" variant="outline" className="shrink-0 h-8 w-8" onClick={() => { navigator.clipboard.writeText(usdtPayment.payAddress); toast.success('Address copied!'); }}><Icon icon="ph:copy-bold" className="w-3.5 h-3.5" /></Button></div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center">Your balance will update automatically once confirmed.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
