-- Drop the function first because we're changing the return type
DROP FUNCTION IF EXISTS public.get_chapter_pages(uuid);

CREATE OR REPLACE FUNCTION public.get_chapter_pages(p_chapter_id uuid)
 RETURNS text[]
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ch record;
  caller_id uuid;
  is_admin boolean;
  is_sub boolean;
BEGIN
  caller_id := auth.uid();
  
  SELECT * INTO ch FROM public.chapters WHERE id = p_chapter_id;
  IF NOT FOUND THEN RETURN '{}'::text[]; END IF;

  -- Check if admin/moderator
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id = caller_id AND role IN ('admin','moderator')) INTO is_admin;
  IF is_admin THEN RETURN ch.pages; END IF;

  -- Free chapter
  IF ch.premium = false AND ch.is_subscription = false THEN
    RETURN ch.pages;
  END IF;

  -- Premium chapter that has been released for free
  IF ch.premium = true AND ch.free_release_at IS NOT NULL AND ch.free_release_at <= now() THEN
    RETURN ch.pages;
  END IF;

  -- Subscription chapter that has been released for free
  IF ch.is_subscription = true AND ch.subscription_free_release_at IS NOT NULL AND ch.subscription_free_release_at <= now() THEN
    RETURN ch.pages;
  END IF;

  -- Subscription chapter - check if user has active subscription
  IF ch.is_subscription = true THEN
    SELECT public.has_active_subscription(caller_id) INTO is_sub;
    IF is_sub THEN RETURN ch.pages; END IF;
    RETURN '{}'::text[]; END IF;

  -- Premium chapter - check unlock
  IF ch.premium = true THEN
    IF EXISTS (
      SELECT 1 FROM public.chapter_unlocks
      WHERE chapter_id = p_chapter_id AND user_id = caller_id
        AND (expires_at IS NULL OR expires_at > now())
    ) THEN
      RETURN ch.pages;
    END IF;
    RETURN '{}'::text[]; END IF;

  -- Default to returning pages if no other conditions met
  RETURN ch.pages;
END;
$function$;
