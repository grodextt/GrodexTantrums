import { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import SubscriptionSystemTab from './SubscriptionSystemTab';

type SubTab = 'general' | 'coins' | 'tokens' | 'subscriptions';

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Icon icon="ph:gear-bold" className="w-3.5 h-3.5" /> },
  { id: 'coins', label: 'Coin System', icon: <Icon icon="ph:coins-bold" className="w-3.5 h-3.5" /> },
  { id: 'tokens', label: 'Token System', icon: <Icon icon="ph:ticket-bold" className="w-3.5 h-3.5" /> },
  { id: 'subscriptions', label: 'Subscription System', icon: <Icon icon="ph:crown-bold" className="w-3.5 h-3.5" /> },
];

export default function PremiumContent() {
  const { settings, updatePremiumSettings } = usePremiumSettings();
  const [subTab, setSubTab] = useState<SubTab>('general');

  // General form
  const [enableCoins, setEnableCoins] = useState(true);
  const [enableSubs, setEnableSubs] = useState(false);

  // Payment method toggles
  const [enableStripe, setEnableStripe] = useState(false);
  const [enablePaypal, setEnablePaypal] = useState(false);
  // USDT / Cryptomus
  const [enableUsdt, setEnableUsdt] = useState(false);

  // Stripe
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');

  // PayPal
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [paypalSandbox, setPaypalSandbox] = useState(false);

  // USDT / Cryptomus
  const [cryptomusMerchantId, setCryptomusMerchantId] = useState('');
  const [cryptomusPaymentKey, setCryptomusPaymentKey] = useState('');

  // Tutorial expansion
  const [stripeTutorialOpen, setStripeTutorialOpen] = useState(false);
  const [paypalTutorialOpen, setPaypalTutorialOpen] = useState(false);
  const [usdtTutorialOpen, setUsdtTutorialOpen] = useState(false);

  // Coin system form
  const [currencyName, setCurrencyName] = useState('Coins');
  const [currencyIconUrl, setCurrencyIconUrl] = useState('');
  const [baseAmount, setBaseAmount] = useState(50);
  const [basePrice, setBasePrice] = useState(0.99);
  const [iconUploading, setIconUploading] = useState(false);
  const [badgeBgColor, setBadgeBgColor] = useState('#E8D47E');
  const [badgeTextColor, setBadgeTextColor] = useState('#A57C1B');
  const [badgePaddingX, setBadgePaddingX] = useState(12);
  const [badgePaddingY, setBadgePaddingY] = useState(3);
  const [badgeIconSize, setBadgeIconSize] = useState(14);
  const [badgeFontSize, setBadgeFontSize] = useState(13);
  const [badgeFontWeight, setBadgeFontWeight] = useState<string | number>(900);
  const [coinPackages, setCoinPackages] = useState<any[]>([]);

  // Token system form
  const [checkinReward, setCheckinReward] = useState(1);
  const [checkinCycleDays, setCheckinCycleDays] = useState(4);
  const [commentStreakEnabled, setCommentStreakEnabled] = useState(true);
  const [commentStreakReward, setCommentStreakReward] = useState(1);
  const [commentStreakDays, setCommentStreakDays] = useState(3);
  const [enableTokensUi, setEnableTokensUi] = useState(true);

  // Load settings
  useEffect(() => {
    if (settings) {
      const config = settings.premium_config;
      const general = settings.premium_general;
      
      setEnableCoins(config.enable_coins);
      setEnableSubs(config.enable_subscriptions);
      setEnableStripe(config.enable_stripe);
      setEnablePaypal(config.enable_paypal);
      setEnableUsdt(config.enable_usdt);

      setStripePublicKey(general.payment_stripe_public_key);
      setStripeSecretKey(general.payment_stripe_secret_key);
      setPaypalClientId(general.payment_paypal_client_id);
      setPaypalSecret(general.payment_paypal_secret);
      setPaypalSandbox(general.payment_paypal_sandbox ?? false);
      setCryptomusMerchantId(general.payment_cryptomus_merchant_id ?? '');
      setCryptomusPaymentKey(general.payment_cryptomus_payment_key ?? '');

      const c = settings.coin_system;
      setCurrencyName(c.currency_name);
      setCurrencyIconUrl(c.currency_icon_url);
      setBaseAmount(c.base_amount);
      setBasePrice(c.base_price);
      setBadgeBgColor(c.badge_bg_color || '#E8D47E');
      setBadgeTextColor(c.badge_text_color || '#A57C1B');
      setBadgePaddingX(c.badge_padding_x ?? 12);
      setBadgePaddingY(c.badge_padding_y ?? 3);
      setBadgeIconSize(c.badge_icon_size ?? 14);
      setBadgeFontSize(c.badge_font_size ?? 13);
      setBadgeFontWeight(c.badge_font_weight ?? 900);
      setCoinPackages(c.packages || []);

      const t = settings.token_settings;
      setCheckinReward(t.checkin_reward);
      setCheckinCycleDays(t.checkin_cycle_days);
      setCommentStreakEnabled(t.comment_streak_enabled);
      setCommentStreakReward(t.comment_streak_reward);
      setCommentStreakDays(t.comment_streak_days);
      setEnableTokensUi(t.enable_tokens_ui ?? true);
    }
  }, [settings]);

  // Recalculate dynamic package prices when baseAmount or basePrice changes
  useEffect(() => {
    if (baseAmount <= 0 || basePrice <= 0 || coinPackages.length === 0) return;
    
    let changed = false;
    const syncedPackages = coinPackages.map(pkg => {
      if (pkg.manuallyEdited) return pkg; // Skip manually edited ones
      
      const multiplier = pkg.coins / baseAmount;
      const expectedPrice = parseFloat((multiplier * basePrice).toFixed(2));
      
      if (pkg.price !== expectedPrice) {
        changed = true;
        return { ...pkg, price: expectedPrice };
      }
      return pkg;
    });

    if (changed) {
      setCoinPackages(syncedPackages);
    }
  }, [baseAmount, basePrice]);

  const saveGeneral = async () => {
    try {
      await Promise.all([
        updatePremiumSettings.mutateAsync({
          key: 'premium_config',
          value: {
            enable_coins: enableCoins,
            enable_subscriptions: enableSubs,
            enable_stripe: enableStripe,
            enable_paypal: enablePaypal,
            enable_usdt: enableUsdt,
          },
        }),
        updatePremiumSettings.mutateAsync({
          key: 'premium_general',
          value: {
            payment_stripe_public_key: stripePublicKey,
            payment_stripe_secret_key: stripeSecretKey,
            payment_paypal_client_id: paypalClientId,
            payment_paypal_secret: paypalSecret,
            payment_paypal_sandbox: paypalSandbox,
            payment_cryptomus_merchant_id: cryptomusMerchantId,
            payment_cryptomus_payment_key: cryptomusPaymentKey,
          },
        })
      ]);
      toast.success('General settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const saveCoinSystem = async () => {
    try {
      await updatePremiumSettings.mutateAsync({
        key: 'coin_system',
        value: {
          currency_name: currencyName,
          currency_icon_url: currencyIconUrl,
          base_amount: baseAmount,
          base_price: basePrice,
          badge_bg_color: badgeBgColor,
          badge_text_color: badgeTextColor,
          badge_padding_x: badgePaddingX,
          badge_padding_y: badgePaddingY,
          badge_icon_size: badgeIconSize,
          badge_font_size: badgeFontSize,
          badge_font_weight: badgeFontWeight,
          packages: coinPackages,
        },
      });
      toast.success('Coin system settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const saveTokenSystem = async () => {
    try {
      await updatePremiumSettings.mutateAsync({
        key: 'token_settings',
        value: {
          checkin_reward: checkinReward,
          checkin_cycle_days: checkinCycleDays,
          comment_streak_enabled: commentStreakEnabled,
          comment_streak_reward: commentStreakReward,
          comment_streak_days: commentStreakDays,
          enable_tokens_ui: enableTokensUi,
        },
      });
      toast.success('Token system settings saved');
    } catch {
      toast.error('Failed to save settings');
    }
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIconUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `site/currency-icon-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('manga-assets').upload(fileName, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('manga-assets').getPublicUrl(fileName);
      setCurrencyIconUrl(publicUrl);
      toast.success('Icon uploaded! Click Save to apply.');
    } catch (err: any) {
      toast.error(`Upload failed: ${err.message}`);
    }
    setIconUploading(false);
  };

  const pricePerUnit = baseAmount > 0 ? basePrice / baseAmount : 0;
  const TIERS = [50, 100, 250, 500, 1000];

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Icon icon="ph:coins-bold" className={className} />
    );

  const TutorialToggle = ({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) => (
    <button onClick={onToggle} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors">
      <Icon icon="ph:book-open-bold" className="w-3.5 h-3.5" />
      {label}
      {open ? <Icon icon="ph:caret-up-bold" className="w-3 h-3" /> : <Icon icon="ph:caret-down-bold" className="w-3 h-3" />}
    </button>
  );

  const StatusBadge = ({ configured, enabled }: { configured: boolean; enabled: boolean }) => {
    if (!enabled) return <span className="text-[10px] font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-full">Disabled</span>;
    if (configured) return <span className="text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">Active</span>;
    return <span className="text-[10px] font-semibold bg-amber-500/15 text-amber-500 px-2 py-0.5 rounded-full">Not Configured</span>;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Premium Content</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage monetisation and premium features.</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1.5 flex-wrap bg-muted/30 rounded-xl p-1.5">
        {SUB_TABS.map(st => (
          <button
            key={st.id}
            onClick={() => setSubTab(st.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
              subTab === st.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {st.icon} {st.label}
          </button>
        ))}
      </div>

      {/* ─── GENERAL TAB ─── */}
      {subTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-primary/10 via-background to-background border border-primary/20 rounded-2xl p-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10 rotate-12 scale-150">
               <Icon icon="ph:crown-bold" className="w-24 h-24 text-primary" />
             </div>
             <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
               <Icon icon="ph:sparkle-bold" className="w-5 h-5 text-primary" />
               Premium System Checklist
             </h3>
             <ul className="space-y-2 text-sm text-muted-foreground relative z-10">
               <li className="flex items-center gap-2">
                 <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-emerald-500" />
                 <span><strong>Enable Systems:</strong> Turn on Coins for per-chapter sales and Subscriptions for VIP access.</span>
               </li>
               <li className="flex items-center gap-2">
                 <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-emerald-500" />
                 <span><strong>Configure Payments:</strong> Set up Stripe (Cards), PayPal, or Cryptomus (USDT).</span>
               </li>
               <li className="flex items-center gap-2">
                 <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-emerald-500" />
                 <span><strong>Currency Branding:</strong> Customize the coin name and icon in the "Coin System" tab.</span>
               </li>
               <li className="flex items-center gap-2">
                 <Icon icon="ph:check-circle-fill" className="w-4 h-4 text-emerald-500" />
                 <span><strong>Assign Premium Manga:</strong> Mark specific series or chapters as "Premium" in the Manga list.</span>
               </li>
             </ul>
          </div>

          <div className="space-y-4">
          {/* Premium Features toggles */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:crown-bold" className="w-4 h-4" /> Premium Features</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Enable Coin System</p>
                  <p className="text-xs text-muted-foreground">Show coin locks, badges, and balance across the site</p>
                </div>
                <Switch checked={enableCoins} onCheckedChange={setEnableCoins} />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
                <div>
                  <p className="text-sm font-medium">Enable Subscription System</p>
                  <p className="text-xs text-muted-foreground">Enable subscription features like early access and VIP perks</p>
                </div>
                <Switch checked={enableSubs} onCheckedChange={setEnableSubs} />
              </div>
            </div>
          </div>



          {/* ─── STRIPE ─── */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon icon="ph:credit-card-bold" className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Stripe (Card Payments)</h3>
                  <p className="text-xs text-muted-foreground">Accept credit/debit card payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge configured={!!stripePublicKey && !!stripeSecretKey} enabled={enableStripe} />
                <Switch checked={enableStripe} onCheckedChange={setEnableStripe} />
              </div>
            </div>

            {enableStripe && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div>
                  <label className="text-sm font-medium mb-1 block">Publishable Key</label>
                  <Input value={stripePublicKey} onChange={e => setStripePublicKey(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Secret Key</label>
                  <Input type="password" value={stripeSecretKey} onChange={e => setStripeSecretKey(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="sk_live_..." />
                </div>

                <TutorialToggle open={stripeTutorialOpen} onToggle={() => setStripeTutorialOpen(!stripeTutorialOpen)} label="How to get Stripe keys" />
                {stripeTutorialOpen && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm text-muted-foreground border border-border/40">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Setup Guide</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs">
                      <li>Go to <a href="https://dashboard.stripe.com/register" target="_blank" rel="noopener" className="text-primary underline">dashboard.stripe.com</a> and create an account.</li>
                      <li>Complete business verification (Stripe will ask for business details).</li>
                      <li>Navigate to <strong>Developers → API Keys</strong> in the Stripe dashboard.</li>
                      <li>Copy the <strong>Publishable key</strong> (starts with <code className="bg-muted px-1 rounded">pk_live_</code>).</li>
                      <li>Click <strong>"Reveal live key"</strong> to copy the <strong>Secret key</strong> (starts with <code className="bg-muted px-1 rounded">sk_live_</code>).</li>
                      <li>Paste both keys above and click <strong>Save</strong>.</li>
                    </ol>
                    <div className="flex items-start gap-2 p-2 bg-amber-500/10 rounded-lg mt-2">
                      <Icon icon="ph:warning-bold" className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-600 dark:text-amber-400">For testing, use <code className="bg-muted px-1 rounded">pk_test_</code> and <code className="bg-muted px-1 rounded">sk_test_</code> keys from Stripe's test mode. Switch to live keys when ready for real payments.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ─── PAYPAL ─── */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Icon icon="ph:wallet-bold" className="w-4.5 h-4.5 text-blue-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">PayPal</h3>
                  <p className="text-xs text-muted-foreground">Accept PayPal payments</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge configured={!!paypalClientId && !!paypalSecret} enabled={enablePaypal} />
                <Switch checked={enablePaypal} onCheckedChange={setEnablePaypal} />
              </div>
            </div>

            {enablePaypal && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between p-2.5 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-xs font-medium">Sandbox Mode (Testing)</p>
                    <p className="text-[10px] text-muted-foreground">Use sandbox credentials for testing</p>
                  </div>
                  <Switch checked={paypalSandbox} onCheckedChange={setPaypalSandbox} />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Client ID</label>
                  <Input value={paypalClientId} onChange={e => setPaypalClientId(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="AX..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Secret</label>
                  <Input type="password" value={paypalSecret} onChange={e => setPaypalSecret(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="EL..." />
                </div>

                <TutorialToggle open={paypalTutorialOpen} onToggle={() => setPaypalTutorialOpen(!paypalTutorialOpen)} label="How to get PayPal credentials" />
                {paypalTutorialOpen && (
                  <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm text-muted-foreground border border-border/40">
                    <p className="font-semibold text-foreground text-xs uppercase tracking-wider">Setup Guide</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-xs">
                      <li>Go to <a href="https://developer.paypal.com" target="_blank" rel="noopener" className="text-primary underline">developer.paypal.com</a> and log in with your PayPal account.</li>
                      <li>Navigate to <strong>Apps & Credentials</strong> in the developer dashboard.</li>
                      <li>Click <strong>"Create App"</strong> and give it a name (e.g., "My Manga Site").</li>
                      <li>Select <strong>"Merchant"</strong> as the app type and click Create.</li>
                      <li>Copy the <strong>Client ID</strong> shown on the app page.</li>
                      <li>Click <strong>"Show"</strong> under Secret to reveal and copy the <strong>Secret</strong>.</li>
                      <li>For testing: toggle to <strong>Sandbox</strong> mode at the top of the page and use sandbox credentials. Enable the "Sandbox Mode" toggle above.</li>
                      <li>For live payments: toggle to <strong>Live</strong> mode and use live credentials. Disable "Sandbox Mode" above.</li>
                    </ol>
                  </div>
                )}
                <div className="flex items-start gap-2 p-2 bg-blue-500/10 rounded-lg mt-2">
                  <Icon icon="ph:info-bold" className="w-3.5 h-3.5 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-600 dark:text-blue-400">PayPal sandbox lets you test with fake money. Create sandbox buyer/seller accounts at developer.paypal.com.</p>
                </div>
              </div>
            )}
          </div>

          {/* ─── CRYPTOMUS ─── */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Icon icon="ph:currency-circle-dollar-bold" className="w-4.5 h-4.5 text-emerald-500" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">USDT (via Cryptomus)</h3>
                  <p className="text-xs text-muted-foreground">Accept USDT & Crypto via Cryptomus Gateway</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge configured={!!cryptomusMerchantId} enabled={enableUsdt} />
                <Switch checked={enableUsdt} onCheckedChange={setEnableUsdt} />
              </div>
            </div>

            {enableUsdt && (
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Merchant ID</label>
                    <Input type="text" value={cryptomusMerchantId} onChange={e => setCryptomusMerchantId(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="Your Cryptomus Merchant ID" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Payment API Key</label>
                    <Input type="password" value={cryptomusPaymentKey} onChange={e => setCryptomusPaymentKey(e.target.value)} className="rounded-xl bg-background font-mono text-xs" placeholder="••••••••••••" />
                  </div>
                </div>

                <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl flex gap-3">
                  <Icon icon="ph:info-bold" className="w-4 h-4 text-blue-500 mt-0.5" />
                  <p className="text-[11px] text-blue-600 dark:text-blue-400">
                    <strong>Crypto Setup:</strong> Cryptomus allows you to accept USDT over multiple networks.
                  </p>
                </div>

                <TutorialToggle open={usdtTutorialOpen} onToggle={() => setUsdtTutorialOpen(!usdtTutorialOpen)} label="Detailed Cryptomus Setup Guide" />
                {usdtTutorialOpen && (
                  <div className="bg-muted/30 rounded-xl p-5 space-y-4 text-sm text-muted-foreground border border-border/40 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-2">
                       <p className="font-bold text-foreground flex items-center gap-2">
                         <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">1</span>
                         Merchant Account Setup
                       </p>
                       <ul className="list-disc list-inside pl-7 space-y-1 text-xs">
                         <li>Register at <a href="https://cryptomus.com" target="_blank" rel="noopener" className="text-primary underline">cryptomus.com</a>.</li>
                         <li>Create a <strong>"Merchant"</strong> account (not individual).</li>
                         <li>Create a new <strong>Project</strong> for your website. You will need to provide your website URL.</li>
                         <li>Wait for <strong>Moderation</strong> (usually 1-12 hours). API keys won't work for real payments until approved.</li>
                       </ul>
                    </div>

                    <div className="space-y-2">
                       <p className="font-bold text-foreground flex items-center gap-2">
                         <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">2</span>
                         Get API Credentials
                       </p>
                       <ul className="list-disc list-inside pl-7 space-y-1 text-xs">
                         <li>Inside your project dashboard, go to <strong>Settings → API & Integration</strong>.</li>
                         <li>Copy the <strong>Merchant ID</strong> and paste it above.</li>
                         <li>Create a <strong>Payment API Key</strong> (it might be called "IPN Secret" or "Key"). Copy and paste it into the "Payment API Key" field.</li>
                       </ul>
                    </div>

                    <div className="space-y-2">
                       <p className="font-bold text-foreground flex items-center gap-2">
                         <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">3</span>
                         Configure Webhook (CRITICAL)
                       </p>
                       <p className="text-[11px] pl-7 leading-relaxed">
                         To automate coins delivery, you <strong>MUST</strong> set the Success Webhook URL in the Cryptomus dashboard:
                       </p>
                       <div className="ml-7 p-2.5 bg-background border border-border rounded-lg font-mono text-[10px] break-all select-all">
                         [YOUR_SUPABASE_URL]/functions/v1/cryptomus-webhook
                       </div>
                       <p className="text-[10px] pl-7 text-amber-500 font-medium italic">
                         * Replace [YOUR_SUPABASE_URL] with your projects API URL (found in Settings → API).
                       </p>
                    </div>

                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl flex gap-3">
                      <Icon icon="ph:check-circle-bold" className="w-4 h-4 text-emerald-500 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Supported Currencies</p>
                        <p className="text-[10px] text-emerald-600/80">Users can pay with USDT (TRC-20, ERC-20, BEP-20), BTC, ETH, and many other cryptocurrencies. Cryptomus converts them for you.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          </div>
          
          <Button className="rounded-xl gap-2" onClick={saveGeneral} disabled={updatePremiumSettings.isPending}>
            <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" /> Save General Settings
          </Button>
        </div>
      )}

      {/* ─── COIN SYSTEM TAB ─── */}
      {subTab === 'coins' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Icon icon="ph:coins-bold" className="w-4 h-4" /> Coin System Branding</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Customize your site's currency name and icon.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Currency Name</label>
                  <Input value={currencyName} onChange={e => setCurrencyName(e.target.value)} className="rounded-xl bg-background" placeholder="Coins" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Currency Icon</label>
                  <div className="flex items-center gap-3">
                    {currencyIconUrl ? (
                      <img src={currencyIconUrl} alt="Currency icon" className="w-12 h-12 rounded-xl object-contain bg-muted border border-border/40" />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center">
                        <Icon icon="ph:coins-bold" className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                      <Icon icon="ph:upload-simple-bold" className="w-4 h-4" /> {iconUploading ? 'Uploading...' : 'Upload New Icon'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={iconUploading} />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Square image (64×64px) recommended.</p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center rounded-xl bg-muted/30 border border-border/40 p-6">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 flex items-center justify-center mb-3">
                  <CurrencyIcon className="w-10 h-10 text-amber-500" />
                </div>
                <p className="text-sm font-bold mb-2">Preview</p>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background border border-border/40">
                  <CurrencyIcon className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold">1,000 {currencyName}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Icon icon="ph:currency-circle-dollar-bold" className="w-4 h-4" /> Base Currency Rate</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Set the fundamental value of your currency.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-end gap-3">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Amount</label>
                  <Input type="number" value={baseAmount} onChange={e => setBaseAmount(Math.max(1, parseInt(e.target.value) || 1))} className="rounded-xl bg-background w-32" />
                </div>
                <span className="text-lg text-muted-foreground pb-2">=</span>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Price (USD)</label>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-muted-foreground">$</span>
                    <Input type="number" step="0.01" value={basePrice} onChange={e => setBasePrice(Math.max(0.01, parseFloat(e.target.value) || 0.01))} className="rounded-xl bg-background w-28" />
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">Calculated Pricing Preview</p>
                <div className="bg-muted/30 rounded-xl overflow-hidden border border-border/40">
                  <div className="grid grid-cols-2 gap-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border/40">
                    <span>Package</span>
                    <span className="text-right">Price</span>
                  </div>
                  {coinPackages.length === 0 ? (
                    <div className="text-xs text-center text-muted-foreground py-4">No packages</div>
                  ) : (
                    coinPackages.map(pkg => (
                      <div key={pkg.id} className="grid grid-cols-2 gap-0 text-sm px-4 py-2.5 border-b border-border/20 last:border-0 relative group">
                        <span className="flex items-center gap-1.5 truncate">
                          <CurrencyIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">{pkg.label || 'Unnamed'}</span>
                          <span className="text-xs text-muted-foreground ml-1 shrink-0">({pkg.coins.toLocaleString()})</span>
                        </span>
                        <span className="text-right font-medium text-emerald-400">
                          ${pkg.price.toFixed(2)}
                          {pkg.manuallyEdited && <span className="absolute right-1 top-1 text-[8px] uppercase font-bold text-amber-500/50" title="Manually Edited">M</span>}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Badge Designer */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Icon icon="ph:paint-brush-bold" className="w-4 h-4" /> Pricing Badge Design</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Customize the appearance of the premium chapter pricing badge.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Background Color</label>
                    <div className="flex gap-2">
                       <input type="color" value={badgeBgColor} onChange={e => setBadgeBgColor(e.target.value)} className="w-9 h-9 p-0 border-0 rounded cursor-pointer bg-transparent" />
                       <Input value={badgeBgColor} onChange={e => setBadgeBgColor(e.target.value)} className="rounded-xl flex-1 uppercase font-mono text-xs bg-background" />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold mb-1.5 block">Text Color</label>
                    <div className="flex gap-2">
                       <input type="color" value={badgeTextColor} onChange={e => setBadgeTextColor(e.target.value)} className="w-9 h-9 p-0 border-0 rounded cursor-pointer bg-transparent" />
                       <Input value={badgeTextColor} onChange={e => setBadgeTextColor(e.target.value)} className="rounded-xl flex-1 uppercase font-mono text-xs bg-background" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold mb-2 flex justify-between">
                      <span>Horiz. Padding</span>
                      <span className="text-muted-foreground font-mono">{badgePaddingX}px</span>
                    </label>
                    <input type="range" min="4" max="24" value={badgePaddingX} onChange={e => setBadgePaddingX(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 flex justify-between">
                      <span>Vert. Padding</span>
                      <span className="text-muted-foreground font-mono">{badgePaddingY}px</span>
                    </label>
                    <input type="range" min="0" max="16" value={badgePaddingY} onChange={e => setBadgePaddingY(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                </div>
                
                <div className="pt-2">
                  <label className="text-xs font-semibold mb-2 flex justify-between">
                   <span>Icon Size</span>
                   <span className="text-muted-foreground font-mono">{badgeIconSize}px</span>
                  </label>
                  <input type="range" min="8" max="24" value={badgeIconSize} onChange={e => setBadgeIconSize(Number(e.target.value))} className="w-full accent-primary" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-xs font-semibold mb-2 flex justify-between">
                      <span>Font Size</span>
                      <span className="text-muted-foreground font-mono">{badgeFontSize}px</span>
                    </label>
                    <input type="range" min="10" max="24" value={badgeFontSize} onChange={e => setBadgeFontSize(Number(e.target.value))} className="w-full accent-primary" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-2 flex justify-between">
                      <span>Font Weight</span>
                      <span className="text-muted-foreground font-mono">{badgeFontWeight}</span>
                    </label>
                    <select 
                      value={badgeFontWeight} 
                      onChange={e => setBadgeFontWeight(e.target.value)}
                      className="w-full h-8 px-2 text-xs rounded-lg bg-background border border-border mt-1"
                    >
                      <option value="400">Normal (400)</option>
                      <option value="600">Semi Bold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">Extra Bold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center rounded-xl bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-secondary/50 border border-border/40 p-6 relative overflow-hidden">
                 <p className="text-sm font-bold mb-4 z-10 drop-shadow-sm">Live Preview</p>
                 <div
                   className="flex items-center gap-1.5 shadow-sm rounded-[10px] transition-all z-10"
                   style={{
                     backgroundColor: badgeBgColor,
                     padding: `${badgePaddingY}px ${badgePaddingX}px`
                   }}
                 >
                   {currencyIconUrl ? (
                     <img src={currencyIconUrl} alt="icon" style={{ width: badgeIconSize, height: badgeIconSize }} className="object-contain" />
                   ) : (
                     <Icon icon="ph:coins-fill" style={{ width: badgeIconSize, height: badgeIconSize, color: badgeTextColor }} />
                   )}
                   <span style={{ color: badgeTextColor, fontSize: `${badgeFontSize}px`, fontWeight: badgeFontWeight, letterSpacing: '-0.025em' }}>
                     100
                   </span>
                 </div>
                 <p className="text-[10px] text-muted-foreground mt-6 text-center max-w-[200px] z-10">This badge appears on locked premium chapters in the Manga Info page.</p>
              </div>
            </div>
          </div>

          {/* Dynamic Packages */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold flex items-center gap-2 text-base"><Icon icon="ph:package-bold" className="w-4 h-4" /> Coin Packages</h3>
                <p className="text-sm text-muted-foreground mt-0.5">Manage the tier options users see in the Coin Shop.</p>
              </div>
              <Button onClick={() => setCoinPackages([...coinPackages, { id: Date.now().toString(), label: 'New Package', coins: 100, price: 0.99, bonus: 0, popular: false }])} size="sm" className="gap-1.5 h-8 rounded-lg">
                 <Icon icon="ph:plus-bold" /> Add Package
              </Button>
            </div>
            
            {coinPackages.length === 0 ? (
               <div className="p-8 text-center text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">No custom packages defined. The shop will use the fallback base calculated tiers.</div>
            ) : (
               <div className="space-y-3">
                 {coinPackages.map((pkg, idx) => (
                   <div key={pkg.id} className="flex flex-wrap items-center gap-3 p-4 bg-muted/20 border border-border/50 rounded-xl transition-all">
                      <div className="flex-1 min-w-[200px] grid grid-cols-2 md:grid-cols-5 gap-3">
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Label</label>
                          <Input value={pkg.label} onChange={(e) => { const n = [...coinPackages]; n[idx].label = e.target.value; setCoinPackages(n); }} className="h-8 text-xs bg-background rounded-lg mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Coins</label>
                          <Input type="number" min="1" value={pkg.coins} onChange={(e) => { const n = [...coinPackages]; n[idx].coins = Number(e.target.value); setCoinPackages(n); }} className="h-8 text-xs bg-background rounded-lg mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Bonus</label>
                          <Input type="number" min="0" value={pkg.bonus} onChange={(e) => { const n = [...coinPackages]; n[idx].bonus = Number(e.target.value); setCoinPackages(n); }} className="h-8 text-xs bg-background rounded-lg mt-1" />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-muted-foreground">Price ($)</label>
                          <Input type="number" step="0.01" min="0.01" value={pkg.price} onChange={(e) => { const n = [...coinPackages]; n[idx].price = Number(e.target.value); n[idx].manuallyEdited = true; setCoinPackages(n); }} className="h-8 text-xs bg-background rounded-lg mt-1" />
                        </div>
                        <div className="flex items-center gap-2 md:pt-6">
                           <Switch checked={pkg.popular} onCheckedChange={(val) => { const n = [...coinPackages]; n[idx].popular = val; setCoinPackages(n); }} />
                           <span className="text-xs font-semibold">Popular Tag</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => setCoinPackages(coinPackages.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 shrink-0 h-8 w-8">
                         <Icon icon="ph:trash-bold" className="w-4 h-4" />
                      </Button>
                   </div>
                 ))}
               </div>
            )}
          </div>

          <Button className="rounded-xl gap-2" onClick={saveCoinSystem} disabled={updatePremiumSettings.isPending}>
            <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" /> Save Coin Settings
          </Button>
        </div>
      )}

      {/* ─── TOKEN SYSTEM TAB ─── */}
      {subTab === 'tokens' && (
        <div className="space-y-4">
          {/* Master UI toggle */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Icon icon="ph:ticket-bold" className="w-4 h-4" /> Token Features</h3>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div className="pr-3">
                <p className="text-sm font-medium">Enable Token UI</p>
                <p className="text-xs text-muted-foreground">Show the ticket button in the profile menu, the ticket counter in the comment section, and the Earn Tokens page.</p>
              </div>
              <Switch checked={enableTokensUi} onCheckedChange={setEnableTokensUi} />
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Icon icon="ph:gift-bold" className="w-4 h-4" /> Daily Check-in Reward</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Configure rewards for daily user engagement.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Reward Amount (Tokens)</label>
                <Input type="number" value={checkinReward} onChange={e => setCheckinReward(Math.max(1, parseInt(e.target.value) || 1))} className="rounded-xl bg-background" />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1.5 block">Check-in Cycle Length (Days)</label>
                <Input type="number" value={checkinCycleDays} onChange={e => setCheckinCycleDays(Math.max(2, parseInt(e.target.value) || 4))} className="rounded-xl bg-background" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <Icon icon="ph:check-bold" className="w-4 h-4 text-emerald-500" /> Comment Streak Mission
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">Reward users for commenting multiple days in a row.</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-xl">
              <div>
                <p className="text-sm font-semibold">Enable Comment Streak Mission</p>
                <p className="text-xs text-muted-foreground">Toggle this mission on or off site-wide.</p>
              </div>
              <Switch checked={commentStreakEnabled} onCheckedChange={setCommentStreakEnabled} />
            </div>
            {commentStreakEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Tokens awarded for streak</label>
                  <Input type="number" value={commentStreakReward} onChange={e => setCommentStreakReward(Math.max(1, parseInt(e.target.value) || 1))} className="rounded-xl bg-background" />
                </div>
                <div>
                  <label className="text-sm font-semibold mb-1.5 block">Required streak days</label>
                  <Input type="number" value={commentStreakDays} onChange={e => setCommentStreakDays(Math.max(1, parseInt(e.target.value) || 3))} className="rounded-xl bg-background" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Icon icon="ph:info-bold" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Token Value Information</h4>
                <p className="text-sm text-muted-foreground">1 Token = access to 1 premium chapter for 3 days (temporary unlock).</p>
                <p className="text-sm text-muted-foreground mt-0.5">Tokens are intended as a free alternative to coins, encouraging daily site usage.</p>
              </div>
            </div>
          </div>

          <Button className="rounded-xl gap-2" onClick={saveTokenSystem} disabled={updatePremiumSettings.isPending}>
            <Icon icon="ph:floppy-disk-bold" className="w-4 h-4" /> Save Token Settings
          </Button>
        </div>
      )}

      {/* ─── SUBSCRIPTION SYSTEM TAB ─── */}
      {subTab === 'subscriptions' && (
        <SubscriptionSystemTab settings={settings} updatePremiumSettings={updatePremiumSettings} />
      )}
    </div>
  );
}
