import { setRequestLocale } from "next-intl/server";
import { createAuthServerSupabase } from "@/lib/supabase-server";
import ProfilePageContent, { type ProfileData } from "@/components/ProfilePageContent";

// Profile page must always render fresh (user-specific, cookie-based auth)
export const dynamic = "force-dynamic";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const supabase = await createAuthServerSupabase();
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return <ProfilePageContent initialData={null} />;
  }

  const userId = authUser.id;

  // Phase 1: All independent queries in parallel
  const [profileRes, statsRes, heatmapRes, historyRes, bookmarkedIdsRes] = await Promise.allSettled([
    supabase
      .from("profiles")
      .select("name, email, bio, created_at")
      .eq("id", userId)
      .single(),
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
    supabase
      .from("user_bookmarked_problems")
      .select("problem_id")
      .eq("user_id", userId),
  ]);

  // Log errors for debugging (visible in the dev server terminal)
  const queryNames = ["profiles", "user_stats", "get_solve_heatmap", "user_solved_problems", "user_bookmarked_problems"];
  [profileRes, statsRes, heatmapRes, historyRes, bookmarkedIdsRes].forEach((res, i) => {
    if (res.status === "rejected") {
      console.error(`[Profile] ${queryNames[i]} rejected:`, res.reason);
    } else if (res.value.error) {
      console.error(`[Profile] ${queryNames[i]} error:`, res.value.error.message);
    }
  });

  // Extract solved data from history query
  const historyData =
    historyRes.status === "fulfilled" && historyRes.value.data && !historyRes.value.error
      ? (historyRes.value.data as { problem_id: string; created_at: string }[])
      : [];

  const solvedIds = historyData.map((s) => s.problem_id);

  const bookmarkedIds =
    bookmarkedIdsRes.status === "fulfilled" && bookmarkedIdsRes.value.data && !bookmarkedIdsRes.value.error
      ? bookmarkedIdsRes.value.data.map((b: { problem_id: string }) => b.problem_id)
      : [];

  const allProblemIds = [...new Set([...solvedIds, ...bookmarkedIds])];

  // Phase 2: Fetch problem details (needs IDs from Phase 1)
  const detailsData =
    allProblemIds.length > 0
      ? ((await supabase.from("problems").select("id, problem_number, title, source").in("id", allProblemIds)).data ?? [])
      : [];

  const detailMap = new Map(
    detailsData.map((p: { id: string; problem_number: number; title: string; source: string }) => [p.id, p])
  );

  // Process heatmap — try RPC first, fall back to raw created_at timestamps
  let solvedDates: string[] = [];
  if (heatmapRes.status === "fulfilled" && heatmapRes.value.data && !heatmapRes.value.error) {
    for (const row of heatmapRes.value.data as { solve_date: string; solve_count: number }[]) {
      for (let i = 0; i < row.solve_count; i++) {
        solvedDates.push(row.solve_date);
      }
    }
  }
  // Always fall back to raw timestamps if RPC returned nothing
  if (solvedDates.length === 0 && historyData.length > 0) {
    solvedDates = historyData.map((s) => s.created_at);
  }

  // Process solve history — show records even if problem detail is missing
  const solveHistory: ProfileData["solveHistory"] = historyData.map((s) => {
    const detail = detailMap.get(s.problem_id);
    return {
      problem_id: s.problem_id,
      created_at: s.created_at,
      title: detail?.title ?? "(삭제된 문제)",
      source: detail?.source ?? "",
      problem_number: detail?.problem_number ?? 0,
    };
  });

  // If we can't fetch the user profile, fall back to unauthenticated view
  const profileData =
    profileRes.status === "fulfilled" && profileRes.value.data
      ? profileRes.value.data
      : null;

  if (!profileData) {
    return <ProfilePageContent initialData={null} />;
  }

  const statsData =
    statsRes.status === "fulfilled" && statsRes.value.data && !statsRes.value.error
      ? statsRes.value.data
      : null;

  const data: ProfileData = {
    userProfile: {
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio || "",
      createdAt: profileData.created_at,
    },
    solvedCount: statsData?.solved_count ?? historyData.length,
    solutionCount: statsData?.solution_count ?? 0,
    discussionCount: statsData?.discussion_count ?? 0,
    solvedDates,
    solveHistory,
    bookmarkedProblems: bookmarkedIds
      .map((id: string) => detailMap.get(id))
      .filter((p): p is { id: string; problem_number: number; title: string; source: string } => !!p),
    solvedProblems: solvedIds
      .map((id: string) => {
        const detail = detailMap.get(id);
        return detail ?? { id, problem_number: 0, title: "(삭제된 문제)", source: "" };
      }),
  };

  return <ProfilePageContent initialData={data} />;
}
