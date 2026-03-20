import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import { getDisplayText } from "@/lib/multilang";
import ContestDetailContent from "@/components/ContestDetailContent";

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

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
