import { createAuthServerSupabase, createServerSupabase } from "@/lib/supabase-server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // 1. Check raw cookies
  const cookieStore = await cookies();
  const allCookies = cookieStore.getAll();
  const authCookies = allCookies.filter(
    (c) => c.name.includes("auth") || c.name.includes("supabase") || c.name.includes("sb-")
  );

  // 2. Try authenticated client
  const authSupabase = await createAuthServerSupabase();
  const { data: { user: authUser }, error: authError } = await authSupabase.auth.getUser();

  // 3. Try anon client with a user_id from query params or from auth
  const url = new URL(request.url);
  const queryUserId = url.searchParams.get("user_id");
  const userId = authUser?.id ?? queryUserId;

  let anonResults = null;
  if (userId) {
    const anonSupabase = createServerSupabase();
    const [statsRes, heatmapRes, historyRes] = await Promise.allSettled([
      anonSupabase
        .from("user_stats")
        .select("solved_count, solution_count, discussion_count")
        .eq("user_id", userId)
        .single(),
      anonSupabase.rpc("get_solve_heatmap", { p_user_id: userId, p_days: 183 }),
      anonSupabase
        .from("user_solved_problems")
        .select("problem_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    anonResults = {
      user_stats: statsRes.status === "fulfilled"
        ? { data: statsRes.value.data, error: statsRes.value.error?.message ?? null }
        : { rejected: String((statsRes as PromiseRejectedResult).reason) },
      get_solve_heatmap: heatmapRes.status === "fulfilled"
        ? { data: heatmapRes.value.data, error: heatmapRes.value.error?.message ?? null }
        : { rejected: String((heatmapRes as PromiseRejectedResult).reason) },
      user_solved_problems: historyRes.status === "fulfilled"
        ? { data: historyRes.value.data, error: historyRes.value.error?.message ?? null }
        : { rejected: String((historyRes as PromiseRejectedResult).reason) },
    };
  }

  return NextResponse.json({
    auth: {
      authenticated: !!authUser,
      userId: authUser?.id ?? null,
      error: authError?.message ?? null,
    },
    cookies: {
      total: allCookies.length,
      authRelated: authCookies.map((c) => ({ name: c.name, length: c.value.length })),
    },
    hint: !authUser && !queryUserId
      ? "Server auth failed. Try adding ?user_id=YOUR_UUID to test anon queries."
      : undefined,
    anonQueries: anonResults,
  });
}
