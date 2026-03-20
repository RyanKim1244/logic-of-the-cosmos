"use client";

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Problem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getDisplayText } from "@/lib/multilang";

export default function ProblemCard({ problem, solvedCount = 0 }: { problem: Problem; solvedCount?: number }) {
  const { user } = useAuth();
  const t = useTranslations();
  const isSolved = user?.solvedProblems.includes(problem.id) ?? false;
  const isBookmarked = user?.bookmarkedProblems.includes(problem.id) ?? false;

  return (
    <Link href={`/problems/${problem.id}`} className="block">
      <div className={`border px-4 py-3 hover:border-black transition-all duration-200 bg-white group flex items-center gap-3 ${
        isSolved ? "border-emerald-300" : "border-neutral-200"
      }`}>
        {/* Status indicators */}
        {(isSolved || isBookmarked) && (
          <div className="flex items-center gap-1 shrink-0">
            {isSolved && (
              <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title={t("problems.solved")}>
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            {isBookmarked && (
              <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center" title={t("problems.bookmark")}>
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </span>
            )}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{problem.problemNumber}</span>
            <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors truncate">
              {getDisplayText(problem.title)}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0 text-[11px] text-neutral-400">
          <span>{problem.source} &middot; {problem.year}</span>
          {solvedCount > 0 && (
            <span className="flex items-center gap-0.5 text-neutral-300">
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {solvedCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
