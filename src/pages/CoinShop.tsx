import { useState, useMemo, useEffect, useCallback } from 'react';
import { Coins, ShoppingCart, CreditCard, Wallet, CircleDollarSign, Sparkles, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Card / Stripe', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'usdt', label: 'USDT', icon: CircleDollarSign },
] as const;

export default function CoinShop() {
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('stripe');
  const [processing, setProcessing] = useState(false);
  const { settings } = usePremiumSettings();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const COIN_PACKAGES = useMemo(() => [
    { id: 1, coins: baseAmount, price: basePrice, label: 'Starter' },
    { id: 2, coins: Math.round(baseAmount * 3), price: +(pricePerUnit * baseAmount * 3).toFixed(2), label: 'Popular', popular: true },
    { id: 3, coins: Math.round(baseAmount * 7), price: +(pricePerUnit * baseAmount * 7).toFixed(2), label: 'Value', bonus: Math.round(baseAmount) },
    { id: 4, coins: Math.round(baseAmount * 15), price: +(pricePerUnit * baseAmount * 15).toFixed(2), label: 'Premium', bonus: Math.round(baseAmount * 3) },
    { id: 5, coins: Math.round(baseAmount * 32), price: +(pricePerUnit * baseAmount * 32).toFixed(2), label: 'Mega', bonus: Math.round(baseAmount * 8) },
    { id: 6, coins: Math.round(baseAmount * 100), price: +(pricePerUnit * baseAmount * 100).toFixed(2), label: 'Ultimate', bonus: Math.round(baseAmount * 30) },
  ], [baseAmount, basePrice, pricePerUnit]);

  const selected = COIN_PACKAGES.find(p => p.id === selectedPkg);

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

  const handlePurchase = async () => {
    if (!selected || !user) return;

    if (paymentMethod === 'paypal') {
      setProcessing(true);
      try {
        // Get auth session for edge function call
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error('Please sign in to make a purchase');
          setProcessing(false);
          return;
        }

        // Step 1: Create PayPal order via edge function
        const { data: createData, error: createError } = await supabase.functions.invoke('paypal-purchase', {
          body: {
            action: 'create-order',
            coins: selected.coins + (selected.bonus || 0),
            amount: selected.price,
          },
        });

        if (createError || !createData?.orderId) {
          toast.error(createData?.error || 'Failed to create PayPal order');
          setProcessing(false);
          return;
        }

        // Step 2: Redirect user to PayPal approval page
        const paypalOrderId = createData.orderId;
        
        // Open PayPal in a new window for approval
        const approvalUrl = `https://www.paypal.com/checkoutnow?token=${paypalOrderId}`;
        const popup = window.open(approvalUrl, 'paypal-popup', 'width=500,height=700,scrollbars=yes');
        
        // Poll for completion
        const pollInterval = setInterval(async () => {
          if (popup?.closed) {
            clearInterval(pollInterval);
            // Try to capture the order
            try {
              const { data: captureData, error: captureError } = await supabase.functions.invoke('paypal-purchase', {
                body: {
                  action: 'capture-order',
                  orderId: paypalOrderId,
                  coins: selected.coins + (selected.bonus || 0),
                },
              });

              if (captureError || !captureData?.success) {
                if (captureData?.error?.includes('not completed')) {
                  toast.info('Payment was not completed');
                } else {
                  toast.error(captureData?.error || 'Payment capture failed');
                }
              } else {
                toast.success(`${captureData.coins_added} ${currencyName} added to your balance!`);
                queryClient.invalidateQueries({ queryKey: ['coin-balance'] });
                queryClient.invalidateQueries({ queryKey: ['user-balances'] });
              }
            } catch {
              toast.error('Could not verify payment. Please contact support.');
            }
            setProcessing(false);
          }
        }, 1000);
      } catch (err: any) {
        toast.error(err.message || 'Payment failed');
        setProcessing(false);
      }
    } else if (paymentMethod === 'usdt') {
      toast.info('USDT payments require manual verification. Please send the exact amount and submit your transaction hash.');
    } else {
      toast.info('Stripe payments coming soon!');
    }
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

      {/* Purchase */}
      <div className="rounded-2xl border border-border/60 bg-card p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {selected ? (
          <>
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
          </>
        ) : (
          <p className="text-sm text-muted-foreground w-full text-center">Select a package above to proceed</p>
        )}
      </div>
    </div>
  );
}
