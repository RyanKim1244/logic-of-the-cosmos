import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getDisplayText } from "@/lib/multilang";
import { ContestSectionContent } from "@/components/ContestDetailContent";

export default async function ContestSectionPage({
  params,
}: {
  params: Promise<{ id: string; section: string[] }>;
}) {
  const { id, section: sectionParts } = await params;
  const sectionPath = sectionParts.map(decodeURIComponent).join("/");
  const supabase = createServerSupabase();

  const { data: contest } = await supabase
    .from("contests")
    .select("*")
    .eq("id", id)
    .single();

  if (!contest) notFound();

  const { data: problems } = await supabase
    .from("problems")
    .select("id, problem_number, title, source, year, section")
    .ilike("source", `%${contest.short_name}%`)
    .order("year", { ascending: false });

  const parsedProblems = (problems ?? []).map((p) => ({
    ...p,
    title: getDisplayText(p.title),
    section: p.section ?? null,
  }));

  return (
    <ContestSectionContent
      contest={contest}
      contestProblems={parsedProblems}
      sectionPath={sectionPath}
    />
  );
}
