import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ProblemDetailContent from "@/components/ProblemDetailContent";

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const [problemRes, solvedCountRes] = await Promise.allSettled([
    supabase.from("problems").select("*").eq("id", id).single(),
    supabase.from("user_solved_problems").select("*", { count: "exact", head: true }).eq("problem_id", id),
  ]);

  const problemData =
    problemRes.status === "fulfilled" && problemRes.value.data
      ? problemRes.value.data
      : null;

  if (!problemData) {
    notFound();
  }

  const problem = {
    id: problemData.id,
    problemNumber: problemData.problem_number,
    title: problemData.title,
    source: problemData.source,
    year: problemData.year,
    tags: problemData.tags,
    content: problemData.content,
    officialSolution: problemData.official_solution,
    problemUrl: problemData.problem_url ?? null,
    createdAt: problemData.created_at,
    updatedAt: problemData.updated_at,
  };

  const solvedCount =
    solvedCountRes.status === "fulfilled" ? (solvedCountRes.value.count ?? 0) : 0;

  return (
    <ProblemDetailContent
      initialProblem={problem}
      initialSolvedCount={solvedCount}
    />
  );
}
