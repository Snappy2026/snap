-- Add new columns for Gallery and VIP section updates
ALTER TABLE public.vip_content 
ADD COLUMN category TEXT,
ADD COLUMN is_public_gallery BOOLEAN DEFAULT false;

-- Allow creators to insert public gallery items without requiring a VIP tier
ALTER TABLE public.vip_content
ALTER COLUMN required_tier DROP NOT NULL;

-- Ensure required_tier defaults to 'vip' if it's not a public gallery item
CREATE OR REPLACE FUNCTION set_default_required_tier()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_public_gallery = true THEN
    NEW.required_tier = 'public';
  ELSIF NEW.required_tier IS NULL THEN
    NEW.required_tier = 'vip';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_default_required_tier
BEFORE INSERT OR UPDATE ON public.vip_content
FOR EACH ROW EXECUTE FUNCTION set_default_required_tier();
