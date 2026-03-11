import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * Refreshes expired Supabase auth tokens on every request.
 * Server Components can't write cookies, so the proxy handles:
 *  1. Reading auth cookies from the request
 *  2. Refreshing expired tokens via supabase.auth.getUser()
 *  3. Writing refreshed tokens to both request (for server components)
 *     and response (for the browser)
 */
export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // 1. Update request cookies so downstream server components see fresh tokens
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // 2. Recreate response to carry updated request cookies forward
          supabaseResponse = NextResponse.next({ request });
          // 3. Update response cookies so the browser stores the refreshed tokens
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always use getUser() (not getSession()) — getUser() contacts the
  // Supabase Auth server to verify and refresh the token.
  // getSession() only reads from cookies without verification.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Run on all routes except static files and images
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
