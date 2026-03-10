"use client";

import { useState, useEffect, use, useCallback } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";

interface Contest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  website: string | null;
  years: number[];
}

interface Problem {
  id: string;
  problem_number: number;
  title: string;
  source: string;
  year: number;
}

function YearAccordion({ problemsByYear }: { problemsByYear: { year: number; problems: Problem[] }[] }) {
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());

  const toggle = useCallback((year: number) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }, []);

  return (
    <div className="space-y-3">
      {problemsByYear.map(({ year, problems: yearProblems }) => {
        const isOpen = openYears.has(year);
        return (
          <div key={year} className="border border-neutral-200">
            <button
              onClick={() => toggle(year)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-light text-black">{year}</h2>
                <span className="text-xs text-neutral-400">{yearProblems.length}문제</span>
              </div>
              <svg
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isOpen && (
              <div className="px-6 pb-5 grid md:grid-cols-2 gap-4">
                {yearProblems.map((problem) => (
                  <Link key={problem.id} href={`/problems/${problem.id}`} className="block h-full">
                    <div className="border border-neutral-200 p-5 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col">
                      <div className="flex-1">
                        <span className="text-[10px] text-neutral-300 font-mono">#{problem.problem_number}</span>
                        <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-2 mt-0.5">
                          {problem.title}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">{problem.source}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [contest, setContest] = useState<Contest | null>(null);
  const [contestProblems, setContestProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchData() {
      try {
        const { data: contestData, error: fetchError } = await withRetry(
          () => withTimeout(supabase.from("contests").select("*").eq("id", id).single(), 8000, controller.signal),
          1, 1000, controller.signal
        );

        if (controller.signal.aborted) return;
        if (fetchError) {
          setError(`대회 정보를 불러오는 데 실패했습니다. (${fetchError.message})`);
          setLoading(false);
          return;
        }

        if (contestData) {
          setContest(contestData);

          const { data: problems } = await withTimeout(
            supabase
              .from("problems")
              .select("id, problem_number, title, source, year")
              .ilike("source", `%${contestData.short_name}%`)
              .order("year", { ascending: false }),
            5000, controller.signal
          );

          if (controller.signal.aborted) return;
          if (problems) setContestProblems(problems);
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(`대회 정보를 불러오는 데 실패했습니다. (${e instanceof Error ? e.message : "알 수 없는 오류"})`);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-light text-black mb-4">대회를 찾을 수 없습니다</h1>
        <Link href="/contests" className="text-neutral-500 hover:text-black text-sm transition-colors">
          &larr; 기출문제 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const problemsByYear = contest.years
    .map((year) => ({
      year,
      problems: contestProblems.filter((p) => p.year === year),
    }))
    .filter((group) => group.problems.length > 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <nav className="mb-8">
        <Link href="/contests" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 기출문제
        </Link>
      </nav>

      <div className="border border-neutral-200 p-8 mb-8">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{contest.short_name}</span>
        <h1 className="text-2xl font-light text-black mt-2 mb-3">{contest.name}</h1>
        <p className="text-sm text-neutral-500 mb-4">{contest.description}</p>
        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span>{contestProblems.length}개의 문제</span>
          <span>{contest.years.length}개 연도</span>
          {contest.website && (
            <a href={contest.website} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
              공식 사이트 &nearr;
            </a>
          )}
        </div>
      </div>

      {problemsByYear.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-base">등록된 문제가 없습니다.</p>
          <p className="text-sm mt-2">관리자 페이지에서 문제를 추가해 보세요.</p>
        </div>
      ) : (
        <YearAccordion problemsByYear={problemsByYear} />
      )}

      {contest.years.filter((y) => !problemsByYear.some((g) => g.year === y)).length > 0 && (
        <div className="mt-8 border-t border-neutral-100 pt-6">
          <p className="text-xs text-neutral-400 mb-3">아직 문제가 등록되지 않은 연도:</p>
          <div className="flex flex-wrap gap-2">
            {contest.years
              .filter((y) => !problemsByYear.some((g) => g.year === y))
              .map((y) => (
                <span key={y} className="px-3 py-1 border border-neutral-200 text-xs text-neutral-400">{y}</span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
