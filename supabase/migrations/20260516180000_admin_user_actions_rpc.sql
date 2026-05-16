-- Fixes for Admin User Actions
CREATE OR REPLACE FUNCTION admin_update_profile(p_target_user_id UUID, p_display_name TEXT, p_avatar_url TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
  SET display_name = p_display_name,
      avatar_url = p_avatar_url
  WHERE id = p_target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_delete_user(p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM auth.users WHERE id = p_target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION admin_block_user_ip(p_target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ip TEXT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT ip_address INTO v_ip
  FROM auth.audit_log_entries
  WHERE actor_id = p_target_user_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_ip IS NOT NULL AND v_ip != '' THEN
    INSERT INTO public.blocked_ips (ip_address)
    VALUES (v_ip)
    ON CONFLICT (ip_address) DO NOTHING;
  ELSE
    RAISE EXCEPTION 'No IP found for this user';
  END IF;
END;
$$;
