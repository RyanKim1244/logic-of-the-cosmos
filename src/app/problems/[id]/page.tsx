import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import ProblemDetailContent from "@/components/ProblemDetailContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("problems")
    .select("title, source, year, problem_number")
    .eq("id", id)
    .single();

  if (!data) return { title: "문제를 찾을 수 없습니다" };

  const title = `${data.source} ${data.year} #${data.problem_number}`;
  return {
    title,
    description: `${data.title} — ${data.source} ${data.year}년 ${data.problem_number}번 문제`,
    openGraph: { title },
  };
}

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
