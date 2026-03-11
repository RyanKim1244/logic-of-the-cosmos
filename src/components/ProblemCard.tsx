"use client";

import Link from "next/link";
import { Problem } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { getDisplayText } from "@/lib/multilang";

export default function ProblemCard({ problem, solvedCount = 0 }: { problem: Problem; solvedCount?: number }) {
  const { user } = useAuth();
  const isSolved = user?.solvedProblems.includes(problem.id) ?? false;
  const isBookmarked = user?.bookmarkedProblems.includes(problem.id) ?? false;

  return (
    <Link href={`/problems/${problem.id}`} className="block h-full">
      <div className={`border p-6 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col relative ${
        isSolved ? "border-emerald-300" : "border-neutral-200"
      }`}>
        {/* Status indicators */}
        {(isSolved || isBookmarked) && (
          <div className="absolute top-3 right-3 flex items-center gap-1.5">
            {isSolved && (
              <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center" title="풀이 완료">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
            {isBookmarked && (
              <span className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center" title="북마크">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </span>
            )}
          </div>
        )}

        <div className="flex-1">
          <span className="text-[10px] text-neutral-300 font-mono">#{problem.problemNumber}</span>
          <h3 className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-2 mt-1">
            {getDisplayText(problem.title)}
          </h3>
        </div>

        <div className="flex items-center justify-between mt-3">
          <p className="text-xs text-neutral-400 tracking-wide">{problem.source} &middot; {problem.year}</p>
          {solvedCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-neutral-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
