import { setRequestLocale } from "next-intl/server";
import { createServerSupabase } from "@/lib/supabase-server";
import HomeContent from "@/components/HomeContent";
import { Problem } from "@/types";
import { routing } from "@/i18n/routing";

// ISR: regenerate this page in the background every 60 seconds
export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

interface ContestPreview {
  id: string;
  name: string;
  short_name: string;
  years: number[];
}

export default async function Home({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const supabase = createServerSupabase();

  // All queries run in parallel on the server — no client-side waterfall
  const [
    problemsRes,
    contestsRes,
    problemCountRes,
    contestCountRes,
    discussionCountRes,
    authorDataRes,
    problemSourcesRes,
  ] = await Promise.allSettled([
    supabase.from("problems").select("id, problem_number, title, source, year, tags, created_at, updated_at").order("created_at", { ascending: false }).limit(3),
    supabase.from("contests").select("id, name, short_name, years").limit(4),
    supabase.from("problems").select("*", { count: "exact", head: true }),
    supabase.from("contests").select("*", { count: "exact", head: true }),
    supabase.from("discussions").select("*", { count: "exact", head: true }),
    supabase.from("discussions").select("author_name"),
    supabase.from("problems").select("source"),
  ]);

  // Map problems
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

  const contests: ContestPreview[] =
    contestsRes.status === "fulfilled" && contestsRes.value.data
      ? contestsRes.value.data
      : [];

  // Log errors for debugging
  const queryNames = ["problems", "contests", "problemCount", "contestCount", "discussionCount", "authorData", "problemSources"];
  [problemsRes, contestsRes, problemCountRes, contestCountRes, discussionCountRes, authorDataRes, problemSourcesRes].forEach((res, i) => {
    if (res.status === "rejected") {
      console.error(`[Home] ${queryNames[i]} rejected:`, res.reason);
    } else if (res.value.error) {
      console.error(`[Home] ${queryNames[i]} error:`, res.value.error.message);
    }
  });

  const authorData =
    authorDataRes.status === "fulfilled" && authorDataRes.value.data && !authorDataRes.value.error
      ? authorDataRes.value.data
      : [];
  const uniqueAuthors = new Set(authorData.map((d: { author_name: string }) => d.author_name)).size;

  const stats = {
    problems: problemCountRes.status === "fulfilled" && !problemCountRes.value.error ? (problemCountRes.value.count ?? 0) : 0,
    contests: contestCountRes.status === "fulfilled" && !contestCountRes.value.error ? (contestCountRes.value.count ?? 0) : 0,
    discussions: discussionCountRes.status === "fulfilled" && !discussionCountRes.value.error ? (discussionCountRes.value.count ?? 0) : 0,
    authors: uniqueAuthors,
  };

  // Compute problem counts per contest
  const problemCounts: Record<string, number> = {};
  const allSources =
    problemSourcesRes.status === "fulfilled" && problemSourcesRes.value.data
      ? problemSourcesRes.value.data
      : [];
  for (const c of contests) {
    const shortLower = c.short_name.toLowerCase();
    problemCounts[c.id] = allSources.filter(
      (p: { source: string }) => p.source.toLowerCase().includes(shortLower)
    ).length;
  }

  return (
    <HomeContent
      initialProblems={problems}
      initialContests={contests}
      initialStats={stats}
      initialProblemCounts={problemCounts}
    />
  );
}
