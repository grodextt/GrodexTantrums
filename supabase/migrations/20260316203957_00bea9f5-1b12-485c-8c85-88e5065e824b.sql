-- Bug 2: Allow public read of chapter metadata (pages column excluded from queries)
CREATE POLICY "Anyone can read chapter metadata"
ON public.chapters FOR SELECT TO public
USING (true);

-- Bug 5a: Fix comment streak JSON key mismatch
CREATE OR REPLACE FUNCTION public.handle_new_comment()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID;
  v_current_streak INTEGER;
  v_last_comment TIMESTAMPTZ;
  v_today DATE;
  v_last_date DATE;
  v_new_streak INTEGER;
  v_streak_days INTEGER;
  v_streak_reward INTEGER;
BEGIN
  v_user_id := NEW.user_id;
  v_today := CURRENT_DATE;

  SELECT consecutive_comment_days, last_comment_at
  INTO v_current_streak, v_last_comment
  FROM public.profiles
  WHERE id = v_user_id;

  v_current_streak := COALESCE(v_current_streak, 0);
  v_last_date := CASE WHEN v_last_comment IS NOT NULL THEN v_last_comment::date ELSE NULL END;

  IF v_last_date IS NOT NULL AND v_last_date = v_today THEN
    RETURN NEW;
  END IF;

  IF v_last_date IS NOT NULL AND v_last_date = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_current_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  UPDATE public.profiles
  SET consecutive_comment_days = v_new_streak,
      last_comment_at = now()
  WHERE id = v_user_id;

  -- Fixed: read comment_streak_days and comment_streak_reward (was mission_streak_*)
  SELECT COALESCE((value->>'comment_streak_days')::integer, 3),
         COALESCE((value->>'comment_streak_reward')::integer, 1)
  INTO v_streak_days, v_streak_reward
  FROM public.site_settings
  WHERE key = 'token_settings';

  v_streak_days := COALESCE(v_streak_days, 3);
  v_streak_reward := COALESCE(v_streak_reward, 1);

  IF v_new_streak > 0 AND v_new_streak % v_streak_days = 0 THEN
    UPDATE public.profiles
    SET token_balance = COALESCE(token_balance, 0) + v_streak_reward
    WHERE id = v_user_id;
  END IF;

  RETURN NEW;
END;
$function$;