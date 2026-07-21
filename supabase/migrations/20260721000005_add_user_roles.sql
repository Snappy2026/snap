-- ============================================================================
-- Migration: Add User Roles (Master Admin, Creator, Customer)
-- ============================================================================

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';

-- Update Master Admin account role
UPDATE public.profiles
SET role = 'admin'
WHERE username = 'master_admin' OR username = 'admin';

-- Index for role filtering
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
