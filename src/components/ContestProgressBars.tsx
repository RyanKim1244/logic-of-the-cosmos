"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { contests } from "@/data/contests";

interface ContestProgress {
  contestId: string;
  shortName: string;
  totalCount: number;
  solvedCount: number;
}

function AnimatedBar({ percentage, delay }: { percentage: number; delay: number }) {
  const [width, setWidth] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Trigger animation after mount + staggered delay
    const timer = setTimeout(() => setWidth(percentage), 50 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
      <div
        ref={ref}
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
          background: percentage === 100
            ? "linear-gradient(90deg, #10b981, #059669)"
            : percentage >= 50
              ? "linear-gradient(90deg, #3b82f6, #6366f1)"
              : "linear-gradient(90deg, #6366f1, #8b5cf6)",
        }}
      />
    </div>
  );
}

export default function ContestProgressBars({ solvedProblemIds }: { solvedProblemIds: string[] }) {
  const [progressData, setProgressData] = useState<ContestProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: problems } = await supabase
        .from("problems")
        .select("id, source");

      if (cancelled || !problems) {
        setLoading(false);
        return;
      }

      const solvedSet = new Set(solvedProblemIds);

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
      <section className="mb-8">
        <div className="border border-neutral-200 p-6 animate-pulse">
          <div className="h-4 bg-neutral-100 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-neutral-50 rounded" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (progressData.length === 0) return null;

  const totalSolved = progressData.reduce((s, p) => s + p.solvedCount, 0);
  const totalProblems = progressData.reduce((s, p) => s + p.totalCount, 0);

  return (
    <section className="mb-8">
      <div className="border border-neutral-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">대회별 진행률</h2>
            <span className="text-xs text-neutral-400">
              {totalSolved} / {totalProblems}
            </span>
          </div>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        <div
          className="grid transition-[grid-template-rows] duration-300 ease-in-out"
          style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
        >
          <div className="overflow-hidden">
            <div className="px-6 pb-5 pt-1 space-y-5">
              {progressData.map((item, i) => {
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
                    {isOpen && <AnimatedBar percentage={percentage} delay={i * 80} />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
