// ============================================================================
// Supabase Client Initializer & Configuration
// Configured with live project URL: https://aevkzgdhjjzaybfphxcy.supabase.co
// ============================================================================

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database';
import { Platform } from 'react-native';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://aevkzgdhjjzaybfphxcy.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFldmt6Z2Roamp6YXliZnBoeGN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MjgzNTYsImV4cCI6MjEwMDIwNDM1Nn0.RrO1jRYBo6m18C456pFt0_ZG0ljUkV0ZSoNZf87MTw8';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});
