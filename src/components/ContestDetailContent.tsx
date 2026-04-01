"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

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
          <div key={year} className="border border-neutral-200 rounded-xl overflow-hidden">
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
              <div className="px-6 pb-5 space-y-2">
                {yearProblems.map((problem) => (
                  <Link key={problem.id} href={`/problems/${problem.id}`} className="block">
                    <div className="border border-neutral-200 rounded-lg px-4 py-3 hover:border-black transition-all duration-200 bg-white group flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{problem.problem_number}</span>
                          <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors truncate">
                            {problem.title}
                          </h3>
                        </div>
                      </div>
                      <span className="text-[11px] text-neutral-400 shrink-0">{problem.source}</span>
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

interface ContestDetailContentProps {
  contest: Contest;
  contestProblems: Problem[];
}

export default function ContestDetailContent({ contest, contestProblems }: ContestDetailContentProps) {
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

      <div className="border border-neutral-200 rounded-xl p-8 mb-8">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{contest.short_name}</span>
        <h1 className="text-2xl font-light text-black mt-2 mb-3">{contest.name}</h1>
        <p className="text-sm text-neutral-500 mb-4">{contest.description}</p>
        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span>{contestProblems.length}개의 문제</span>
          <span>{contest.years.length}개 연도</span>
          {contest.website && (
            <a href={contest.website} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
              공식 사이트 &#x2197;
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
                <span key={y} className="px-3 py-1 border border-neutral-200 rounded-md text-xs text-neutral-400">{y}</span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
