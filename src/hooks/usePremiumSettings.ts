import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PremiumGeneralSettings {
  // Sensitive keys (Private)
  payment_stripe_public_key: string;
  payment_stripe_secret_key: string;
  payment_paypal_client_id: string;
  payment_paypal_secret: string;
  payment_razorpay_key_id: string;
  payment_razorpay_key_secret: string;
  payment_usdt_address: string;
  payment_usdt_network: 'TRC20' | 'ERC20';
  payment_cryptomus_merchant_id?: string;
  payment_cryptomus_payment_key?: string;
  payment_paypal_sandbox?: boolean;
}

export interface PremiumConfig {
  // Public toggles
  enable_coins: boolean;
  enable_subscriptions: boolean;
  enable_stripe: boolean;
  enable_paypal: boolean;
  enable_razorpay: boolean;
  enable_usdt: boolean;
}

export interface CoinPackage {
  id: string;
  coins: number;
  bonus: number;
  price: number;
  label: string;
  popular: boolean;
  manuallyEdited?: boolean;
}

export interface CoinSystemSettings {
  currency_name: string;
  currency_icon_url: string;
  base_amount: number; // Kept as fallback
  base_price: number; // Kept as fallback
  // Custom Pricing Badge configuration
  badge_bg_color: string;
  badge_text_color: string;
  badge_padding_x: number;
  badge_padding_y: number;
  badge_icon_size: number;
  badge_font_size: number;
  badge_font_weight: string | number;
  // Dynamic Packages
  packages?: CoinPackage[];
}

export interface TokenSystemSettings {
  checkin_reward: number;
  checkin_cycle_days: number;
  comment_streak_enabled: boolean;
  comment_streak_reward: number;
  comment_streak_days: number;
}

export interface SubscriptionSettings {
  subscription_name: string;
  badge_label: string;
  bonus_coins_enabled: boolean;
  double_daily_login_enabled: boolean;
  show_subscriber_count: boolean;
  default_free_release_days: number;
  sub_enable_paypal: boolean;
  sub_paypal_client_id: string;
  sub_paypal_secret: string;
  sub_paypal_sandbox: boolean;
  sub_enable_usdt: boolean;
  sub_usdt_address: string;
  sub_cryptomus_merchant_id: string;
  sub_cryptomus_payment_key: string;
}

export interface AllPremiumSettings {
  premium_general: PremiumGeneralSettings;
  premium_config: PremiumConfig;
  coin_system: CoinSystemSettings;
  token_settings: TokenSystemSettings;
  subscription_settings: SubscriptionSettings;
}

const DEFAULTS: AllPremiumSettings = {
  premium_general: {
    payment_stripe_public_key: '',
    payment_stripe_secret_key: '',
    payment_paypal_client_id: '',
    payment_paypal_secret: '',
    payment_razorpay_key_id: '',
    payment_razorpay_key_secret: '',
    payment_usdt_address: '',
    payment_usdt_network: 'TRC20',
  },
  premium_config: {
    enable_coins: true,
    enable_subscriptions: false,
    enable_stripe: false,
    enable_paypal: false,
    enable_razorpay: false,
    enable_usdt: false,
  },
  coin_system: {
    currency_name: 'Coins',
    currency_icon_url: '',
    base_amount: 50,
    base_price: 0.99,
    badge_bg_color: '#E8D47E',
    badge_text_color: '#A57C1B',
    badge_padding_x: 12,
    badge_padding_y: 3,
    badge_icon_size: 14,
    badge_font_size: 13,
    badge_font_weight: 900,
    packages: [
      { id: '1', coins: 50, price: 0.99, label: 'Starter', popular: false, bonus: 0 },
      { id: '2', coins: 150, price: 2.97, label: 'Popular', popular: true, bonus: 0 },
      { id: '3', coins: 350, price: 6.93, label: 'Value', popular: false, bonus: 50 },
      { id: '4', coins: 750, price: 14.85, label: 'Premium', popular: false, bonus: 150 },
      { id: '5', coins: 1600, price: 31.68, label: 'Mega', popular: false, bonus: 400 },
      { id: '6', coins: 5000, price: 99.00, label: 'Ultimate', popular: false, bonus: 1500 },
    ],
  },
  token_settings: {
    checkin_reward: 1,
    checkin_cycle_days: 4,
    comment_streak_enabled: true,
    comment_streak_reward: 1,
    comment_streak_days: 3,
  },
  subscription_settings: {
    subscription_name: 'Subscription',
    badge_label: 'Early Access',
    bonus_coins_enabled: true,
    double_daily_login_enabled: true,
    show_subscriber_count: true,
    default_free_release_days: 7,
    sub_enable_paypal: false,
    sub_paypal_client_id: '',
    sub_paypal_secret: '',
    sub_paypal_sandbox: false,
    sub_enable_usdt: false,
    sub_usdt_address: '',
    sub_cryptomus_merchant_id: '',
    sub_cryptomus_payment_key: '',
  },
};

export function usePremiumSettings() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['premium-settings'],
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from('site_settings')
        .select('key, value')
        .in('key', ['premium_general', 'premium_config', 'coin_system', 'token_settings', 'subscription_settings']);

      if (error) throw error;

      const result = { ...DEFAULTS };
      for (const row of rows || []) {
        const key = row.key as keyof AllPremiumSettings;
        if (key in result) {
          result[key] = { ...result[key], ...(row.value as any) };
        }
      }
      return result;
    },
    staleTime: 1000 * 30,
  });

  const updatePremiumSettings = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('site_settings')
        .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['premium-settings'] });
      queryClient.invalidateQueries({ queryKey: ['site-settings'] });
    },
  });

  return {
    settings: data || DEFAULTS,
    isLoading,
    updatePremiumSettings,
    DEFAULTS,
  };
}
