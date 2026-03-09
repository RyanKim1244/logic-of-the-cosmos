"use client";

import { useState, use } from "react";
import Link from "next/link";
import { problems, discussions } from "@/data/problems";
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  SUBJECT_LABELS,
  SUBJECT_COLORS,
} from "@/types";
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
        <h1 className="text-2xl font-bold text-gray-900 mb-4">문제를 찾을 수 없습니다</h1>
        <Link href="/problems" className="text-cosmos-600 hover:text-cosmos-800">
          &larr; 문제 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  const problemDiscussions = discussions.filter((d) => d.problemId === id);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Breadcrumb */}
      <nav className="mb-6">
        <Link href="/problems" className="text-cosmos-600 hover:text-cosmos-800 text-sm">
          &larr; 문제 목록
        </Link>
      </nav>

      {/* Problem Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${SUBJECT_COLORS[problem.subject]}`}>
            {SUBJECT_LABELS[problem.subject]}
          </span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}>
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-3">{problem.title}</h1>
        <p className="text-gray-500 mb-6">
          {problem.source} &middot; {problem.year}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {problem.tags.map((tag) => (
            <span key={tag} className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">
              #{tag}
            </span>
          ))}
        </div>

        {/* Problem Content */}
        <div className="border-t border-gray-100 pt-6">
          <LatexRenderer content={problem.content} />
        </div>
      </div>

      {/* Solution Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">공식 풀이</h2>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className={`px-5 py-2 rounded-lg font-medium transition-colors ${
              showSolution
                ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                : "bg-cosmos-600 text-white hover:bg-cosmos-700"
            }`}
          >
            {showSolution ? "풀이 숨기기" : "풀이 보기"}
          </button>
        </div>

        {showSolution && (
          <div className="border-t border-gray-100 pt-6">
            <LatexRenderer content={problem.officialSolution} />
          </div>
        )}

        {!showSolution && (
          <p className="text-gray-400 text-sm">
            먼저 직접 풀어본 후 풀이를 확인하세요!
          </p>
        )}
      </div>

      {/* Discussion Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <DiscussionSection problemId={id} initialDiscussions={problemDiscussions} />
      </div>
    </div>
  );
}
