import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import PublicProfileContent from "@/components/PublicProfileContent";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  const profile =
    profileRes.status === "fulfilled" && profileRes.value.data
      ? profileRes.value.data
      : null;

  if (!profile) {
    notFound();
  }

  const statsData =
    statsRes.status === "fulfilled" && statsRes.value.data
      ? statsRes.value.data
      : null;

  // Extract solved problem IDs for Phase 2
  const solvedIds =
    historyRes.status === "fulfilled"
      ? (historyRes.value.data?.map((s: { problem_id: string }) => s.problem_id) ?? [])
      : [];

  // Phase 2: Fetch problem details (needs IDs from Phase 1)
  const detailsData =
    solvedIds.length > 0
      ? ((await supabase.from("problems").select("id, title, source").in("id", solvedIds)).data ?? [])
      : [];

  const detailMap = new Map(
    detailsData.map((p: { id: string; title: string; source: string }) => [p.id, p])
  );

  // Process heatmap
  let solvedDates: string[] = [];
  if (heatmapRes.status === "fulfilled" && heatmapRes.value.data && !heatmapRes.value.error) {
    for (const row of heatmapRes.value.data as { solve_date: string; solve_count: number }[]) {
      for (let i = 0; i < row.solve_count; i++) {
        solvedDates.push(row.solve_date);
      }
    }
  }

  // Process solve history
  let solveHistory: { problem_id: string; created_at: string; title: string; source: string }[] = [];
  if (historyRes.status === "fulfilled" && historyRes.value.data) {
    const histData = historyRes.value.data as { problem_id: string; created_at: string }[];
    if (solvedDates.length === 0) {
      solvedDates = histData.map((s) => s.created_at);
    }
    solveHistory = histData
      .map((s) => {
        const detail = detailMap.get(s.problem_id);
        if (!detail) return null;
        return { problem_id: s.problem_id, created_at: s.created_at, title: detail.title, source: detail.source };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null);
  }

  return (
    <PublicProfileContent
      profile={profile}
      solvedCount={statsData?.solved_count ?? 0}
      solutionCount={statsData?.solution_count ?? 0}
      discussionCount={statsData?.discussion_count ?? 0}
      solvedDates={solvedDates}
      solveHistory={solveHistory}
    />
  );
}
