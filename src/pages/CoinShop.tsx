import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Coins, ShoppingCart, CreditCard, Wallet, CircleDollarSign, Sparkles, Check, Loader2, Copy, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Card / Stripe', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'usdt', label: 'USDT', icon: CircleDollarSign },
] as const;


declare global {
  interface Window {
    paypal?: any;
  }
}

export default function CoinShop() {
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');
  const [processing, setProcessing] = useState(false);
  const [usdtPayment, setUsdtPayment] = useState<any>(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalLoading, setPaypalLoading] = useState(false);
  const paypalContainerRef = useRef<HTMLDivElement>(null);
  const paypalButtonsRendered = useRef(false);
  const { settings } = usePremiumSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const currencyName = settings.coin_system.currency_name;
  const currencyIconUrl = settings.coin_system.currency_icon_url;
  const baseAmount = settings.coin_system.base_amount;
  const basePrice = settings.coin_system.base_price;
  const pricePerUnit = baseAmount > 0 ? basePrice / baseAmount : 0;

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
  }, []);

  const COIN_PACKAGES = useMemo(() => [
    { id: 1, coins: baseAmount, price: +(basePrice).toFixed(2), label: 'Starter' },
    { id: 2, coins: Math.round(baseAmount * 3), price: +(basePrice * 3).toFixed(2), label: 'Popular', popular: true },
    { id: 3, coins: Math.round(baseAmount * 7), price: +(basePrice * 7).toFixed(2), label: 'Value', bonus: Math.round(baseAmount) },
    { id: 4, coins: Math.round(baseAmount * 15), price: +(basePrice * 15).toFixed(2), label: 'Premium', bonus: Math.round(baseAmount * 3) },
    { id: 5, coins: Math.round(baseAmount * 32), price: +(basePrice * 32).toFixed(2), label: 'Mega', bonus: Math.round(baseAmount * 8) },
    { id: 6, coins: Math.round(baseAmount * 100), price: +(basePrice * 100).toFixed(2), label: 'Ultimate', bonus: Math.round(baseAmount * 30) },
  ], [baseAmount, basePrice]);

  const selected = COIN_PACKAGES.find(p => p.id === selectedPkg);

  // ── PayPal JS SDK loader ──
  const { data: paypalClientId } = useQuery({
    queryKey: ['paypal-client-id'],
    queryFn: async () => {
      // Read from premium_general via edge function or settings
      // Since premium_general is admin-only, we fetch client ID via a lightweight approach
      // The client ID is public (publishable), so we can read it from settings if available
      // However RLS blocks non-admin reads of premium_general, so we invoke the edge function
      const { data } = await supabase.functions.invoke('paypal-purchase', {
        body: { action: 'get-client-id' },
      });
      return data?.clientId as string | undefined;
    },
    enabled: paymentMethod === 'paypal',
    staleTime: 5 * 60 * 1000,
  });

  // Load PayPal SDK script when method is paypal and we have client ID
  useEffect(() => {
    if (paymentMethod !== 'paypal' || !paypalClientId) return;

    // Already loaded with same client ID
    if (window.paypal) {
      setPaypalReady(true);
      return;
    }

    // Remove any old script
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

  // Render PayPal buttons when SDK ready + package selected
  useEffect(() => {
    if (
      paymentMethod !== 'paypal' ||
      !paypalReady ||
      !window.paypal ||
      !selected ||
      !user ||
      !paypalContainerRef.current
    ) return;

    // Clear previous buttons
    paypalContainerRef.current.innerHTML = '';
    paypalButtonsRendered.current = false;

    const selectedCoins = selected.coins;
    const selectedPrice = selected.price;

    window.paypal.Buttons({
      style: { layout: 'vertical', shape: 'rect', label: 'pay', height: 45 },
      createOrder: async () => {
        const { data, error } = await supabase.functions.invoke('paypal-purchase', {
          body: { action: 'create-order', amount: selectedPrice, coins: selectedCoins },
        });
        if (error || !data?.orderId) {
          throw new Error(data?.error || 'Failed to create order');
        }
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
      onCancel: () => {
        toast.info('Payment cancelled.');
      },
      onError: (err: any) => {
        console.error('PayPal error:', err);
        toast.error('Payment failed. Please try again.');
      },
    }).render(paypalContainerRef.current);
    paypalButtonsRendered.current = true;
  }, [paymentMethod, paypalReady, selected?.id, user?.id]);

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

  const handlePurchase = async () => {
    if (!selected || !user) return;
    const returnUrl = window.location.origin + '/coin-shop';

    if (paymentMethod === 'stripe') {
      setProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
          body: {
            action: 'create-checkout',
            coins: selected.coins,
            amount: selected.price,
            returnUrl,
          },
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
          body: {
            action: 'create-payment',
            coins: selected.coins,
            amount: selected.price,
          },
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
    // PayPal is handled by the SDK buttons — no action here
  };

  return (
    <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 xl:px-24 py-6 sm:py-10 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 sm:w-11 h-10 sm:h-11 rounded-2xl bg-coin-gold/15 flex items-center justify-center">
            <ShoppingCart className="w-5 sm:w-6 h-5 sm:h-6 text-coin-gold" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">{currencyName} Shop</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">Purchase {currencyName.toLowerCase()} to unlock premium chapters</p>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-card border border-border/60 px-3 sm:px-4 py-2">
          <CurrencyIcon className="w-4 h-4 text-coin-gold" />
          <span className="font-semibold text-sm text-foreground">{coinBalance}</span>
        </div>
      </div>

      {/* Packages */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">Choose a Package</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
          {COIN_PACKAGES.map((pkg) => {
            const isSelected = selectedPkg === pkg.id;
            return (
              <button
                key={pkg.id}
                onClick={() => setSelectedPkg(pkg.id)}
                className={`relative rounded-2xl border p-3 sm:p-5 text-left transition-all duration-200 hover:scale-[1.02] ${
                  isSelected
                    ? 'border-primary bg-primary/[0.05] ring-2 ring-primary/30 shadow-md'
                    : 'border-border/60 bg-card hover:border-border'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2 sm:px-3 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> POPULAR
                  </span>
                )}
                {isSelected && (
                  <div className="absolute top-2 sm:top-3 right-2 sm:right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                )}
                <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
                  <CurrencyIcon className="w-4 sm:w-5 h-4 sm:h-5 text-coin-gold" />
                  <span className="text-lg sm:text-xl font-bold text-foreground">{pkg.coins.toLocaleString()}</span>
                </div>
                {pkg.bonus && (
                  <span className="inline-block text-[10px] font-semibold bg-accent text-accent-foreground px-2 py-0.5 rounded-full mb-1 sm:mb-2">
                    +{pkg.bonus} BONUS
                  </span>
                )}
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] sm:text-xs text-muted-foreground">{pkg.label}</span>
                  <span className="text-base sm:text-lg font-bold text-foreground">${pkg.price}</span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Payment Method */}
      <section className="mb-8 sm:mb-10">
        <h2 className="text-lg font-bold text-foreground mb-4">Payment Method</h2>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          {PAYMENT_METHODS.map((method) => {
            const isActive = paymentMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 sm:flex-1 transition-all duration-200 ${
                  isActive
                    ? 'border-primary bg-primary/[0.05] ring-1 ring-primary/30'
                    : 'border-border/60 bg-card hover:border-border'
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isActive ? 'bg-primary/15' : 'bg-muted/50'}`}>
                  <method.icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <span className={`text-sm font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                  {method.label}
                </span>
                {isActive && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 text-primary-foreground" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Purchase area */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6">
        {selected ? (
          <>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <CurrencyIcon className="w-6 h-6 text-coin-gold" />
                <div>
                  <p className="font-semibold text-foreground">
                    {selected.coins.toLocaleString()} {currencyName}
                    {selected.bonus ? ` + ${selected.bonus} Bonus` : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    via {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.label}
                  </p>
                </div>
              </div>

              {/* Show buy button for non-PayPal methods */}
              {paymentMethod !== 'paypal' && (
                <Button
                  className="rounded-xl px-6 sm:px-8 gap-2 text-sm sm:text-base h-11 sm:h-12 w-full sm:w-auto"
                  onClick={handlePurchase}
                  disabled={processing || !user}
                >
                  {processing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  {processing ? 'Processing...' : `Buy for $${selected.price}`}
                </Button>
              )}
            </div>

            {/* PayPal Buttons container */}
            {paymentMethod === 'paypal' && (
              <div className="mt-2">
                {paypalLoading && (
                  <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading PayPal...</span>
                  </div>
                )}
                {processing && (
                  <div className="flex items-center justify-center py-4 gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Processing payment...</span>
                  </div>
                )}
                <div ref={paypalContainerRef} className={processing ? 'opacity-50 pointer-events-none' : ''} />
                {!paypalLoading && !paypalReady && paymentMethod === 'paypal' && !paypalClientId && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    PayPal is not configured. Contact the site admin.
                  </p>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground w-full text-center">Select a package above to proceed</p>
        )}
      </div>

      {/* USDT Payment Dialog */}
      <Dialog open={!!usdtPayment} onOpenChange={(open) => !open && setUsdtPayment(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleDollarSign className="w-5 h-5 text-primary" />
              USDT Payment
            </DialogTitle>
          </DialogHeader>
          {usdtPayment && (
            <div className="space-y-4">
              <div className="rounded-xl bg-muted/50 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Send exactly</p>
                  <p className="text-lg font-bold text-foreground">{usdtPayment.payAmount} {usdtPayment.payCurrency?.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">To this address</p>
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-background px-2 py-1 rounded border border-border flex-1 break-all">{usdtPayment.payAddress}</code>
                    <Button
                      size="icon"
                      variant="outline"
                      className="shrink-0 h-8 w-8"
                      onClick={() => {
                        navigator.clipboard.writeText(usdtPayment.payAddress);
                        toast.success('Address copied!');
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {usdtPayment.expirationEstimate && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    Expires: {new Date(usdtPayment.expirationEstimate).toLocaleString()}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Your balance will update automatically once the payment is confirmed on the blockchain. This usually takes 1-5 minutes.
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
