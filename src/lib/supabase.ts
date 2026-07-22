// ============================================================================
// Supabase Client Initializer & Configuration
// Configured with live project URL: https://aevkzgdhjjzaybfphxcy.supabase.co
// ============================================================================

import "react-native-url-polyfill/auto";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../types/database";
import { Platform } from "react-native";

const env = process.env as Record<string, string | undefined>;
const SUPABASE_URL =
  env.EXPO_PUBLIC_SUPABASE_URL || "https://nlbhhcdzgvecfowcgkhb.supabase.co";
const SUPABASE_ANON_KEY =
  env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sYmhoY2R6Z3ZlY2Zvd2Nna2hiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ3MDg1OTUsImV4cCI6MjEwMDI4NDU5NX0.V3rz94mwL9K9sSfDe_MvMSwBzhCGVvk4xXiXoCNtOqc";

export const supabase = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: Platform.OS === "web",
    },
  },
);
