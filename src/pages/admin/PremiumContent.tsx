import { useState, useEffect } from 'react';
import {
  Crown, Settings, Coins, Ticket, CreditCard, Wallet, CircleDollarSign,
  Check, Upload, Save, Info, MessageSquare, Gift, Image
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { usePremiumSettings } from '@/hooks/usePremiumSettings';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type SubTab = 'general' | 'coins' | 'tokens' | 'subscriptions';

const SUB_TABS: { id: SubTab; label: string; icon: React.ReactNode }[] = [
  { id: 'general', label: 'General', icon: <Settings className="w-3.5 h-3.5" /> },
  { id: 'coins', label: 'Coin System', icon: <Coins className="w-3.5 h-3.5" /> },
  { id: 'tokens', label: 'Token System', icon: <Ticket className="w-3.5 h-3.5" /> },
  { id: 'subscriptions', label: 'Subscription System', icon: <Crown className="w-3.5 h-3.5" /> },
];

const PAYMENT_METHODS = [
  { id: 'stripe', label: 'Card / Credit Card', icon: CreditCard },
  { id: 'paypal', label: 'PayPal', icon: Wallet },
  { id: 'usdt', label: 'USDT', icon: CircleDollarSign },
] as const;

export default function PremiumContent() {
  const { settings, updatePremiumSettings } = usePremiumSettings();
  const [subTab, setSubTab] = useState<SubTab>('general');

  // General form
  const [enableCoins, setEnableCoins] = useState(true);
  const [enableSubs, setEnableSubs] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>('stripe');
  const [stripePublicKey, setStripePublicKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecret, setPaypalSecret] = useState('');
  const [usdtAddress, setUsdtAddress] = useState('');
  const [usdtNetwork, setUsdtNetwork] = useState<'TRC20' | 'ERC20'>('TRC20');

  // Coin system form
  const [currencyName, setCurrencyName] = useState('Coins');
  const [currencyIconUrl, setCurrencyIconUrl] = useState('');
  const [baseAmount, setBaseAmount] = useState(50);
  const [basePrice, setBasePrice] = useState(0.99);
  const [iconUploading, setIconUploading] = useState(false);

  // Token system form
  const [checkinReward, setCheckinReward] = useState(1);
  const [checkinCycleDays, setCheckinCycleDays] = useState(4);
  const [commentStreakEnabled, setCommentStreakEnabled] = useState(true);
  const [commentStreakReward, setCommentStreakReward] = useState(1);
  const [commentStreakDays, setCommentStreakDays] = useState(3);

  // Load settings
  useEffect(() => {
    if (settings) {
      const g = settings.premium_general;
      setEnableCoins(g.enable_coins);
      setEnableSubs(g.enable_subscriptions);
      setStripePublicKey(g.payment_stripe_public_key);
      setStripeSecretKey(g.payment_stripe_secret_key);
      setPaypalClientId(g.payment_paypal_client_id);
      setPaypalSecret(g.payment_paypal_secret);
      setUsdtAddress(g.payment_usdt_address);
      setUsdtNetwork(g.payment_usdt_network);

      const c = settings.coin_system;
      setCurrencyName(c.currency_name);
      setCurrencyIconUrl(c.currency_icon_url);
      setBaseAmount(c.base_amount);
      setBasePrice(c.base_price);

      const t = settings.token_settings;
      setCheckinReward(t.checkin_reward);
      setCheckinCycleDays(t.checkin_cycle_days);
      setCommentStreakEnabled(t.comment_streak_enabled);
      setCommentStreakReward(t.comment_streak_reward);
      setCommentStreakDays(t.comment_streak_days);
    }
  }, [settings]);

  const saveGeneral = async () => {
    try {
      await updatePremiumSettings.mutateAsync({
        key: 'premium_general',
        value: {
          enable_coins: enableCoins,
          enable_subscriptions: enableSubs,
          payment_stripe_public_key: stripePublicKey,
          payment_stripe_secret_key: stripeSecretKey,
          payment_paypal_client_id: paypalClientId,
          payment_paypal_secret: paypalSecret,
          payment_usdt_address: usdtAddress,
          payment_usdt_network: usdtNetwork,
        },
      });
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

  // Pricing tiers
  const pricePerUnit = baseAmount > 0 ? basePrice / baseAmount : 0;
  const TIERS = [50, 100, 250, 500, 1000];

  const isStripeConnected = !!stripePublicKey && !!stripeSecretKey;
  const isPaypalConnected = !!paypalClientId && !!paypalSecret;
  const isUsdtConfigured = !!usdtAddress;

  const CurrencyIcon = ({ className }: { className?: string }) =>
    currencyIconUrl ? (
      <img src={currencyIconUrl} alt={currencyName} className={`${className} object-contain`} />
    ) : (
      <Coins className={className} />
    );

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
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Crown className="w-4 h-4" /> Premium Features</h3>
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
                  <p className="text-xs text-muted-foreground">Coming soon — not yet functional</p>
                </div>
                <Switch checked={enableSubs} onCheckedChange={setEnableSubs} />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payment Methods</h3>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              {PAYMENT_METHODS.map((method) => {
                const isActive = selectedPayment === method.id;
                const connected = method.id === 'stripe' ? isStripeConnected : method.id === 'paypal' ? isPaypalConnected : isUsdtConfigured;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
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
                    {connected && (
                      <span className="ml-auto text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 px-2 py-0.5 rounded-full">
                        {method.id === 'usdt' ? 'Configured' : 'Connected'}
                      </span>
                    )}
                    {isActive && !connected && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedPayment === 'stripe' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <div>
                  <label className="text-sm font-medium mb-1 block">Public Key</label>
                  <Input value={stripePublicKey} onChange={e => setStripePublicKey(e.target.value)} className="rounded-xl bg-background" placeholder="pk_live_..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Secret Key</label>
                  <Input type="password" value={stripeSecretKey} onChange={e => setStripeSecretKey(e.target.value)} className="rounded-xl bg-background" placeholder="sk_live_..." />
                </div>
              </div>
            )}

            {selectedPayment === 'paypal' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Create your PayPal app at developer.paypal.com → My Apps & Credentials</p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Client ID</label>
                  <Input value={paypalClientId} onChange={e => setPaypalClientId(e.target.value)} className="rounded-xl bg-background" placeholder="AX..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Secret</label>
                  <Input type="password" value={paypalSecret} onChange={e => setPaypalSecret(e.target.value)} className="rounded-xl bg-background" placeholder="EL..." />
                </div>
              </div>
            )}

            {selectedPayment === 'usdt' && (
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-xs text-muted-foreground">Users will send USDT to this address and submit their transaction hash for manual verification.</p>
                <div>
                  <label className="text-sm font-medium mb-1 block">Network</label>
                  <Select value={usdtNetwork} onValueChange={(v) => setUsdtNetwork(v as 'TRC20' | 'ERC20')}>
                    <SelectTrigger className="rounded-xl bg-background w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRC20">TRC20 (Tron)</SelectItem>
                      <SelectItem value="ERC20">ERC20 (Ethereum)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Wallet Address</label>
                  <Input value={usdtAddress} onChange={e => setUsdtAddress(e.target.value)} className="rounded-xl bg-background" placeholder="T... or 0x..." />
                </div>
              </div>
            )}
          </div>

          <Button className="rounded-xl gap-2" onClick={saveGeneral} disabled={updatePremiumSettings.isPending}>
            <Save className="w-4 h-4" /> Save General Settings
          </Button>
        </div>
      )}

      {/* ─── COIN SYSTEM TAB ─── */}
      {subTab === 'coins' && (
        <div className="space-y-4">
          {/* Branding Section */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Coins className="w-4 h-4" /> Coin System Branding</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Customize your site's currency name and icon.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Form */}
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
                        <Coins className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background cursor-pointer hover:bg-muted/50 transition-colors text-sm font-medium">
                      <Upload className="w-4 h-4" /> {iconUploading ? 'Uploading...' : 'Upload New Icon'}
                      <input type="file" accept="image/*" className="hidden" onChange={handleIconUpload} disabled={iconUploading} />
                    </label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">Square image (64×64px) recommended.</p>
                </div>
              </div>

              {/* Right: Preview */}
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

          {/* Base Currency Rate */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><CircleDollarSign className="w-4 h-4" /> Base Currency Rate</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Set the fundamental value of your currency.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left: Input */}
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

              {/* Right: Pricing Preview Table */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 text-center">Calculated Pricing Preview</p>
                <div className="bg-muted/30 rounded-xl overflow-hidden border border-border/40">
                  <div className="grid grid-cols-2 gap-0 text-[10px] font-bold text-muted-foreground uppercase tracking-wider px-4 py-2 border-b border-border/40">
                    <span>Tier</span>
                    <span className="text-right">Price</span>
                  </div>
                  {TIERS.map(tier => (
                    <div key={tier} className="grid grid-cols-2 gap-0 text-sm px-4 py-2.5 border-b border-border/20 last:border-0">
                      <span className="flex items-center gap-1.5">
                        <CurrencyIcon className="w-3.5 h-3.5 text-amber-500" />
                        {tier.toLocaleString()} {currencyName}
                      </span>
                      <span className="text-right font-medium text-emerald-400">${(tier * pricePerUnit).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <Button className="rounded-xl gap-2" onClick={saveCoinSystem} disabled={updatePremiumSettings.isPending}>
            <Save className="w-4 h-4" /> Save Coin Settings
          </Button>
        </div>
      )}

      {/* ─── TOKEN SYSTEM TAB ─── */}
      {subTab === 'tokens' && (
        <div className="space-y-4">
          {/* Daily Check-in */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base"><Gift className="w-4 h-4" /> Daily Check-in Reward</h3>
              <p className="text-sm text-muted-foreground mt-0.5">Configure rewards for daily user engagement.</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

          {/* Comment Streak Mission */}
          <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
            <div>
              <h3 className="font-semibold flex items-center gap-2 text-base">
                <Check className="w-4 h-4 text-emerald-500" /> Comment Streak Mission
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
              <div className="grid grid-cols-2 gap-4">
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

          {/* Token Value Information */}
          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1">Token Value Information</h4>
                <p className="text-sm text-muted-foreground">1 Token = access to 1 premium chapter for 3 days (temporary unlock).</p>
                <p className="text-sm text-muted-foreground mt-0.5">Tokens are intended as a free alternative to coins, encouraging daily site usage.</p>
              </div>
            </div>
          </div>

          <Button className="rounded-xl gap-2" onClick={saveTokenSystem} disabled={updatePremiumSettings.isPending}>
            <Save className="w-4 h-4" /> Save Token Settings
          </Button>
        </div>
      )}

      {/* ─── SUBSCRIPTION SYSTEM TAB ─── */}
      {subTab === 'subscriptions' && (
        <div className="bg-card border border-border rounded-2xl p-8 flex flex-col items-center justify-center text-center">
          <Crown className="w-12 h-12 text-primary/30 mb-4" />
          <h3 className="text-lg font-bold text-foreground mb-2">Subscription System</h3>
          <p className="text-muted-foreground text-sm">Coming soon.</p>
        </div>
      )}
    </div>
  );
}
