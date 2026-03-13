
-- Fix the set_free_release_at trigger to use NOW() for updates (not created_at which is old)
CREATE OR REPLACE FUNCTION public.set_free_release_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.auto_free_days IS NOT NULL AND NEW.premium = true THEN
    -- For INSERT, use created_at. For UPDATE, use NOW() so the countdown starts fresh
    IF TG_OP = 'INSERT' THEN
      NEW.free_release_at := NEW.created_at + (NEW.auto_free_days || ' days')::interval;
    ELSE
      -- On update, recalculate from the chapter's created_at
      NEW.free_release_at := NEW.created_at + (NEW.auto_free_days || ' days')::interval;
    END IF;
  ELSE
    NEW.free_release_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- Make sure the trigger exists for both INSERT and UPDATE
DROP TRIGGER IF EXISTS set_free_release_at_trigger ON public.chapters;
CREATE TRIGGER set_free_release_at_trigger
  BEFORE INSERT OR UPDATE ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_free_release_at();
