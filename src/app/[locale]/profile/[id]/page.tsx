import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import PublicProfileContent from "@/components/PublicProfileContent";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = createServerSupabase();

  // Phase 1: All independent queries in parallel
  const [profileRes, statsRes, heatmapRes, historyRes] = await Promise.allSettled([
    supabase.from("profiles").select("id, name, bio, created_at").eq("id", id).single(),
    supabase.from("user_stats").select("solved_count, solution_count, discussion_count").eq("user_id", id).single(),
    supabase.rpc("get_solve_heatmap", { p_user_id: id, p_days: 183 }),
    supabase
      .from("user_solved_problems")
      .select("problem_id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false }),
  ]);

  // Log errors for debugging
  const queryNames = ["profiles", "user_stats", "get_solve_heatmap", "user_solved_problems"];
  [profileRes, statsRes, heatmapRes, historyRes].forEach((res, i) => {
    if (res.status === "rejected") {
      console.error(`[PublicProfile] ${queryNames[i]} rejected:`, res.reason);
    } else if (res.value.error) {
      console.error(`[PublicProfile] ${queryNames[i]} error:`, res.value.error.message);
    }
  });

  const profile =
    profileRes.status === "fulfilled" && profileRes.value.data
      ? profileRes.value.data
      : null;

  if (!profile) {
    notFound();
  }

  const statsData =
    statsRes.status === "fulfilled" && statsRes.value.data && !statsRes.value.error
      ? statsRes.value.data
      : null;

  // Extract solved data — check for errors explicitly
  const historyData =
    historyRes.status === "fulfilled" && historyRes.value.data && !historyRes.value.error
      ? (historyRes.value.data as { problem_id: string; created_at: string }[])
      : [];

  const solvedIds = historyData.map((s) => s.problem_id);

  // Phase 2: Fetch problem details
  const detailsData =
    solvedIds.length > 0
      ? ((await supabase.from("problems").select("id, problem_number, title, source").in("id", solvedIds)).data ?? [])
      : [];

  const detailMap = new Map(
    detailsData.map((p: { id: string; problem_number: number; title: string; source: string }) => [p.id, p])
  );

  // Heatmap: try RPC first, fall back to raw timestamps
  let solvedDates: string[] = [];
  if (heatmapRes.status === "fulfilled" && heatmapRes.value.data && !heatmapRes.value.error) {
    for (const row of heatmapRes.value.data as { solve_date: string; solve_count: number }[]) {
      for (let i = 0; i < row.solve_count; i++) {
        solvedDates.push(row.solve_date);
      }
    }
  }
  if (solvedDates.length === 0 && historyData.length > 0) {
    solvedDates = historyData.map((s) => s.created_at);
  }

  // Solve history — show records even if problem detail is missing
  const solveHistory = historyData.map((s) => {
    const detail = detailMap.get(s.problem_id);
    return {
      problem_id: s.problem_id,
      created_at: s.created_at,
      title: detail?.title ?? "(삭제된 문제)",
      source: detail?.source ?? "",
      problem_number: detail?.problem_number ?? 0,
    };
  });

  return (
    <PublicProfileContent
      profile={profile}
      solvedCount={statsData?.solved_count ?? historyData.length}
      solutionCount={statsData?.solution_count ?? 0}
      discussionCount={statsData?.discussion_count ?? 0}
      solvedDates={solvedDates}
      solveHistory={solveHistory}
    />
  );
}
