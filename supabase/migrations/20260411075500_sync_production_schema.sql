-- Cumulative synchronization migration to bridge local schema with production state
-- Date: 2026-04-11

-- 1. Create missing tables
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT ''::text,
  duration_days integer NOT NULL DEFAULT 30,
  price_usd numeric NOT NULL DEFAULT 4.99,
  is_active boolean DEFAULT true,
  bonus_coins integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_id uuid NOT NULL,
  started_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  payment_method text DEFAULT 'paypal'::text,
  payment_id text,
  status text NOT NULL DEFAULT 'pending'::text,
  bonus_coins_awarded boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT user_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT user_subscriptions_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.subscription_plans (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.blocked_ips (
  ip_address text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT blocked_ips_pkey PRIMARY KEY (ip_address)
);

-- 2. Add missing columns to existing tables
DO $$ 
BEGIN 
  -- Chapters
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='is_subscription') THEN
    ALTER TABLE public.chapters ADD COLUMN is_subscription boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='subscription_free_release_days') THEN
    ALTER TABLE public.chapters ADD COLUMN subscription_free_release_days numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='chapters' AND column_name='subscription_free_release_at') THEN
    ALTER TABLE public.chapters ADD COLUMN subscription_free_release_at timestamp with time zone;
  END IF;

  -- Manga Discord Settings
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='free_channel_name') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN free_channel_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='free_role_id') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN free_role_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='premium_channel_name') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN premium_channel_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='premium_role_id') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN premium_role_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='subscription_channel_name') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN subscription_channel_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='manga_discord_settings' AND column_name='subscription_role_id') THEN
    ALTER TABLE public.manga_discord_settings ADD COLUMN subscription_role_id text;
  END IF;

  -- Profiles
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='double_login_rewards') THEN
    ALTER TABLE public.profiles ADD COLUMN double_login_rewards boolean DEFAULT false;
  END IF;
END $$;

-- 3. Create missing functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.increment_coins(user_id uuid, amount integer) 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET coin_balance = COALESCE(coin_balance, 0) + amount
  WHERE id = user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_grant_subscription(p_target_user_id uuid, p_plan_id uuid, p_duration_days integer) 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_id, started_at, expires_at, status, payment_method)
  VALUES (
    p_target_user_id,
    p_plan_id,
    now(),
    now() + (p_duration_days || ' days')::interval,
    'active',
    'manual'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_set_user_balance(p_target_user_id uuid, p_coin_balance integer, p_token_balance integer) 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  UPDATE public.profiles
  SET coin_balance = p_coin_balance,
      token_balance = p_token_balance
  WHERE id = p_target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_auto_free_chapters() 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.chapters
  SET premium = false,
      created_at = now(),
      auto_free_days = NULL,
      free_release_at = NULL
  WHERE premium = true
    AND free_release_at IS NOT NULL
    AND free_release_at <= now();
END;
$$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(p_user_id uuid) 
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_subscriptions
    WHERE user_id = p_user_id
      AND status = 'active'
      AND expires_at > now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip text) 
RETURNS boolean LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM public.blocked_ips WHERE ip_address = p_ip);
$$;

CREATE OR REPLACE FUNCTION public.secure_increment_tokens(p_user_id uuid, p_amount integer) 
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.profiles
  SET token_balance = COALESCE(token_balance, 0) + p_amount
  WHERE id = p_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_subscription_free_release_at() 
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.is_subscription = true AND NEW.subscription_free_release_days IS NOT NULL THEN
    NEW.subscription_free_release_at := NEW.created_at + (NEW.subscription_free_release_days || ' days')::interval;
  ELSIF NEW.is_subscription = false THEN
    NEW.subscription_free_release_at := NULL;
    NEW.subscription_free_release_days := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Create missing triggers
DROP TRIGGER IF EXISTS trg_set_subscription_free_release ON public.chapters;
CREATE TRIGGER trg_set_subscription_free_release
  BEFORE INSERT OR UPDATE OF is_subscription, subscription_free_release_days ON public.chapters
  FOR EACH ROW EXECUTE FUNCTION set_subscription_free_release_at();

-- 5. Enable RLS and setup policies
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Policies
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON public.subscription_plans;
CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can read active subscription plans" ON public.subscription_plans;
CREATE POLICY "Anyone can read active subscription plans" ON public.subscription_plans
  FOR SELECT TO public
  USING (true);

-- User Subscriptions Policies
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.user_subscriptions
  FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)));

DROP POLICY IF EXISTS "Admins can read all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can read all subscriptions" ON public.user_subscriptions
  FOR SELECT TO public
  USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role)));

DROP POLICY IF EXISTS "Users can create own pending subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can create own pending subscriptions" ON public.user_subscriptions
  FOR INSERT TO public
  WITH CHECK (auth.uid() = user_id AND status = 'pending'::text);

DROP POLICY IF EXISTS "Users can read own subscriptions" ON public.user_subscriptions;
CREATE POLICY "Users can read own subscriptions" ON public.user_subscriptions
  FOR SELECT TO public
  USING (auth.uid() = user_id);

-- Blocked IPs Policies
DROP POLICY IF EXISTS "Admins can manage blocked_ips" ON public.blocked_ips;
CREATE POLICY "Admins can manage blocked_ips" ON public.blocked_ips
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
