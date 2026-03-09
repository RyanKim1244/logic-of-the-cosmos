"use client";

import { useState } from "react";
import { problems } from "@/data/problems";
import {
  Problem,
  Subject,
  Difficulty,
  SUBJECT_LABELS,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  SUBJECT_COLORS,
} from "@/types";

export default function AdminPage() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    source: "",
    year: new Date().getFullYear(),
    subject: "physics" as Subject,
    difficulty: "medium" as Difficulty,
    tags: "",
    content: "",
    officialSolution: "",
  });
  const [previewMode, setPreviewMode] = useState(false);
  const [allProblems, setAllProblems] = useState<Problem[]>(problems);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newProblem: Problem = {
      id: `custom-${Date.now()}`,
      title: formData.title,
      source: formData.source,
      year: formData.year,
      subject: formData.subject,
      difficulty: formData.difficulty,
      tags: formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
      content: formData.content,
      officialSolution: formData.officialSolution,
      createdAt: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString().split("T")[0],
    };

    setAllProblems([newProblem, ...allProblems]);
    setFormData({
      title: "",
      source: "",
      year: new Date().getFullYear(),
      subject: "physics",
      difficulty: "medium",
      tags: "",
      content: "",
      officialSolution: "",
    });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 이 문제를 삭제하시겠습니까?")) {
      setAllProblems(allProblems.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">관리자 패널</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-cosmos-600 text-white rounded-lg font-medium hover:bg-cosmos-700 transition-colors"
        >
          {showForm ? "취소" : "+ 새 문제 추가"}
        </button>
      </div>

      {/* Add Problem Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">새 문제 추가</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                  placeholder="문제 제목"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">출처</label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                  placeholder="예: IPhO 2023, KPhO 2022"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">과목</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value as Subject })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                >
                  {(Object.keys(SUBJECT_LABELS) as Subject[]).map((s) => (
                    <option key={s} value={s}>{SUBJECT_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">난이도</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                >
                  {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((d) => (
                    <option key={d} value={d}>{DIFFICULTY_LABELS[d]}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                태그 (쉼표로 구분)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                placeholder="예: electromagnetism, special-relativity"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  문제 내용 (LaTeX 지원)
                </label>
                <button
                  type="button"
                  onClick={() => setPreviewMode(!previewMode)}
                  className="text-xs text-cosmos-600 hover:text-cosmos-800"
                >
                  {previewMode ? "편집" : "미리보기"}
                </button>
              </div>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                rows={10}
                placeholder="LaTeX 수식을 포함한 문제 내용을 입력하세요.&#10;인라인 수식: $E = mc^2$&#10;블록 수식: $$\int_0^\infty e^{-x} dx = 1$$"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                공식 풀이 (LaTeX 지원)
              </label>
              <textarea
                required
                value={formData.officialSolution}
                onChange={(e) => setFormData({ ...formData, officialSolution: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none font-mono text-sm resize-none"
                rows={10}
                placeholder="공식 풀이를 입력하세요..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-cosmos-600 text-white rounded-lg font-medium hover:bg-cosmos-700 transition-colors"
              >
                문제 등록
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Problem List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h2 className="font-semibold text-gray-700">등록된 문제 ({allProblems.length})</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {allProblems.map((problem) => (
            <div key={problem.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${SUBJECT_COLORS[problem.subject]}`}>
                    {SUBJECT_LABELS[problem.subject]}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}>
                    {DIFFICULTY_LABELS[problem.difficulty]}
                  </span>
                </div>
                <h3 className="font-medium text-gray-900 truncate">{problem.title}</h3>
                <p className="text-sm text-gray-500">{problem.source} ({problem.year})</p>
              </div>
              <button
                onClick={() => handleDelete(problem.id)}
                className="ml-4 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
