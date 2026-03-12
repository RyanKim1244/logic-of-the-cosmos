"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { contests } from "@/data/contests";

interface ContestProgress {
  contestId: string;
  shortName: string;
  totalCount: number;
  solvedCount: number;
}

export default function ContestProgressBars({ solvedProblemIds }: { solvedProblemIds: string[] }) {
  const [progressData, setProgressData] = useState<ContestProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      // Fetch all problems grouped by source to count totals per contest
      const { data: problems } = await supabase
        .from("problems")
        .select("id, source");

      if (cancelled || !problems) {
        setLoading(false);
        return;
      }

      const solvedSet = new Set(solvedProblemIds);

      // Map contest shortNames to their problem counts
      const progress: ContestProgress[] = contests.map((contest) => {
        const contestProblems = problems.filter((p) => {
          const src = p.source.toLowerCase();
          const short = contest.shortName.toLowerCase();
          const name = contest.name.toLowerCase();
          return src.includes(short) || src.includes(name) || src === contest.id;
        });

        const solvedCount = contestProblems.filter((p) => solvedSet.has(p.id)).length;

        return {
          contestId: contest.id,
          shortName: contest.shortName,
          totalCount: contestProblems.length,
          solvedCount,
        };
      }).filter((p) => p.totalCount > 0);

      if (!cancelled) {
        setProgressData(progress);
        setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [solvedProblemIds]);

  if (loading) {
    return (
      <div className="border border-neutral-200 p-6 animate-pulse">
        <div className="h-4 bg-neutral-100 rounded w-40 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-neutral-50 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (progressData.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">대회별 진행률</h2>
      <div className="border border-neutral-200 p-6 space-y-5">
        {progressData.map((item) => {
          const percentage = item.totalCount > 0 ? Math.round((item.solvedCount / item.totalCount) * 100) : 0;

          return (
            <div key={item.contestId}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{item.shortName}</span>
                <span className="text-xs text-neutral-400">
                  {item.solvedCount} / {item.totalCount}
                  <span className="ml-2 text-neutral-300">({percentage}%)</span>
                </span>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${percentage}%`,
                    background: percentage === 100
                      ? "linear-gradient(90deg, #10b981, #059669)"
                      : percentage >= 50
                        ? "linear-gradient(90deg, #3b82f6, #6366f1)"
                        : "linear-gradient(90deg, #6366f1, #8b5cf6)",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
