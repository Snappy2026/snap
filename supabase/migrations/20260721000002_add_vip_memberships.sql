-- ============================================================================
-- Snapchat Architecture Migration Step 3: VIP Paid Membership & Exclusive Content
-- ============================================================================

-- 1. Extend Profiles Table with VIP Membership fields
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS is_vip_member BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS vip_tier TEXT DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS vip_expires_at TIMESTAMPTZ;

-- 2. VIP EXCLUSIVE CONTENT TABLE
CREATE TABLE IF NOT EXISTS public.vip_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  media_url TEXT NOT NULL,
  media_type public.media_type NOT NULL DEFAULT 'image'::public.media_type,
  required_tier TEXT NOT NULL DEFAULT 'vip_gold',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. High-Performance VIP Index
CREATE INDEX IF NOT EXISTS idx_vip_content_tier ON public.vip_content (required_tier, created_at DESC);

-- 4. Strict Row Level Security Policies for VIP Content
ALTER TABLE public.vip_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only active VIP members can view exclusive VIP content"
  ON public.vip_content FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.is_vip_member = true
        AND (profiles.vip_expires_at IS NULL OR profiles.vip_expires_at > NOW())
    )
  );

CREATE POLICY "Creators can post VIP content"
  ON public.vip_content FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);
