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
    <Link href={`/problems/${problem.id}`} className="block group">
      <div className={`problem-card-v2 flex items-center gap-4 px-5 py-4 ${isSolved ? "is-solved" : ""}`}>

        {/* Problem number */}
        <span className="text-[11px] text-neutral-300 font-mono w-9 shrink-0 tabular-nums select-none">
          {String(problem.problemNumber).padStart(3, "0")}
        </span>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-[13.5px] font-medium text-neutral-700 group-hover:text-black transition-colors truncate leading-snug">
            {getDisplayText(problem.title)}
          </h3>
          {problem.tags?.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {problem.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="tag-pill">{tag}</span>
              ))}
              {problem.tags.length > 3 && (
                <span className="text-[10px] text-neutral-300 self-center">+{problem.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>

        {/* Right side metadata */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Status badges */}
          {(isSolved || isBookmarked) && (
            <div className="flex items-center gap-1">
              {isSolved && (
                <span className="solved-badge w-4 h-4 bg-emerald-500 flex items-center justify-center shrink-0" title="풀이 완료">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              )}
              {isBookmarked && (
                <span className="w-4 h-4 bg-amber-400 flex items-center justify-center shrink-0" title="북마크">
                  <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </span>
              )}
            </div>
          )}

          <span className="text-[11px] text-neutral-400 tabular-nums whitespace-nowrap">
            {problem.source.toLowerCase() === "lotc" ? "LoTC" : problem.source}
          </span>

          {solvedCount > 0 && (
            <span className="hidden sm:flex items-center gap-1 text-[11px] text-neutral-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {solvedCount}
            </span>
          )}

          <span className="text-neutral-200 group-hover:text-neutral-500 transition-colors">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}
