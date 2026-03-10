import { NextResponse, type NextRequest } from "next/server";

// Auth is handled client-side via localStorage (createClient from @supabase/supabase-js).
// No server-side cookie refresh is needed — just pass through.
export function proxy(request: NextRequest) {
  return NextResponse.next({ request });
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
