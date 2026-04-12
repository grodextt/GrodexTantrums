import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AllPremiumSettings } from '@/hooks/usePremiumSettings';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  duration_days: number;
  price_usd: number;
  is_active: boolean;
  bonus_coins: number;
  created_at: string;
}

interface Props {
  settings: AllPremiumSettings;
  updatePremiumSettings: any;
}

export default function SubscriptionSystemTab({ settings, updatePremiumSettings }: Props) {
  const queryClient = useQueryClient();
  const sub = settings.subscription_settings;

  // Section A — Identity
  const [subName, setSubName] = useState(sub.subscription_name);
  const [badgeLabel, setBadgeLabel] = useState(sub.badge_label);

  // Section C — Privileges
  const [bonusCoinsEnabled, setBonusCoinsEnabled] = useState(sub.bonus_coins_enabled);
  const [doubleDailyLogin, setDoubleDailyLogin] = useState(sub.double_daily_login_enabled);
  const [showSubCount, setShowSubCount] = useState(sub.show_subscriber_count);

  // Section E — Auto-free default
  const [defaultFreeDays, setDefaultFreeDays] = useState(sub.default_free_release_days);

  // Section D — Payment Methods
  const [subEnablePaypal, setSubEnablePaypal] = useState(sub.sub_enable_paypal);
  const [subPaypalClientId, setSubPaypalClientId] = useState(sub.sub_paypal_client_id);
  const [subPaypalSecret, setSubPaypalSecret] = useState(sub.sub_paypal_secret);
  const [subPaypalSandbox, setSubPaypalSandbox] = useState(sub.sub_paypal_sandbox);
  const [subEnableUsdt, setSubEnableUsdt] = useState(sub.sub_enable_usdt);
  const [subUsdtAddress, setSubUsdtAddress] = useState(sub.sub_usdt_address);
  const [subCryptomusMerchantId, setSubCryptomusMerchantId] = useState(sub.sub_cryptomus_merchant_id);
  const [subCryptomusPaymentKey, setSubCryptomusPaymentKey] = useState(sub.sub_cryptomus_payment_key);

  // Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [planName, setPlanName] = useState('');
  const [planDesc, setPlanDesc] = useState('');
  const [planDuration, setPlanDuration] = useState(30);
  const [planPrice, setPlanPrice] = useState(4.99);
  const [planBonus, setPlanBonus] = useState(0);
  const [planActive, setPlanActive] = useState(true);

  // Tutorial
  const [paypalTutOpen, setPaypalTutOpen] = useState(false);
  const [usdtTutOpen, setUsdtTutOpen] = useState(false);

  // Load settings
  useEffect(() => {
    setSubName(sub.subscription_name);
    setBadgeLabel(sub.badge_label);
    setBonusCoinsEnabled(sub.bonus_coins_enabled);
    setDoubleDailyLogin(sub.double_daily_login_enabled);
    setShowSubCount(sub.show_subscriber_count);
    setDefaultFreeDays(sub.default_free_release_days);
    setSubEnablePaypal(sub.sub_enable_paypal);
    setSubPaypalClientId(sub.sub_paypal_client_id);
    setSubPaypalSecret(sub.sub_paypal_secret);
    setSubPaypalSandbox(sub.sub_paypal_sandbox);
    setSubEnableUsdt(sub.sub_enable_usdt);
    setSubUsdtAddress(sub.sub_usdt_address);
    setSubCryptomusMerchantId(sub.sub_cryptomus_merchant_id);
    setSubCryptomusPaymentKey(sub.sub_cryptomus_payment_key);
  }, [sub]);

  // Fetch plans from DB
  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('duration_days', { ascending: true });
      if (error) throw error;
      return data as SubscriptionPlan[];
    },
  });

  const saveSubscriptionSettings = async () => {
    try {
      await updatePremiumSettings.mutateAsync({
        key: 'subscription_settings',
        value: {
          subscription_name: subName,
          badge_label: badgeLabel,
          bonus_coins_enabled: bonusCoinsEnabled,
          double_daily_login_enabled: doubleDailyLogin,
          show_subscriber_count: showSubCount,
          default_free_release_days: defaultFreeDays,
          sub_enable_paypal: subEnablePaypal,
          sub_paypal_client_id: subPaypalClientId,
          sub_paypal_secret: subPaypalSecret,
          sub_paypal_sandbox: subPaypalSandbox,
          sub_enable_usdt: subEnableUsdt,
          sub_usdt_address: subUsdtAddress,
          sub_cryptomus_merchant_id: subCryptomusMerchantId,
          sub_cryptomus_payment_key: subCryptomusPaymentKey,
        },
      });
      toast.success('Subscription settings saved');
    } catch {
      toast.error('Failed to save subscription settings');
    }
  };

  const openAddPlan = () => {
    setEditingPlan(null);
    setPlanName(''); setPlanDesc(''); setPlanDuration(30);
    setPlanPrice(4.99); setPlanBonus(0); setPlanActive(true);
    setShowPlanModal(true);
  };

  const openEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setPlanName(plan.name);
    setPlanDesc(plan.description);
    setPlanDuration(plan.duration_days);
    setPlanPrice(plan.price_usd);
    setPlanBonus(plan.bonus_coins);
    setPlanActive(plan.is_active);
    setShowPlanModal(true);
  };

  const handleSavePlan = async () => {
    if (!planName.trim()) { toast.error('Plan name is required'); return; }
    try {
      if (editingPlan) {
        const { error } = await supabase.from('subscription_plans').update({
          name: planName.trim(), description: planDesc, duration_days: planDuration,
          price_usd: planPrice, bonus_coins: planBonus, is_active: planActive,
        }).eq('id', editingPlan.id);
        if (error) throw error;
        toast.success('Plan updated');
      } else {
        const { error } = await supabase.from('subscription_plans').insert({
          name: planName.trim(), description: planDesc, duration_days: planDuration,
          price_usd: planPrice, bonus_coins: planBonus, is_active: planActive,
        });
        if (error) throw error;
        toast.success('Plan created');
      }
      setShowPlanModal(false);
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    }
  };

  const handleDeletePlan = async (id: string) => {
    try {
      const { error } = await supabase.from('subscription_plans').delete().eq('id', id);
      if (error) throw error;
      toast.success('Plan deleted');
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    }
  };

  const handleTogglePlan = async (plan: SubscriptionPlan) => {
    try {
      const { error } = await supabase.from('subscription_plans')
        .update({ is_active: !plan.is_active }).eq('id', plan.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['subscription-plans'] });
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`);
    }
  };

  const StatusBadge = ({ configured, enabled }: { configured: boolean; enabled: boolean }) => {
    if (!enabled) return <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Disabled</span>;
    if (configured) return <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">Active</span>;
    return <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">Not Configured</span>;
  };

  const TutorialToggle = ({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) => (
    <button onClick={onToggle} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors">
      <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
      {label}
      {open ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
    </button>
  );

  const getDurationLabel = (days: number) => {
    if (days <= 7) return 'Weekly';
    if (days <= 14) return 'Bi-Weekly';
    if (days <= 31) return 'Monthly';
    if (days <= 93) return 'Quarterly';
    if (days <= 186) return 'Semi-Annual';
    return 'Annual';
  };

  const PLAN_ICONS: Record<string, { icon: string; color: string; bg: string }> = {
    Weekly: { icon: 'ph:calendar-blank-bold', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    'Bi-Weekly': { icon: 'ph:calendar-dots-bold', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
    Monthly: { icon: 'ph:calendar-bold', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    Quarterly: { icon: 'ph:calendar-plus-bold', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    'Semi-Annual': { icon: 'ph:calendar-star-bold', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    Annual: { icon: 'ph:calendar-check-bold', color: 'text-purple-500', bg: 'bg-purple-500/10' },
  };

  return (
    <div className="space-y-6">
      {/* ─── OVERVIEW & STRATEGY ─── */}
      <div className="bg-gradient-to-br from-amber-500/10 via-background to-background border border-amber-500/20 rounded-2xl p-6 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-4 opacity-10 -rotate-12 scale-150">
           <Icon icon="ph:crown-fill" className="w-24 h-24 text-amber-500" />
         </div>
         <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
           <Icon icon="ph:sketch-logo-bold" className="w-5 h-5 text-amber-500" />
           Subscription Strategy
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
           <div className="space-y-2">
             <p className="text-xs font-bold text-foreground flex items-center gap-2">
               <Icon icon="ph:lightning-bold" className="text-amber-500" />
               The "Early Access" Model
             </p>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               Most successful sites lock new chapters for <strong>7-14 days</strong> under a Subscription. After that, they become <strong>Coins-only</strong> for another period, then finally <strong>Free</strong>. This maximizes revenue from eager fans.
             </p>
           </div>
           <div className="space-y-2">
             <p className="text-xs font-bold text-foreground flex items-center gap-2">
               <Icon icon="ph:gift-bold" className="text-emerald-500" />
               Retention Tip
             </p>
             <p className="text-[11px] text-muted-foreground leading-relaxed">
               Add <strong>Bonus Coins</strong> to your subscription plans. This gives users immediate value and encourages them to spend those coins on library series they haven't finished yet.
             </p>
           </div>
         </div>
      </div>

      {/* ─── SECTION A: Subscription Identity ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <Icon icon="ph:tag-bold" className="w-4 h-4" /> Subscription Identity
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Customize how your subscription appears site-wide.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Subscription Name</label>
            <Input value={subName} onChange={e => setSubName(e.target.value)} className="rounded-xl bg-background" placeholder="e.g. Club, Premium Pass" />
            <p className="text-[10px] text-muted-foreground mt-1">Appears in menus, buttons, and chapter badges (e.g. "Upgrade to Club")</p>
          </div>
          <div>
            <label className="text-sm font-semibold mb-1.5 block">Badge Label</label>
            <Input value={badgeLabel} onChange={e => setBadgeLabel(e.target.value)} className="rounded-xl bg-background" placeholder="e.g. Early Access" />
            <p className="text-[10px] text-muted-foreground mt-1">Shown on subscription chapters in the chapter list</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-xl">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/20">
            <Icon icon="mdi:new-releases" className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold text-amber-500">{badgeLabel || 'Early Access'}</span>
          </div>
          <span className="text-xs text-muted-foreground">← Preview of the chapter badge</span>
        </div>
      </div>

      {/* ─── SECTION B: Subscription Plans ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold flex items-center gap-2 text-base">
              <Icon icon="ph:crown-bold" className="w-4 h-4" /> Subscription Plans
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">Manage your subscription tiers. These appear on the Subscribe page.</p>
          </div>
          <Button onClick={openAddPlan} size="sm" className="gap-1.5 h-8 rounded-lg">
            <Icon icon="ph:plus-bold" /> Add Plan
          </Button>
        </div>

        {plansLoading ? (
          <div className="text-center py-6 text-muted-foreground text-sm">Loading plans...</div>
        ) : plans.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
            No subscription plans yet. Click "Add Plan" to create your first one.
          </div>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const dur = getDurationLabel(plan.duration_days);
              const pi = PLAN_ICONS[dur] || PLAN_ICONS.Monthly;
              return (
                <div key={plan.id} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${plan.is_active ? 'bg-muted/20 border-border/50' : 'bg-muted/5 border-border/20 opacity-60'}`}>
                  <div className={`w-10 h-10 rounded-xl ${pi.bg} flex items-center justify-center shrink-0`}>
                    <Icon icon={pi.icon} className={`w-5 h-5 ${pi.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{plan.name}</p>
                      {!plan.is_active && <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">Inactive</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.duration_days} days • {plan.bonus_coins > 0 ? `+${plan.bonus_coins} bonus coins` : 'No bonus coins'}</p>
                    {plan.description && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{plan.description}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-emerald-400">${Number(plan.price_usd).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch checked={plan.is_active} onCheckedChange={() => handleTogglePlan(plan)} />
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditPlan(plan)}>
                      <Icon icon="ph:pencil-simple-bold" className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleDeletePlan(plan.id)}>
                      <Icon icon="ph:trash-bold" className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─── SECTION C: Subscription Privileges ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <Icon icon="ph:shield-star-bold" className="w-4 h-4" /> Subscription Privileges
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Configure what benefits subscribers receive.</p>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-xl">
            <div>
              <p className="text-sm font-medium flex items-center gap-2">
                <Icon icon="ph:lock-open-bold" className="w-4 h-4 text-emerald-500" /> Early Access to {badgeLabel || 'Subscription'} Chapters
              </p>
              <p className="text-xs text-muted-foreground">Core privilege — subscribers can read locked chapters immediately.</p>
            </div>
            <Switch checked disabled />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="text-sm font-medium">Bonus Coins on Payment</p>
              <p className="text-xs text-muted-foreground">Award bonus coins from plan settings when a subscription is purchased.</p>
            </div>
            <Switch checked={bonusCoinsEnabled} onCheckedChange={setBonusCoinsEnabled} />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="text-sm font-medium">Double Daily Login Rewards</p>
              <p className="text-xs text-muted-foreground">Subscribers get 2× tokens from daily check-in.</p>
            </div>
            <Switch checked={doubleDailyLogin} onCheckedChange={setDoubleDailyLogin} />
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
            <div>
              <p className="text-sm font-medium">Show Active Subscriber Count</p>
              <p className="text-xs text-muted-foreground">Display the number of active subscribers on the Subscribe page.</p>
            </div>
            <Switch checked={showSubCount} onCheckedChange={setShowSubCount} />
          </div>
        </div>
      </div>

      {/* ─── SECTION D: Payment Methods ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <Icon icon="ph:credit-card-bold" className="w-4 h-4" /> Subscription Payment Methods
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Separate from coin payment methods. Use different accounts to avoid flagging.</p>
        </div>

        {/* PayPal for Subscriptions */}
        <div className="border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Icon icon="ph:wallet-bold" className="w-4.5 h-4.5 text-blue-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">PayPal (Subscriptions)</h4>
                <p className="text-xs text-muted-foreground">Separate PayPal credentials for subscription payments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge configured={!!subPaypalClientId && !!subPaypalSecret} enabled={subEnablePaypal} />
              <Switch checked={subEnablePaypal} onCheckedChange={setSubEnablePaypal} />
            </div>
          </div>
          {subEnablePaypal && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                <div>
                  <p className="text-xs font-medium">Sandbox Mode (Testing)</p>
                  <p className="text-[10px] text-muted-foreground">Use sandbox credentials for testing</p>
                </div>
                <Switch checked={subPaypalSandbox} onCheckedChange={setSubPaypalSandbox} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Client ID</label>
                <Input value={subPaypalClientId} onChange={e => setSubPaypalClientId(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="AX..." />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Secret</label>
                <Input type="password" value={subPaypalSecret} onChange={e => setSubPaypalSecret(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="EL..." />
              </div>
              <TutorialToggle open={paypalTutOpen} onToggle={() => setPaypalTutOpen(!paypalTutOpen)} label="How to get PayPal credentials" />
              {paypalTutOpen && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm text-muted-foreground border border-border/40">
                  <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Setup Guide</p>
                  <ol className="list-decimal list-inside space-y-1.5 text-xs">
                    <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener" className="text-primary underline">developer.paypal.com</a> and log in.</li>
                    <li>Navigate to <strong>Apps & Credentials</strong>.</li>
                    <li>Click <strong>"Create App"</strong> — name it something like "Subscriptions".</li>
                    <li>Select <strong>"Merchant"</strong> as the app type and click Create.</li>
                    <li>Copy the <strong>Client ID</strong> and <strong>Secret</strong>.</li>
                    <li>Paste them above and click <strong>Save</strong>.</li>
                  </ol>
                  <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg mt-2">
                    <Icon icon="ph:warning-bold" className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-600 dark:text-amber-400">Using a <strong>separate</strong> PayPal app/account from your coin system prevents payment flagging issues.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* USDT for Subscriptions */}
        <div className="border border-border rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Icon icon="ph:currency-circle-dollar-bold" className="w-4.5 h-4.5 text-emerald-500" />
              </div>
              <div>
                <h4 className="font-semibold text-sm">USDT (Subscriptions)</h4>
                <p className="text-xs text-muted-foreground">Separate crypto credentials for subscription payments</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge configured={!!subCryptomusMerchantId} enabled={subEnableUsdt} />
              <Switch checked={subEnableUsdt} onCheckedChange={setSubEnableUsdt} />
            </div>
          </div>
          {subEnableUsdt && (
            <div className="space-y-3 pt-3 border-t border-border">
              <div>
                <label className="text-sm font-medium mb-1 block">Cryptomus Merchant ID</label>
                <Input type="text" value={subCryptomusMerchantId} onChange={e => setSubCryptomusMerchantId(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="Merchant ID" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Cryptomus Payment Key</label>
                <Input type="password" value={subCryptomusPaymentKey} onChange={e => setSubCryptomusPaymentKey(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="Payment Key" />
              </div>
              <TutorialToggle open={usdtTutOpen} onToggle={() => setUsdtTutOpen(!usdtTutOpen)} label="Detailed Cryptomus Setup Guide" />
              {usdtTutOpen && (
                <div className="bg-muted/30 rounded-xl p-5 space-y-4 text-sm text-muted-foreground border border-border/40 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                     <p className="font-bold text-foreground flex items-center gap-2">
                       <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
                       Separate Project Recommended
                     </p>
                     <p className="text-[11px] pl-7 leading-relaxed">
                       We recommend creating a <strong>Separate Project</strong> in your Cryptomus dashboard for subscriptions. This keeps your bookkeeping clean and allows you to use a different webhook URL.
                     </p>
                  </div>

                  <div className="space-y-2">
                     <p className="font-bold text-foreground flex items-center gap-2">
                       <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
                       Get API Credentials
                     </p>
                     <ul className="list-disc list-inside pl-7 space-y-1 text-xs">
                       <li>Go to <strong>Settings -> API & Integration</strong> in your Cryptomus project.</li>
                       <li>Copy the <strong>Merchant ID</strong> and <strong>Payment Key</strong> (IPN Secret).</li>
                       <li>Paste them into the fields above.</li>
                     </ul>
                  </div>

                  <div className="space-y-2">
                     <p className="font-bold text-foreground flex items-center gap-2">
                       <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
                       Configure Webhook (CRITICAL)
                     </p>
                     <p className="text-[11px] pl-7 leading-relaxed">
                       Set the Success Webhook URL in your Cryptomus dashboard to:
                     </p>
                     <div className="ml-7 p-2.5 bg-background border border-border rounded-lg font-mono text-[10px] break-all select-all">
                       [YOUR_SUPABASE_URL]/functions/v1/subscription-webhook
                     </div>
                     <p className="text-[10px] pl-7 text-amber-500 font-medium italic mt-1">
                       * Note: This uses "subscription-webhook" instead of "cryptomus-webhook".
                     </p>
                  </div>

                  <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
                    <Icon icon="ph:info-bold" className="w-4 h-4 text-blue-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400">Recurring Payments?</p>
                      <p className="text-[10px] text-blue-600/80 leading-relaxed">Cryptomus for USDT is <strong>one-time payment</strong>. To "renew", users simply buy the plan again. The system will extend their expiry date automatically.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── SECTION E: Auto-Free Release Default ─── */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2 text-base">
            <Icon icon="ph:timer-bold" className="w-4 h-4" /> Auto-Free Release Default
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">Default number of days before a subscription chapter becomes free for all readers.</p>
        </div>
        <div className="flex items-center gap-3">
          <Input
            type="number" min={1} value={defaultFreeDays}
            onChange={e => setDefaultFreeDays(Math.max(1, parseInt(e.target.value) || 7))}
            className="rounded-xl bg-background w-28"
          />
          <span className="text-sm text-muted-foreground">days</span>
        </div>
        <p className="text-xs text-muted-foreground">Admins can override this per chapter. E.g. "7" means subscription chapters become free 7 days after release.</p>
      </div>

      <Button className="rounded-xl gap-2" onClick={saveSubscriptionSettings} disabled={updatePremiumSettings.isPending}>
        <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" /> Save Subscription Settings
      </Button>

      {/* ─── PLAN ADD/EDIT MODAL ─── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setShowPlanModal(false)}>
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">{editingPlan ? 'Edit Plan' : 'Add Plan'}</h3>
              <button onClick={() => setShowPlanModal(false)} className="text-muted-foreground hover:text-foreground">
                <Icon icon="ph:x-bold" className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold mb-1 block">Plan Name</label>
                <Input value={planName} onChange={e => setPlanName(e.target.value)} placeholder="e.g. Monthly" className="rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Description</label>
                <Input value={planDesc} onChange={e => setPlanDesc(e.target.value)} placeholder="Short text shown on subscribe page" className="rounded-xl bg-background" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1 block">Duration (days)</label>
                  <Input type="number" min={1} value={planDuration} onChange={e => setPlanDuration(Math.max(1, parseInt(e.target.value) || 1))} className="rounded-xl bg-background" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1 block">Price (USD)</label>
                  <Input type="number" step="0.01" min={0.01} value={planPrice} onChange={e => setPlanPrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))} className="rounded-xl bg-background" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Bonus Coins</label>
                <Input type="number" min={0} value={planBonus} onChange={e => setPlanBonus(Math.max(0, parseInt(e.target.value) || 0))} className="rounded-xl bg-background" />
                <p className="text-[10px] text-muted-foreground mt-1">Coins instantly added to user balance on purchase</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <span className="text-sm font-medium">Active</span>
                <Switch checked={planActive} onCheckedChange={setPlanActive} />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setShowPlanModal(false)}>Cancel</Button>
              <Button className="flex-1 rounded-xl gap-2" onClick={handleSavePlan}>
                <Icon icon="ph:check-bold" className="w-4 h-4" /> {editingPlan ? 'Update Plan' : 'Create Plan'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
