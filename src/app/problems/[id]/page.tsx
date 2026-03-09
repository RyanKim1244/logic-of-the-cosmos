"use client";

import { useState, use } from "react";
import Link from "next/link";
import { problems, discussions } from "@/data/problems";
import LatexRenderer from "@/components/LatexRenderer";
import DiscussionSection from "@/components/DiscussionSection";

export default function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [showSolution, setShowSolution] = useState(false);

  const problem = problems.find((p) => p.id === id);

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

  const problemDiscussions = discussions.filter((d) => d.problemId === id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Breadcrumb */}
      <nav className="mb-8">
        <Link href="/problems" className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; 문제 목록
        </Link>
      </nav>

      {/* Problem Header */}
      <div className="border border-neutral-200 p-8 mb-6">
        <h1 className="text-2xl font-light text-black mb-3">{problem.title}</h1>
        <p className="text-neutral-400 mb-6 text-sm">
          {problem.source} &middot; {problem.year}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {problem.tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-neutral-400 text-xs">
              #{tag}
            </span>
          ))}
        </div>

        {/* Problem Content */}
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
              showSolution
                ? "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                : "bg-black text-white hover:bg-neutral-800"
            }`}
          >
            {showSolution ? "풀이 숨기기" : "풀이 보기"}
          </button>
        </div>

        {!showSolution && (
          <p className="text-neutral-400 text-sm">
            먼저 직접 풀어본 후 풀이를 확인하세요!
          </p>
        )}

        <div className={showSolution ? "border-t border-neutral-100 pt-6" : "hidden"}>
          <LatexRenderer content={problem.officialSolution} />
        </div>
      </div>

      {/* Discussion Section */}
      <div className="border border-neutral-200 p-8">
        <DiscussionSection problemId={id} initialDiscussions={problemDiscussions} />
      </div>
    </div>
  );
}
