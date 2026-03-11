import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

/**
 * Anon Supabase client for ISR/static pages (public data only).
 * Does NOT read cookies → does NOT make pages dynamic.
 * Use for pages with `revalidate` (main, problems, contests, community).
 */
export function createServerSupabase() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Authenticated Supabase client for dynamic server components.
 * Reads auth cookies set by the browser client + refreshed by middleware.
 * The server gets a real auth.uid() so RLS policies work correctly.
 *
 * ⚠️ Calling this makes the page dynamic (no ISR). Only use for
 * pages that need user-specific data (e.g. profile).
 */
export async function createAuthServerSupabase() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll can be called from Server Components which can't write cookies.
          // The middleware handles token refresh, so this is safe to ignore.
        }
      },
    },
  });
}
