import { setRequestLocale } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase-server";
import ContestsContent from "@/components/ContestsContent";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ContestsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = createServerSupabase();

  const [contestsRes, sourcesRes] = await Promise.allSettled([
    supabase.from("contests").select("*"),
    supabase.from("problems").select("source"),
  ]);

  const contests =
    contestsRes.status === "fulfilled" && contestsRes.value.data
      ? contestsRes.value.data
      : [];

  const allSources =
    sourcesRes.status === "fulfilled" && sourcesRes.value.data
      ? sourcesRes.value.data
      : [];

  const problemCounts: Record<string, number> = {};
  for (const contest of contests) {
    const shortLower = contest.short_name.toLowerCase();
    problemCounts[contest.id] = allSources.filter(
      (p: { source: string }) => p.source.toLowerCase().includes(shortLower)
    ).length;
  }

  return (
    <ContestsContent
      initialContests={contests}
      initialProblemCounts={problemCounts}
    />
  );
}
