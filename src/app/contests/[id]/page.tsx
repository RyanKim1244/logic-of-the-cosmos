import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getDisplayText } from "@/lib/multilang";
import ContestDetailContent from "@/components/ContestDetailContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("contests")
    .select("name, short_name")
    .eq("id", id)
    .single();

  if (!data) return { title: "대회를 찾을 수 없습니다" };

  return {
    title: `${data.name} (${data.short_name}) 기출문제`,
    description: `${data.name} 기출문제 모음 — 연도별로 정리된 문제를 풀어보세요`,
    openGraph: { title: `${data.short_name} 기출문제` },
  };
}

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const { data: contest } = await supabase
    .from("contests")
    .select("*")
    .eq("id", id)
    .single();

  if (!contest) {
    notFound();
  }

  const { data: problems } = await supabase
    .from("problems")
    .select("id, problem_number, title, source, year")
    .ilike("source", `%${contest.short_name}%`)
    .order("year", { ascending: false });

  const parsedProblems = (problems ?? []).map((p) => ({
    ...p,
    title: getDisplayText(p.title),
  }));

  return (
    <ContestDetailContent
      contest={contest}
      contestProblems={parsedProblems}
    />
  );
}
