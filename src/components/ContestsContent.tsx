"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { useLanguage } from "@/context/LanguageContext";

interface Contest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  website: string | null;
  years: number[];
}

interface ContestsContentProps {
  initialContests: Contest[];
  initialProblemCounts: Record<string, number>;
}

export default function ContestsContent({
  initialContests,
  initialProblemCounts,
}: ContestsContentProps) {
  const { t } = useLanguage();
  const [contests, setContests] = useState<Contest[]>(initialContests);
  const [problemCounts, setProblemCounts] = useState<Record<string, number>>(initialProblemCounts);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialContests.length > 0 && !getCached("contests", true)) {
      setCache("contests", initialContests);
    }
    if (Object.keys(initialProblemCounts).length > 0 && !getCached("contestProblemCounts", true)) {
      setCache("contestProblemCounts", initialProblemCounts);
    }
  }, [initialContests, initialProblemCounts]);

  useEffect(() => {
    let controller = new AbortController();

    const fetchData = async (signal: AbortSignal) => {
      const cachedContests = getCached<Contest[]>("contests", true);
      const cachedCounts = getCached<Record<string, number>>("contestProblemCounts", true);
      if (cachedContests) setContests(cachedContests);
      if (cachedCounts) setProblemCounts(cachedCounts);
      if (cachedContests && cachedCounts && !isCacheStale("contests") && !isCacheStale("contestProblemCounts")) return;

      try {
        const { data: contestsData, error: fetchError } = await withRetry(
          () => withTimeout(supabase.from("contests").select("*"), 8000, signal),
          1, 1000, signal
        );
        if (signal.aborted) return;
        if (fetchError) {
          if (contests.length === 0) setError(`${t.contestsPage.loadError} (${fetchError.message})`);
          return;
        }
        if (contestsData && contestsData.length > 0) {
          setContests(contestsData);
          setCache("contests", contestsData);

          const { data: problems } = await withTimeout(
            supabase.from("problems").select("source"), 5000, signal
          );
          if (signal.aborted) return;
          if (problems) {
            const counts: Record<string, number> = {};
            for (const contest of contestsData) {
              counts[contest.id] = problems.filter((p) =>
                p.source.toLowerCase().includes(contest.short_name.toLowerCase())
              ).length;
            }
            setProblemCounts(counts);
            setCache("contestProblemCounts", counts);
          }
        }
      } catch (e) {
        if (signal.aborted) return;
        if (contests.length === 0) setError(`${t.contestsPage.loadError} (${e instanceof Error ? e.message : "알 수 없는 오류"})`);
      }
    };

    // Refresh on mount (stale-while-revalidate)
    fetchData(controller.signal);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        fetchData(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">{t.contestsPage.retry}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="page-header">
        <span className="section-label">Archives</span>
        <h1 className="text-3xl md:text-4xl font-light text-black mb-2">{t.contestsPage.title}</h1>
        <p className="text-sm text-neutral-400">{t.contestsPage.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pb-16">
        {[...contests].sort((a, b) => a.name.localeCompare(b.name)).map((contest) => {
          const yearRange =
            contest.years.length > 0
              ? `${contest.years[contest.years.length - 1]}–${contest.years[0]}`
              : "";

          return (
            <Link key={contest.id} href={`/contests/${contest.id}`} className="block h-full">
              <div className="contest-card-v2 group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-semibold text-neutral-300 uppercase tracking-[0.2em]">
                    {contest.short_name}
                  </span>
                  {contest.website && (
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" title="공식 웹사이트 있음" />
                  )}
                </div>
                <h2 className="text-[15px] font-medium text-neutral-800 group-hover:text-black transition-colors mb-2 flex-1 leading-snug">
                  {contest.name}
                </h2>
                <p className="text-xs text-neutral-400 mb-4 line-clamp-2 leading-relaxed">
                  {contest.description}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-neutral-100 group-hover:border-neutral-200 transition-colors">
                  <span className="text-xs font-mono text-neutral-400">{yearRange}</span>
                  <span className="text-xs font-semibold text-neutral-500 group-hover:text-black transition-colors">
                    {problemCounts[contest.id] || 0}{t.contestsPage.problems}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
