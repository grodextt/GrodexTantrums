
-- Set context_type and context_id on existing comments that don't have them
UPDATE public.comments 
SET context_type = 'manga', context_id = manga_id 
WHERE context_type IS NULL OR context_id IS NULL;

-- Set free_release_at on existing chapters with auto_free_days
UPDATE public.chapters
SET free_release_at = created_at + (auto_free_days || ' days')::interval
WHERE auto_free_days IS NOT NULL AND free_release_at IS NULL;

-- Create trigger to auto-set free_release_at when chapter is created/updated with auto_free_days
CREATE OR REPLACE FUNCTION public.set_free_release_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.auto_free_days IS NOT NULL AND NEW.premium = true THEN
    NEW.free_release_at := NEW.created_at + (NEW.auto_free_days || ' days')::interval;
  ELSE
    NEW.free_release_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_free_release_at_trigger ON public.chapters;
CREATE TRIGGER set_free_release_at_trigger
  BEFORE INSERT OR UPDATE OF auto_free_days, premium ON public.chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.set_free_release_at();
