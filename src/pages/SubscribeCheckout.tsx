import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionPlans } from '@/hooks/useSubscription';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export default function SubscribeCheckout() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: plans, isLoading } = useSubscriptionPlans();
  const [method, setMethod] = useState<'paypal' | 'usdt'>('paypal');
  const [processing, setProcessing] = useState(false);
  const [cryptoPaymentInfo, setCryptoPaymentInfo] = useState<any>(null);
  const [isCryptoModalOpen, setIsCryptoModalOpen] = useState(false);
  const pollIntervalRef = useRef<any>(null);

  const plan = plans?.find(p => p.id === planId);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [user, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Icon icon="ph:spinner-bold" className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Icon icon="ph:warning-circle-bold" className="w-12 h-12 text-rose-500" />
        <h2 className="text-xl font-bold">Plan not found</h2>
        <Button onClick={() => navigate('/subscribe')} variant="outline">Back to Plans</Button>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user || !plan) return;
    setProcessing(true);

    try {
      if (method === 'paypal') {
        const { data, error } = await supabase.functions.invoke('create-subscription-order', {
          body: { planId: plan.id, method: 'paypal' }
        });

        if (error) throw error;

        if (data?.orderId && data?.approveUrl) {
          // Store token to verify later
          sessionStorage.setItem('current_sub_order', data.orderId);
          sessionStorage.setItem('current_sub_plan', plan.id);
          window.location.href = data.approveUrl;
        } else {
          throw new Error('Invalid response from payment server');
        }
      } else if (method === 'usdt') {
        const { data, error } = await supabase.functions.invoke('create-subscription-order', {
          body: { planId: plan.id, method: 'usdt' }
        });

        if (error) throw error;
        
        // Use the native inline result 
        if (data?.payAddress && data?.payAmount) {
          setCryptoPaymentInfo(data);
          setIsCryptoModalOpen(true);
          
          // Poll for status
          pollIntervalRef.current = setInterval(async () => {
             const { data: subData } = await supabase
               .from('user_subscriptions')
               .select('status')
               .eq('payment_id', data.uuid)
               .maybeSingle();

             if (subData?.status === 'active') {
                clearInterval(pollIntervalRef.current);
                setIsCryptoModalOpen(false);
                toast.success('Payment Received! Subscription activated.');
                navigate('/subscribe/success?method=usdt');
             }
          }, 5000);

        } else if (data?.invoiceUrl) {
          // Cryptomus hosted fallback
          window.location.href = data.invoiceUrl;
        } else {
          throw new Error(data?.error || 'Failed to create USDT invoice');
        }
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      toast.error(err.message || 'Failed to start checkout. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <div className="max-w-md mx-auto py-20 px-6 min-h-[80vh] flex flex-col justify-center">
      <div className="bg-card border border-border/50 rounded-3xl p-8 shadow-xl space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-4 border border-purple-500/20">
            <Icon icon="ph:shopping-cart-bold" className="w-8 h-8 text-purple-400" />
          </div>
          <h1 className="text-2xl font-black">Checkout</h1>
          <p className="text-muted-foreground text-sm">Complete your subscription purchase</p>
        </div>

        <div className="p-5 rounded-2xl bg-secondary/50 border border-border/50 space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-semibold">{plan.name} Plan</span>
            <span className="font-black text-xl">${Number(plan.price_usd).toFixed(2)}</span>
          </div>
          <div className="text-sm text-muted-foreground flex justify-between">
            <span>Duration</span>
            <span>{plan.duration_days} Days</span>
          </div>
          {plan.bonus_coins > 0 && (
            <div className="text-sm text-amber-500 flex justify-between font-medium">
              <span>Bonus Coins</span>
              <span>+{plan.bonus_coins}</span>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h3 className="font-bold text-sm">Payment Method</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setMethod('paypal')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'paypal' ? 'border-blue-500 bg-blue-500/10' : 'border-border/50 bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <Icon icon="logos:paypal" className="w-6 h-6" />
              <span className="text-xs font-bold">PayPal</span>
            </button>
            <button
              onClick={() => setMethod('usdt')}
              className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                method === 'usdt' ? 'border-emerald-500 bg-emerald-500/10' : 'border-border/50 bg-secondary/50 hover:bg-secondary'
              }`}
            >
              <Icon icon="cryptocurrency-color:usdt" className="w-6 h-6" />
              <span className="text-xs font-bold">USDT (TRC20)</span>
            </button>
          </div>
        </div>

        <Button
          onClick={handleCheckout}
          disabled={processing}
          className="w-full h-14 rounded-xl shadow-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-base"
        >
          {processing ? (
            <><Icon icon="ph:spinner-bold" className="w-5 h-5 animate-spin mr-2" /> Processing...</>
          ) : (
            `Pay $${Number(plan.price_usd).toFixed(2)}`
          )}
        </Button>
      </div>

      <Dialog open={isCryptoModalOpen} onOpenChange={(open) => {
         if (!open) {
           setIsCryptoModalOpen(false);
           if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
         }
      }}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon icon="cryptocurrency-color:usdt" className="w-5 h-5" /> 
              Pay with USDT
            </DialogTitle>
            <DialogDescription>
              Send exactly the amount below to the provided {cryptoPaymentInfo?.network || 'BSC'} address.
            </DialogDescription>
          </DialogHeader>

          {cryptoPaymentInfo && (
            <div className="space-y-6 pt-2">
              {/* QR Code */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm mx-auto max-w-fit">
                <img 
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${cryptoPaymentInfo.payAddress}`} 
                   alt="Wallet Address QR" 
                   className="w-40 h-40 object-contain"
                />
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Amount to Send</label>
                <div className="flex gap-2">
                  <Input readOnly value={`${cryptoPaymentInfo.payAmount}`} className="font-mono bg-muted/50 rounded-lg h-11 text-lg font-bold text-emerald-600" />
                  <Button variant="secondary" className="h-11 px-4 shrinks-0" onClick={() => handleCopy(cryptoPaymentInfo.payAmount, 'Amount')}>
                    <Icon icon="ph:copy-bold" className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase">Network: {cryptoPaymentInfo.network}</label>
                <div className="flex gap-2">
                  <Input readOnly value={cryptoPaymentInfo.payAddress} className="font-mono bg-muted/50 rounded-lg h-11 text-xs" />
                  <Button variant="secondary" className="h-11 px-4 shrinks-0" onClick={() => handleCopy(cryptoPaymentInfo.payAddress, 'Address')}>
                    <Icon icon="ph:copy-bold" className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium">
                <Icon icon="ph:spinner-bold" className="w-4 h-4 animate-spin shrink-0" />
                Waiting for payment... Do not close this window.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
