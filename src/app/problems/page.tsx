import { createServerSupabase } from "@/lib/supabase-server";
import ProblemsContent from "@/components/ProblemsContent";
import { Problem } from "@/types";

export default async function ProblemsPage() {
  const supabase = createServerSupabase();

  const [problemsRes, solvedRes, discussionRes] = await Promise.allSettled([
    supabase
      .from("problems")
      .select("id, problem_number, title, source, year, tags, created_at, updated_at")
      .order("problem_number", { ascending: true }),
    supabase.from("user_solved_problems").select("problem_id"),
    supabase.from("discussions").select("problem_id"),
  ]);

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const problems: Problem[] =
    problemsRes.status === "fulfilled" && problemsRes.value.data
      ? (problemsRes.value.data as any[]).map((p) => ({
          id: p.id,
          problemNumber: p.problem_number,
          title: p.title,
          source: p.source,
          year: p.year,
          tags: p.tags,
          content: "",
          officialSolution: "",
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        }))
      : [];
  /* eslint-enable @typescript-eslint/no-explicit-any */

  const solvedCounts: Record<string, number> = {};
  if (solvedRes.status === "fulfilled" && solvedRes.value.data) {
    for (const row of solvedRes.value.data) {
      solvedCounts[row.problem_id] = (solvedCounts[row.problem_id] || 0) + 1;
    }
  }

  const discussionCounts: Record<string, number> = {};
  if (discussionRes.status === "fulfilled" && discussionRes.value.data) {
    for (const row of discussionRes.value.data) {
      discussionCounts[row.problem_id] = (discussionCounts[row.problem_id] || 0) + 1;
    }
  }

  return (
    <ProblemsContent
      initialProblems={problems}
      initialSolvedCounts={solvedCounts}
      initialDiscussionCounts={discussionCounts}
    />
  );
}
