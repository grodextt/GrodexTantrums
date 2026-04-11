import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';

export default function SubscribeSuccess() {
  const [status, setStatus] = useState<'verifying' | 'success' | 'checking' | 'error'>('checking');
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  useEffect(() => {
    async function handleCapture() {
      const searchParams = new URLSearchParams(location.search);
      const token = searchParams.get('token');
      const method = searchParams.get('method');
      const savedToken = sessionStorage.getItem('current_sub_order');
      const planId = sessionStorage.getItem('current_sub_plan');
      
      if (method === 'usdt') {
        setStatus('verifying');
        // Poll for subscription status or wait
        const checkSubInterval = setInterval(async () => {
          if (!user) return;
          const { data } = await supabase.from('user_subscriptions')
            .select('*')
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();
            
          if (data) {
            clearInterval(checkSubInterval);
            setStatus('success');
            queryClient.invalidateQueries({ queryKey: ['user-subscription', user.id] });
          }
        }, 3000);
        
        // Timeout after 30 seconds
        setTimeout(() => {
          clearInterval(checkSubInterval);
          if (status !== 'success') {
            setStatus('success'); // Assume it takes a bit but it's pending
            toast.info('Your payment is confirming on the blockchain. Subscription will activate shortly.', { duration: 6000 });
          }
        }, 30000);
        
        return;
      }
      
      if (!token || !savedToken || token !== savedToken || !planId) {
        setStatus('error');
        return;
      }
      
      setStatus('verifying');
      
      try {
        const { error } = await supabase.functions.invoke('capture-subscription-order', {
          body: { orderId: token, planId }
        });
        
        if (error) throw error;
        
        sessionStorage.removeItem('current_sub_order');
        sessionStorage.removeItem('current_sub_plan');
        setStatus('success');
        
        // Invalidate queries so UI updates instantly
        if (user) {
          queryClient.invalidateQueries({ queryKey: ['user-subscription', user.id] });
          queryClient.invalidateQueries({ queryKey: ['user-manga-balance', user.id] });
        }
        
        toast.success('Subscription activated successfully!');
      } catch (err) {
        console.error('Failed to capture subscription:', err);
        setStatus('error');
        toast.error('Failed to verify payment. If you were charged, please contact support.');
      }
    }
    
    handleCapture();
  }, [location, queryClient, user]);

  return (
    <div className="max-w-md mx-auto py-32 px-6 min-h-[70vh] flex flex-col justify-center items-center text-center space-y-6">
      {status === 'checking' || status === 'verifying' ? (
        <>
          <div className="w-20 h-20 bg-purple-500/10 rounded-full flex items-center justify-center border border-purple-500/20 mb-4 animate-pulse">
            <Icon icon="ph:spinner-gap-bold" className="w-10 h-10 text-purple-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-black">{status === 'verifying' ? 'Verifying Payment...' : 'Please Wait...'}</h1>
          <p className="text-muted-foreground">Do not close or refresh this page.</p>
        </>
      ) : status === 'success' ? (
        <>
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-4">
            <Icon icon="ph:check-circle-bold" className="w-10 h-10 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-black text-emerald-400">Welcome to the Club!</h1>
          {location.search.includes('method=usdt') ? (
            <p className="text-muted-foreground">Your invoice was generated. If you completed the payment, your subscription will activate automatically once network confirmations are received.</p>
          ) : (
            <p className="text-muted-foreground">Your subscription is now active. You have full access to subscriber-only chapters.</p>
          )}
          <Button onClick={() => navigate('/')} className="mt-8 bg-emerald-600 hover:bg-emerald-500 h-12 px-8 rounded-xl font-bold">
            Start Reading
          </Button>
        </>
      ) : (
        <>
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center border border-rose-500/20 mb-4">
            <Icon icon="ph:warning-circle-bold" className="w-10 h-10 text-rose-500" />
          </div>
          <h1 className="text-2xl font-black text-rose-500">Verification Failed</h1>
          <p className="text-muted-foreground">We couldn't verify your payment. If you were charged, please contact support.</p>
          <Button onClick={() => navigate('/subscribe')} variant="outline" className="mt-8 h-12 px-8 rounded-xl font-bold">
            Back to Plans
          </Button>
        </>
      )}
    </div>
  );
}
