-- Bug 3: Fix check constraint to allow 'ticket' value
ALTER TABLE public.chapter_unlocks DROP CONSTRAINT IF EXISTS chapter_unlocks_unlock_type_check;
ALTER TABLE public.chapter_unlocks ADD CONSTRAINT chapter_unlocks_unlock_type_check CHECK (unlock_type = ANY (ARRAY['coin'::text, 'token'::text, 'ticket'::text]));

-- Bug 7: Update handle_auto_free_chapters to reset created_at when chapters become free
CREATE OR REPLACE FUNCTION public.handle_auto_free_chapters()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
$function$;
