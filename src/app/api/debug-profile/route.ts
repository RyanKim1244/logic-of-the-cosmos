import { createAuthServerSupabase } from "@/lib/supabase-server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createAuthServerSupabase();
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({
      error: "Not authenticated",
      authError: authError?.message ?? null,
      hint: "Server could not read auth session from cookies. Check middleware.ts is working.",
    });
  }

  const userId = authUser.id;

  const [statsRes, heatmapRes, historyRes] = await Promise.allSettled([
    supabase
      .from("user_stats")
      .select("solved_count, solution_count, discussion_count")
      .eq("user_id", userId)
      .single(),
    supabase.rpc("get_solve_heatmap", { p_user_id: userId, p_days: 183 }),
    supabase
      .from("user_solved_problems")
      .select("problem_id, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  return NextResponse.json({
    userId,
    user_stats: statsRes.status === "fulfilled"
      ? { data: statsRes.value.data, error: statsRes.value.error?.message ?? null }
      : { rejected: (statsRes as PromiseRejectedResult).reason?.toString() },
    get_solve_heatmap: heatmapRes.status === "fulfilled"
      ? { data: heatmapRes.value.data, error: heatmapRes.value.error?.message ?? null }
      : { rejected: (heatmapRes as PromiseRejectedResult).reason?.toString() },
    user_solved_problems: historyRes.status === "fulfilled"
      ? { data: historyRes.value.data, error: historyRes.value.error?.message ?? null }
      : { rejected: (historyRes as PromiseRejectedResult).reason?.toString() },
  });
}
