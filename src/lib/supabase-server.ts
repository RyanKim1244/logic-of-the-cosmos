import { createClient } from "@supabase/supabase-js";

/**
 * Creates a Supabase client suitable for use in server components.
 * Does NOT persist sessions (no localStorage on the server).
 * Uses the anon key for public data reads.
 */
export function createServerSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
