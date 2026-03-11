"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Problem } from "@/types";
import { parseMultiLang, getLanguages, getLangLabel } from "@/lib/multilang";
import LatexRenderer from "@/components/LatexRenderer";

const DiscussionSection = dynamic(() => import("@/components/DiscussionSection"), {
  ssr: false,
  loading: () => <p className="text-neutral-400 text-center py-8 text-sm">토론 로딩 중...</p>,
});
const SolutionSection = dynamic(() => import("@/components/SolutionSection"), {
  ssr: false,
  loading: () => <p className="text-neutral-400 text-center py-8 text-sm">풀이 로딩 중...</p>,
});

interface ProblemDetailContentProps {
  initialProblem: Problem;
  initialSolvedCount: number;
}

export default function ProblemDetailContent({
  initialProblem,
  initialSolvedCount,
}: ProblemDetailContentProps) {
  const { user, toggleSolved, toggleBookmark } = useAuth();
  const [showSolution, setShowSolution] = useState(false);
  const [problem, setProblem] = useState<Problem>(initialProblem);
  const [solvedCount, setSolvedCount] = useState(initialSolvedCount);
  const [activeLang, setActiveLang] = useState<string | null>(null);
  const id = problem.id;
  const isSolved = user?.solvedProblems.includes(id) ?? false;
  const isBookmarked = user?.bookmarkedProblems.includes(id) ?? false;

  // Parse multi-lang for title, content, solution
  const titleLangs = useMemo(() => parseMultiLang(problem.title), [problem.title]);
  const contentLangs = useMemo(() => parseMultiLang(problem.content), [problem.content]);
  const solutionLangs = useMemo(() => parseMultiLang(problem.officialSolution), [problem.officialSolution]);

  // Merge available languages from all fields
  const availableLangs = useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(titleLangs),
      ...Object.keys(contentLangs),
      ...Object.keys(solutionLangs),
    ]);
    // Filter to only include languages that have at least some content
    const withContent = [...allKeys].filter(
      (k) => (titleLangs[k]?.trim() || contentLangs[k]?.trim() || solutionLangs[k]?.trim())
    );
    return getLanguages(Object.fromEntries(withContent.map((k) => [k, "x"])));
  }, [titleLangs, contentLangs, solutionLangs]);

  const currentLang = activeLang && availableLangs.includes(activeLang)
    ? activeLang
    : availableLangs[0] || "ko";

  const displayTitle = titleLangs[currentLang] || Object.values(titleLangs)[0] || problem.title;
  const displayContent = contentLangs[currentLang] || Object.values(contentLangs)[0] || "";
  const displaySolution = solutionLangs[currentLang] || Object.values(solutionLangs)[0] || "";

  // Background refresh when tab becomes visible
  useEffect(() => {
    let controller = new AbortController();
    async function fetchProblem(sig: AbortSignal) {
      try {
        const { data } = await withRetry(
          () => withTimeout(supabase.from("problems").select("*").eq("id", id).single(), 8000, sig),
          1, 1000, sig
        );
        if (sig.aborted) return;
        if (data) {
          setProblem({
            id: data.id, problemNumber: data.problem_number, title: data.title,
            source: data.source, year: data.year, tags: data.tags, content: data.content,
            officialSolution: data.official_solution, createdAt: data.created_at, updatedAt: data.updated_at,
          });
        }
      } catch { /* keep existing */ }
    }
    async function fetchSolvedCount(sig: AbortSignal) {
      try {
        const { count } = await withTimeout(
          supabase.from("user_solved_problems").select("*", { count: "exact", head: true }).eq("problem_id", id),
          5000, sig
        );
        if (sig.aborted) return;
        if (count !== null) setSolvedCount(count);
      } catch { /* ignore */ }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller.abort();
        controller = new AbortController();
        fetchProblem(controller.signal);
        fetchSolvedCount(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [id]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/problems" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 문제 목록
        </Link>
      </nav>

      {/* Problem Header */}
      <div className={`border p-5 sm:p-8 mb-6 relative ${isSolved ? "border-emerald-300 bg-emerald-50/30" : "border-neutral-200"}`}>
        {isSolved && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 solved-badge">
            <span className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">풀이 완료</span>
          </div>
        )}

        <span className="text-[10px] text-neutral-300 font-mono">#{problem.problemNumber}</span>
        <h1 className="text-lg sm:text-xl font-light text-black mt-1 mb-3 pr-16 sm:pr-0">{displayTitle}</h1>
        <div className="flex items-center gap-3 text-xs text-neutral-400 mb-4">
          <span>{problem.source} &middot; {problem.year}</span>
          {solvedCount > 0 && (
            <>
              <span className="text-neutral-200">&middot;</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {solvedCount}명 풀이 완료
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {problem.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-neutral-400 text-xs">#{tag}</span>
          ))}
        </div>

        {user && (
          <div className="flex items-center gap-2 sm:gap-3 mb-6 flex-wrap">
            <button
              onClick={() => toggleSolved(id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                isSolved ? "bg-emerald-500 text-white hover:bg-emerald-600" : "border border-neutral-300 text-neutral-500 hover:border-black hover:text-black"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isSolved ? "풀이 완료!" : "풀이 완료 표시"}
            </button>
            <button
              onClick={() => toggleBookmark(id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                isBookmarked ? "bg-amber-500 text-white hover:bg-amber-600" : "border border-neutral-300 text-neutral-500 hover:border-black hover:text-black"
              }`}
            >
              <svg className="w-4 h-4" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isBookmarked ? "북마크됨" : "북마크"}
            </button>
          </div>
        )}

        <div className="border-t border-neutral-100 pt-6">
          {availableLangs.length > 1 && (
            <div className="flex items-center gap-0 mb-4 border-b border-neutral-200">
              {availableLangs.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                    currentLang === lang
                      ? "border-black text-black"
                      : "border-transparent text-neutral-400 hover:text-neutral-600"
                  }`}
                >
                  {getLangLabel(lang)}
                </button>
              ))}
            </div>
          )}
          <LatexRenderer content={displayContent} />
        </div>
      </div>

      {/* Solution Section */}
      <div className="border border-neutral-200 p-6 mb-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-light text-black">공식 풀이</h2>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className={`px-5 py-2 text-xs font-medium transition-colors uppercase tracking-wider ${
              showSolution ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {showSolution ? "풀이 숨기기" : "풀이 보기"}
          </button>
        </div>

        <div className={showSolution ? "border-t border-neutral-100 pt-6 mt-4 animate-fade-slide-up" : "hidden"}>
          <LatexRenderer content={displaySolution} />
        </div>
      </div>

      {/* User Solutions Section */}
      <div className="border border-neutral-200 p-5 sm:p-8 mb-6">
        <SolutionSection problemId={id} />
      </div>

      {/* Discussion Section */}
      <div className="border border-neutral-200 p-5 sm:p-8">
        <DiscussionSection problemId={id} />
      </div>
    </div>
  );
}
