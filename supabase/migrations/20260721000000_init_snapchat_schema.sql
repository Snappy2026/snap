-- ============================================================================
-- Snapchat Architecture Migration: Schema, Indexes, RLS, Storage & Triggers
-- Target DB: PostgreSQL / Supabase
-- ============================================================================

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Custom Enum Types
CREATE TYPE public.friendship_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE public.media_type AS ENUM ('image', 'video');

-- 3. Table Definitions

-- PROFILES TABLE: Core user metadata linked to auth.users
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FRIENDSHIPS TABLE: Bidirectional social graph
CREATE TABLE public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friendship_status NOT NULL DEFAULT 'pending'::public.friendship_status,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friendship UNIQUE (requester_id, addressee_id),
  CONSTRAINT no_self_friend CHECK (requester_id <> addressee_id)
);

-- SNAPS TABLE: Metadata for ephemeral snaps
CREATE TABLE public.snaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type public.media_type NOT NULL DEFAULT 'image'::public.media_type,
  duration INTEGER NOT NULL DEFAULT 5 CHECK (duration > 0 AND duration <= 10),
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. High-Performance Indexing Strategy
-- Optimized for fetching unviewed snaps instantly for the logged-in recipient
CREATE INDEX idx_snaps_recipient_unviewed 
  ON public.snaps (recipient_id, created_at DESC) 
  WHERE viewed_at IS NULL;

CREATE INDEX idx_snaps_sender 
  ON public.snaps (sender_id, created_at DESC);

CREATE INDEX idx_friendships_lookup 
  ON public.friendships (requester_id, addressee_id, status);

CREATE INDEX idx_friendships_reverse 
  ON public.friendships (addressee_id, status);

-- 5. Row Level Security (RLS) Setup
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snaps ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- FRIENDSHIPS POLICIES
CREATE POLICY "Users can view their own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

CREATE POLICY "Users can create friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update friendships involving them"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- SNAPS POLICIES (STRICT EPHEMERALITY RULES)
-- Rule: Users can ONLY view snaps addressed specifically to them, and ONLY if unviewed.
CREATE POLICY "Recipients can view unviewed snaps addressed to them"
  ON public.snaps FOR SELECT
  TO authenticated
  USING (recipient_id = auth.uid() AND viewed_at IS NULL);

-- Rule: Authenticated users can send snaps (insert as sender)
CREATE POLICY "Senders can insert snaps"
  ON public.snaps FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Rule: Recipients can mark snap as viewed by updating viewed_at timestamp
CREATE POLICY "Recipients can mark snaps as viewed"
  ON public.snaps FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() AND viewed_at IS NULL)
  WITH CHECK (recipient_id = auth.uid());

-- 6. Storage Bucket Configuration & RLS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snaps-media', 
  'snaps-media', 
  false, 
  52428800, -- 50MB max file size
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: Authenticated users can upload to snaps-media
CREATE POLICY "Authenticated users can upload snap media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'snaps-media');

-- Storage RLS: Only intended recipient with unviewed snap can download/read file
CREATE POLICY "Recipients can read media for unviewed snaps"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'snaps-media' AND
    EXISTS (
      SELECT 1 FROM public.snaps
      WHERE snaps.media_url LIKE '%' || storage.objects.name
        AND snaps.recipient_id = auth.uid()
        AND snaps.viewed_at IS NULL
    )
  );

-- 7. Automatic Profile Creation Trigger on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable Realtime replication for snaps and friendships
ALTER PUBLICATION supabase_realtime ADD TABLE public.snaps;
ALTER PUBLICATION supabase_realtime ADD TABLE public.friendships;
