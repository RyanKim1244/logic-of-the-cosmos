"use client";

import { use } from "react";
import Link from "next/link";
import { contests } from "@/data/contests";
import { problems } from "@/data/problems";

export default function ContestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const contest = contests.find((c) => c.id === id);

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

  // Match problems by shortName in source
  const contestProblems = problems.filter((p) =>
    p.source.toLowerCase().includes(contest.shortName.toLowerCase())
  );

  // Group by year, sorted descending
  const problemsByYear = contest.years
    .map((year) => ({
      year,
      problems: contestProblems.filter((p) => p.year === year),
    }))
    .filter((group) => group.problems.length > 0);

  const totalCount = contestProblems.length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/contests" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 기출문제
        </Link>
      </nav>

      {/* Contest Header */}
      <div className="border border-neutral-200 p-8 mb-8">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
          {contest.shortName}
        </span>
        <h1 className="text-2xl font-light text-black mt-2 mb-3">{contest.name}</h1>
        <p className="text-sm text-neutral-500 mb-4">{contest.description}</p>

        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span>{totalCount}개의 문제</span>
          <span>{contest.years.length}개 연도</span>
          {contest.website && (
            <a
              href={contest.website}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black transition-colors"
            >
              공식 사이트 &nearr;
            </a>
          )}
        </div>
      </div>

      {/* Year sections */}
      {problemsByYear.length === 0 ? (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-base">등록된 문제가 없습니다.</p>
          <p className="text-sm mt-2">관리자 페이지에서 문제를 추가해 보세요.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {problemsByYear.map(({ year, problems: yearProblems }) => (
            <div key={year}>
              <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-light text-black">{year}</h2>
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs text-neutral-400">{yearProblems.length}문제</span>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {yearProblems.map((problem) => (
                  <Link key={problem.id} href={`/problems/${problem.id}`} className="block h-full">
                    <div className="border border-neutral-200 p-5 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col">
                      <div className="flex items-start gap-2.5 flex-1">
                        <span className="text-xs text-neutral-300 font-mono shrink-0 mt-0.5">#{problem.problemNumber}</span>
                        <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
                          {problem.title}
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">
                        {problem.source}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty years */}
      {contest.years.filter((y) => !problemsByYear.some((g) => g.year === y)).length > 0 && (
        <div className="mt-8 border-t border-neutral-100 pt-6">
          <p className="text-xs text-neutral-400 mb-3">아직 문제가 등록되지 않은 연도:</p>
          <div className="flex flex-wrap gap-2">
            {contest.years
              .filter((y) => !problemsByYear.some((g) => g.year === y))
              .map((y) => (
                <span key={y} className="px-3 py-1 border border-neutral-200 text-xs text-neutral-400">
                  {y}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
