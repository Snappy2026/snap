-- ============================================================================
-- Snapchat Architecture Migration Step 2: 1-on-1 Chat Messages & 24-Hour Stories
-- ============================================================================

-- 1. MESSAGES TABLE: 1-on-1 Real-time text messaging
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  text_content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at TIMESTAMPTZ
);

-- 2. STORIES TABLE: 24-Hour Ephemeral Stories
CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  media_url TEXT NOT NULL,
  media_type public.media_type NOT NULL DEFAULT 'image'::public.media_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

-- 3. Performance Indexes
CREATE INDEX idx_messages_conversation 
  ON public.messages (sender_id, recipient_id, created_at DESC);

CREATE INDEX idx_messages_recipient_unread 
  ON public.messages (recipient_id, created_at DESC) 
  WHERE read_at IS NULL;

CREATE INDEX idx_stories_active 
  ON public.stories (user_id, expires_at DESC) 
  WHERE expires_at > NOW();

-- 4. Row Level Security Policies
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- MESSAGES RLS
CREATE POLICY "Users can read their 1-on-1 messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send text messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can mark messages as read"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = recipient_id);

-- STORIES RLS
CREATE POLICY "Authenticated users can view active stories"
  ON public.stories FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

CREATE POLICY "Users can post to their story"
  ON public.stories FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own story"
  ON public.stories FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 5. Realtime Replication for Messages and Stories
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;
