-- Lumina App - Complete Supabase Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Users table (profiles linked to auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT UNIQUE NOT NULL,
  supabase_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  birth_date DATE NOT NULL,
  birth_time TIME NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  city TEXT NOT NULL,
  timezone_str TEXT DEFAULT 'UTC',
  birth_chart JSONB NOT NULL,
  preferences JSONB DEFAULT '{"notifications": {"daily_briefing": true, "transit_alerts": true, "preferred_time": "08:00"}, "theme": "dark"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entry_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood INTEGER NOT NULL CHECK (mood >= 1 AND mood <= 5),
  tags TEXT[] DEFAULT '{}',
  prompt TEXT,
  audio_url TEXT,
  transits_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id TEXT UNIQUE NOT NULL,
  conversation_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  saved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Daily insights table (caching for briefings)
CREATE TABLE IF NOT EXISTS public.daily_insights (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL REFERENCES public.users(user_id) ON DELETE CASCADE,
  date DATE NOT NULL,
  content JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_users_supabase_id ON public.users(supabase_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users(user_id);
CREATE INDEX IF NOT EXISTS idx_journal_user_date ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_journal_entry_id ON public.journal_entries(entry_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversation ON public.chat_messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_chat_user ON public.chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_message_id ON public.chat_messages(message_id);
CREATE INDEX IF NOT EXISTS idx_daily_insights_user_date ON public.daily_insights(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_insights ENABLE ROW LEVEL SECURITY;

-- Users policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = supabase_id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = supabase_id);

DROP POLICY IF EXISTS "Service role can manage all users" ON public.users;
CREATE POLICY "Service role can manage all users" ON public.users
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Journal entries policies
DROP POLICY IF EXISTS "Users can view own journal entries" ON public.journal_entries;
CREATE POLICY "Users can view own journal entries" ON public.journal_entries
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own journal entries" ON public.journal_entries;
CREATE POLICY "Users can insert own journal entries" ON public.journal_entries
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own journal entries" ON public.journal_entries;
CREATE POLICY "Users can update own journal entries" ON public.journal_entries
  FOR UPDATE USING (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can delete own journal entries" ON public.journal_entries;
CREATE POLICY "Users can delete own journal entries" ON public.journal_entries
  FOR DELETE USING (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role can manage all journal entries" ON public.journal_entries;
CREATE POLICY "Service role can manage all journal entries" ON public.journal_entries
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Chat messages policies
DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role can manage all chat messages" ON public.chat_messages;
CREATE POLICY "Service role can manage all chat messages" ON public.chat_messages
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Daily insights policies
DROP POLICY IF EXISTS "Users can view own daily insights" ON public.daily_insights;
CREATE POLICY "Users can view own daily insights" ON public.daily_insights
  FOR SELECT USING (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can insert own daily insights" ON public.daily_insights;
CREATE POLICY "Users can insert own daily insights" ON public.daily_insights
  FOR INSERT WITH CHECK (
    user_id IN (SELECT user_id FROM public.users WHERE supabase_id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role can manage all daily insights" ON public.daily_insights;
CREATE POLICY "Service role can manage all daily insights" ON public.daily_insights
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get user conversations (replaces MongoDB aggregation)
CREATE OR REPLACE FUNCTION get_user_conversations(p_user_id TEXT)
RETURNS TABLE (
  conversation_id TEXT,
  last_message TEXT,
  last_at TIMESTAMPTZ,
  message_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.conversation_id,
    (array_agg(cm.content ORDER BY cm.created_at DESC))[1] as last_message,
    MAX(cm.created_at) as last_at,
    COUNT(*)::BIGINT as message_count
  FROM chat_messages cm
  WHERE cm.user_id = p_user_id
  GROUP BY cm.conversation_id
  ORDER BY MAX(cm.created_at) DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGERS
-- ============================================

DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON public.users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON public.journal_entries;
CREATE TRIGGER update_journal_entries_updated_at 
  BEFORE UPDATE ON public.journal_entries
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant access to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
