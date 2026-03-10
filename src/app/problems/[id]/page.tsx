"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { supabase, withTimeout } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Problem } from "@/types";
import LatexRenderer from "@/components/LatexRenderer";
import DiscussionSection from "@/components/DiscussionSection";
import SolutionSection from "@/components/SolutionSection";

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user, toggleSolved, toggleBookmark } = useAuth();
  const [showSolution, setShowSolution] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [solvedCount, setSolvedCount] = useState(0);
  const isSolved = user?.solvedProblems.includes(id) ?? false;
  const isBookmarked = user?.bookmarkedProblems.includes(id) ?? false;

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProblem() {
      try {
        const { data, error: fetchError } = await withTimeout(
          supabase.from("problems").select("*").eq("id", id).single(),
          5000, controller.signal
        );
        if (controller.signal.aborted) return;
        if (fetchError) {
          setError(`문제를 불러오는 데 실패했습니다. (${fetchError.message})`);
        } else if (data) {
          setProblem({
            id: data.id, problemNumber: data.problem_number, title: data.title,
            source: data.source, year: data.year, tags: data.tags, content: data.content,
            officialSolution: data.official_solution, createdAt: data.created_at, updatedAt: data.updated_at,
          });
        }
      } catch (e) {
        if (controller.signal.aborted) return;
        setError(`문제를 불러오는 데 실패했습니다. (${e instanceof Error ? e.message : "알 수 없는 오류"})`);
      } finally {
        setLoading(false);
      }
    }
    async function fetchSolvedCount() {
      try {
        const { count } = await withTimeout(
          supabase.from("user_solved_problems").select("*", { count: "exact", head: true }).eq("problem_id", id),
          5000, controller.signal
        );
        if (controller.signal.aborted) return;
        if (count !== null) setSolvedCount(count);
      } catch { /* ignore */ }
    }
    fetchProblem();
    fetchSolvedCount();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-sm mb-4">{error}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-light text-black mb-4">문제를 찾을 수 없습니다</h1>
        <Link href="/problems" className="text-neutral-500 hover:text-black text-sm transition-colors">
          &larr; 문제 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/problems" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 문제 목록
        </Link>
      </nav>

      {/* Problem Header */}
      <div className={`border p-8 mb-6 relative ${isSolved ? "border-emerald-300 bg-emerald-50/30" : "border-neutral-200"}`}>
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
        <h1 className="text-2xl font-light text-black mt-1 mb-3">{problem.title}</h1>
        <div className="flex items-center gap-3 text-sm text-neutral-400 mb-4">
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
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => toggleSolved(id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
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
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium uppercase tracking-wider transition-all ${
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
          <LatexRenderer content={problem.content} />
        </div>
      </div>

      {/* Solution Section */}
      <div className="border border-neutral-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-light text-black">공식 풀이</h2>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className={`px-5 py-2 text-xs font-medium transition-colors uppercase tracking-wider ${
              showSolution ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200" : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {showSolution ? "풀이 숨기기" : "풀이 보기"}
          </button>
        </div>

        {!showSolution && (
          <p className="text-neutral-400 text-sm">먼저 직접 풀어본 후 풀이를 확인하세요!</p>
        )}

        <div className={showSolution ? "border-t border-neutral-100 pt-6" : "hidden"}>
          <LatexRenderer content={problem.officialSolution} />
        </div>
      </div>

      {/* User Solutions Section */}
      <div className="border border-neutral-200 p-8 mb-6">
        <SolutionSection problemId={id} />
      </div>

      {/* Discussion Section */}
      <div className="border border-neutral-200 p-8">
        <DiscussionSection problemId={id} />
      </div>
    </div>
  );
}
