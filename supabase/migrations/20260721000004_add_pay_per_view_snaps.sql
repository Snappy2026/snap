-- ============================================================================
-- Snapchat Architecture Migration Step 5: Pay-Per-View (PPV) Locked Snaps & Clips
-- Enables individual price tags on photo/video snaps with automated Stripe payouts.
-- ============================================================================

ALTER TABLE public.snaps
  ADD COLUMN IF NOT EXISTS is_pay_per_view BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS unlocked_by UUID[] DEFAULT '{}';

ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS is_pay_per_view BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS price_amount NUMERIC(10, 2) DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS unlocked_by UUID[] DEFAULT '{}';
