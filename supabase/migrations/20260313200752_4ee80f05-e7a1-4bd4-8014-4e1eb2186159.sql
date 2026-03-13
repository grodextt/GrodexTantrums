
-- Create a secure function to unlock a chapter by deducting coins
CREATE OR REPLACE FUNCTION public.unlock_chapter_with_coins(p_user_id uuid, p_chapter_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coin_price integer;
  v_coin_balance integer;
  v_already_unlocked boolean;
  v_is_premium boolean;
BEGIN
  -- Get chapter info
  SELECT premium, coin_price INTO v_is_premium, v_coin_price
  FROM public.chapters
  WHERE id = p_chapter_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chapter not found');
  END IF;

  IF NOT v_is_premium THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chapter is not premium');
  END IF;

  v_coin_price := COALESCE(v_coin_price, 100);

  -- Check if already unlocked
  SELECT EXISTS (
    SELECT 1 FROM public.chapter_unlocks
    WHERE chapter_id = p_chapter_id
      AND user_id = p_user_id
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_already_unlocked;

  IF v_already_unlocked THEN
    RETURN jsonb_build_object('success', false, 'error', 'Already unlocked');
  END IF;

  -- Check balance
  SELECT COALESCE(coin_balance, 0) INTO v_coin_balance
  FROM public.profiles
  WHERE id = p_user_id;

  IF v_coin_balance < v_coin_price THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins', 'required', v_coin_price, 'balance', v_coin_balance);
  END IF;

  -- Deduct coins
  UPDATE public.profiles
  SET coin_balance = COALESCE(coin_balance, 0) - v_coin_price
  WHERE id = p_user_id;

  -- Insert unlock record
  INSERT INTO public.chapter_unlocks (user_id, chapter_id, unlock_type, expires_at)
  VALUES (p_user_id, p_chapter_id, 'coin', now() + interval '30 days');

  RETURN jsonb_build_object('success', true, 'coins_spent', v_coin_price);
END;
$$;

-- Add INSERT policy for chapter_unlocks (needed for the function, but function is SECURITY DEFINER so it bypasses RLS)
-- Also ensure the trigger for comment streaks exists
CREATE OR REPLACE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_comment();
