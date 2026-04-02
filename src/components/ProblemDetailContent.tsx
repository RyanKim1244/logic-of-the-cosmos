"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Problem } from "@/types";
import { parseMultiLang, getLanguages, getLangLabel } from "@/lib/multilang";
import LatexRenderer from "@/components/LatexRenderer";
import ProblemSourceCard from "@/components/ProblemSourceCard";
import ProblemAI from "@/components/ProblemAI";
import { useLanguage } from "@/context/LanguageContext";

const DiscussionSection = dynamic(() => import("@/components/DiscussionSection"), {
  ssr: false,
  loading: () => (
    <div className="py-12 text-center">
      <div className="inline-flex items-center gap-2 text-neutral-400 text-xs">
        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  ),
});

interface ProblemDetailContentProps {
  initialProblem: Problem;
  initialSolvedCount: number;
  contestId?: string | null;
}

const isLoTC = (source: string) => source.trim().toLowerCase() === "lotc";

export default function ProblemDetailContent({
  initialProblem,
  initialSolvedCount,
  contestId,
}: ProblemDetailContentProps) {
  const { user, toggleSolved, toggleBookmark } = useAuth();
  const { t, locale } = useLanguage();
  const [problem, setProblem] = useState<Problem>(initialProblem);

  // Force refresh when returning from bfcache (fixes disappearing buttons)
  useEffect(() => {
    const handler = (e: PageTransitionEvent) => {
      if (e.persisted) setProblem({ ...initialProblem });
    };
    window.addEventListener("pageshow", handler);
    return () => window.removeEventListener("pageshow", handler);
  }, [initialProblem]);
  const [solvedCount, setSolvedCount] = useState(initialSolvedCount);
  const [showSolution, setShowSolution] = useState(false);
  const [activeLang, setActiveLang] = useState<string | null>(null);

  const id = problem.id;
  const isSolved = user?.solvedProblems.includes(id) ?? false;
  const isBookmarked = user?.bookmarkedProblems.includes(id) ?? false;
  const isOriginal = isLoTC(problem.source);

  // Multi-lang parsing (only used for LoTC problems)
  const titleLangs = useMemo(() => parseMultiLang(problem.title), [problem.title]);
  const contentLangs = useMemo(() => parseMultiLang(problem.content), [problem.content]);
  const solutionLangs = useMemo(() => parseMultiLang(problem.officialSolution), [problem.officialSolution]);

  const availableLangs = useMemo(() => {
    const allKeys = new Set([
      ...Object.keys(titleLangs),
      ...Object.keys(contentLangs),
      ...Object.keys(solutionLangs),
    ]);
    const withContent = [...allKeys].filter(
      (k) => titleLangs[k]?.trim() || contentLangs[k]?.trim() || solutionLangs[k]?.trim()
    );
    return getLanguages(Object.fromEntries(withContent.map((k) => [k, "x"])));
  }, [titleLangs, contentLangs, solutionLangs]);

  const currentLang = activeLang && availableLangs.includes(activeLang)
    ? activeLang
    : availableLangs[0] || "ko";

  const displayTitle = titleLangs[currentLang] || Object.values(titleLangs)[0] || problem.title;
  const displayContent = contentLangs[currentLang] || Object.values(contentLangs)[0] || "";
  const displaySolution = solutionLangs[currentLang] || Object.values(solutionLangs)[0] || "";

  // Background refresh on tab visible
  useEffect(() => {
    let controller = new AbortController();

    async function fetchProblem(sig: AbortSignal) {
      try {
        const { data } = await withRetry(
          () => withTimeout(supabase.from("problems").select("*").eq("id", id).single(), 8000, sig),
          1, 1000, sig
        );
        if (sig.aborted || !data) return;
        setProblem({
          id: data.id,
          problemNumber: data.problem_number,
          title: data.title,
          source: data.source,
          year: data.year,
          tags: data.tags,
          content: data.content,
          officialSolution: data.official_solution,
          problemUrl: data.problem_url ?? null,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });
      } catch { /* keep existing */ }
    }

    async function fetchSolvedCount(sig: AbortSignal) {
      try {
        const { count } = await withTimeout(
          supabase.from("user_solved_problems").select("*", { count: "exact", head: true }).eq("problem_id", id),
          5000, sig
        );
        if (sig.aborted || count === null) return;
        setSolvedCount(count);
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-16">

      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2">
        <Link
          href="/problems"
          className="inline-flex items-center gap-1.5 text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors group"
        >
          <svg className="w-3 h-3 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          문제 목록
        </Link>
        <span className="text-neutral-200 text-xs">/</span>
        {!isOriginal && contestId ? (
          <Link href={`/contests/${contestId}`} className="text-neutral-400 text-xs font-mono hover:text-black transition-colors">
            {problem.source}
          </Link>
        ) : (
          <span className="text-neutral-400 text-xs font-mono">{isOriginal ? "LoTC" : problem.source}</span>
        )}
      </nav>

      {/* Problem Header */}
      <div className="mb-6">
        <div className="h-0.5 bg-black w-12 mb-5" />

        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-mono text-neutral-300 block mb-1.5">
              #{String(problem.problemNumber).padStart(4, "0")}
            </span>
            <h1 className="text-xl sm:text-2xl font-light text-black leading-snug">
              {displayTitle}
            </h1>
          </div>

          {isSolved && (
            <div className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider whitespace-nowrap">{t.problemDetail.solved}</span>
            </div>
          )}
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-5">
          <div className="flex items-center gap-1.5">
            {isOriginal && (
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">{t.problemDetail.lotcOriginal}</span>
            )}
            {!isOriginal && <span className="w-1.5 h-1.5 bg-black rounded-full" />}
            {!isOriginal && contestId ? (
              <Link href={`/contests/${contestId}`} className="text-xs font-medium text-black hover:underline">
                {problem.source}
              </Link>
            ) : !isOriginal ? (
              <span className="text-xs font-medium text-black">{problem.source}</span>
            ) : null}
          </div>
          {solvedCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-neutral-400">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>{solvedCount}명 풀이 완료</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {problem.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {problem.tags.map((tag) => (
              <span key={tag} className="px-3 py-1 border border-neutral-200 rounded-md text-sm text-neutral-500 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {user && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => toggleSolved(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                isSolved
                  ? "bg-emerald-500 text-white hover:bg-emerald-600"
                  : "border border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {isSolved ? (locale === "ko" ? "풀이 완료!" : "Solved!") : (locale === "ko" ? "풀이 완료 표시" : "Mark as Solved")}
            </button>
            <button
              onClick={() => toggleBookmark(id)}
              className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
                isBookmarked
                  ? "bg-amber-500 text-white hover:bg-amber-600"
                  : "border border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
              }`}
            >
              <svg className="w-3.5 h-3.5" fill={isBookmarked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
              {isBookmarked ? (locale === "ko" ? "북마크됨" : "Bookmarked") : (locale === "ko" ? "북마크" : "Bookmark")}
            </button>
          </div>
        )}
      </div>

      <div className="h-px bg-neutral-100 mb-6" />

      {/* LoTC Original: problem text + solution */}
      {isOriginal ? (
        <>
          {/* Problem content */}
          <div className="border border-neutral-200 rounded-xl p-6 sm:p-8 mb-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.2em]">{t.problemDetail.problemStatement}</h2>
              {availableLangs.length > 1 && (
                <div className="flex items-center gap-0 border border-neutral-200">
                  {availableLangs.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setActiveLang(lang)}
                      className={`px-3 py-1.5 text-[10px] font-medium transition-colors ${
                        currentLang === lang
                          ? "bg-black text-white"
                          : "text-neutral-400 hover:text-black"
                      }`}
                    >
                      {getLangLabel(lang)}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <LatexRenderer content={displayContent} />
          </div>

          {/* Official solution */}
          <div className="border border-neutral-200 rounded-xl p-6 sm:p-8 mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-black">공식 풀이</h2>
              <button
                onClick={() => setShowSolution(!showSolution)}
                className={`px-5 py-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  showSolution
                    ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                    : "bg-black text-white hover:bg-neutral-800"
                }`}
              >
                {showSolution ? t.problemDetail.hideSolution : t.problemDetail.showSolution}
              </button>
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${showSolution ? "max-h-[2000px] mt-6 pt-6 border-t border-neutral-100" : "max-h-0"}`}>
              <LatexRenderer content={displaySolution} />
            </div>
          </div>
        </>
      ) : (
        /* External: source link card */
        <ProblemSourceCard
          source={problem.source}
          problemUrl={problem.problemUrl}
          solutionUrl={problem.solutionUrl}
        />
      )}

      {/* AI Learning Assistant */}
      <ProblemAI
        problemTitle={displayTitle}
        problemSource={problem.source}
        problemTags={problem.tags}
        problemContent={displayContent}
      />

      {/* Discussion */}
      <div className="border border-neutral-200 rounded-xl p-5 sm:p-8">
        <DiscussionSection problemId={id} />
      </div>

    </div>
  );
}
