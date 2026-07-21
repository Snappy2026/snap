-- ============================================================================
-- Snapchat Architecture Migration Step 4: Stripe Connect Creator Payouts
-- Adds stripe_account_id to profiles for direct creator payment routing.
-- ============================================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS custom_gold_price NUMERIC(10, 2) DEFAULT 9.99,
  ADD COLUMN IF NOT EXISTS custom_yearly_price NUMERIC(10, 2) DEFAULT 99.00;
