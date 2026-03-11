import { createAuthServerSupabase } from "@/lib/supabase-server";
import ProfilePageContent, { type ProfileData } from "@/components/ProfilePageContent";

export default async function ProfilePage() {
  // Authenticated server client — reads auth cookies set by the browser
  // and refreshed by the middleware. auth.uid() works, so RLS applies correctly.
  const supabase = await createAuthServerSupabase();

  // Verify the user's session (getUser() contacts the auth server)
  const { data: { user: authUser } } = await supabase.auth.getUser();

  if (!authUser) {
    return <ProfilePageContent initialData={null} />;
  }

  const userId = authUser.id;

  // Phase 1: All independent queries in parallel (server → Supabase, same region = fast)
  // All queries now run with a real auth.uid(), so RLS policies work correctly
  // (including user_bookmarked_problems which requires auth).
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

  // Extract IDs for Phase 2
  const solvedIds =
    historyRes.status === "fulfilled"
      ? (historyRes.value.data?.map((s: { problem_id: string }) => s.problem_id) ?? [])
      : [];
  const bookmarkedIds =
    bookmarkedIdsRes.status === "fulfilled"
      ? (bookmarkedIdsRes.value.data?.map((b: { problem_id: string }) => b.problem_id) ?? [])
      : [];
  const allProblemIds = [...new Set([...solvedIds, ...bookmarkedIds])];

  // Phase 2: Fetch problem details (needs IDs from Phase 1)
  const detailsData =
    allProblemIds.length > 0
      ? ((await supabase.from("problems").select("id, title, source").in("id", allProblemIds)).data ?? [])
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
  let solveHistory: ProfileData["solveHistory"] = [];
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

  // If we can't fetch the user profile, fall back to unauthenticated view
  const profileData =
    profileRes.status === "fulfilled" && profileRes.value.data
      ? profileRes.value.data
      : null;

  if (!profileData) {
    return <ProfilePageContent initialData={null} />;
  }

  const data: ProfileData = {
    userProfile: {
      name: profileData.name,
      email: profileData.email,
      bio: profileData.bio || "",
      createdAt: profileData.created_at,
    },
    solvedCount:
      statsRes.status === "fulfilled" && statsRes.value.data
        ? statsRes.value.data.solved_count
        : 0,
    solutionCount:
      statsRes.status === "fulfilled" && statsRes.value.data
        ? statsRes.value.data.solution_count
        : 0,
    discussionCount:
      statsRes.status === "fulfilled" && statsRes.value.data
        ? statsRes.value.data.discussion_count
        : 0,
    solvedDates,
    solveHistory,
    bookmarkedProblems: bookmarkedIds
      .map((id: string) => detailMap.get(id))
      .filter((p): p is { id: string; title: string; source: string } => !!p),
    solvedProblems: solvedIds
      .map((id: string) => detailMap.get(id))
      .filter((p): p is { id: string; title: string; source: string } => !!p),
  };

  return <ProfilePageContent initialData={data} />;
}
