import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

/**
 * Next.js 16 proxy (replaces middleware.ts).
 *
 * 1. Runs next-intl locale routing
 * 2. Refreshes expired Supabase auth tokens on every request.
 */
export async function proxy(request: NextRequest) {
  // Run next-intl middleware first for locale routing
  const intlResponse = intlMiddleware(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Update request cookies so downstream server components see fresh tokens
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Update response cookies so the browser stores the refreshed tokens
          cookiesToSet.forEach(({ name, value, options }) =>
            intlResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Always use getUser() (not getSession()) — getUser() contacts the
  // Supabase Auth server to verify and refresh the token.
  await supabase.auth.getUser();

  return intlResponse;
}

export const config = {
  matcher: [
    "/((?!api|_next|_vercel|images|favicon.svg|robots.txt|sitemap.xml).*)",
  ],
};
