"use client";

import { useState } from "react";
import { problems } from "@/data/problems";
import { Problem } from "@/types";

type FormData = {
  title: string;
  source: string;
  year: number;
  tags: string;
  content: string;
  officialSolution: string;
};

const emptyForm: FormData = {
  title: "",
  source: "",
  year: new Date().getFullYear(),
  tags: "",
  content: "",
  officialSolution: "",
};

export default function AdminPage() {
  const [mode, setMode] = useState<"none" | "add" | "edit">("none");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [allProblems, setAllProblems] = useState<Problem[]>(problems);

  const openAddForm = () => {
    setFormData(emptyForm);
    setEditingId(null);
    setMode("add");
  };

  const openEditForm = (problem: Problem) => {
    setFormData({
      title: problem.title,
      source: problem.source,
      year: problem.year,
      tags: problem.tags.join(", "),
      content: problem.content,
      officialSolution: problem.officialSolution,
    });
    setEditingId(problem.id);
    setMode("edit");
  };

  const closeForm = () => {
    setMode("none");
    setEditingId(null);
    setFormData(emptyForm);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const tags = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString().split("T")[0];

    if (mode === "edit" && editingId) {
      setAllProblems(
        allProblems.map((p) =>
          p.id === editingId
            ? {
                ...p,
                title: formData.title,
                source: formData.source,
                year: formData.year,
                tags,
                content: formData.content,
                officialSolution: formData.officialSolution,
                updatedAt: now,
              }
            : p
        )
      );
    } else {
      const newProblem: Problem = {
        id: `custom-${Date.now()}`,
        title: formData.title,
        source: formData.source,
        year: formData.year,
        tags,
        content: formData.content,
        officialSolution: formData.officialSolution,
        createdAt: now,
        updatedAt: now,
      };
      setAllProblems([newProblem, ...allProblems]);
    }

    closeForm();
  };

  const handleDelete = (id: string) => {
    if (confirm("정말 이 문제를 삭제하시겠습니까?")) {
      setAllProblems(allProblems.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <h1 className="text-3xl font-light text-black">관리자 패널</h1>
        <button
          onClick={mode === "none" ? openAddForm : closeForm}
          className="px-5 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider"
        >
          {mode !== "none" ? "취소" : "+ 새 문제 추가"}
        </button>
      </div>

      {/* Add / Edit Problem Form */}
      {mode !== "none" && (
        <div className="border border-neutral-200 p-8 mb-8">
          <h2 className="text-lg font-light text-black mb-6">
            {mode === "edit" ? "문제 수정" : "새 문제 추가"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">제목</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors"
                  placeholder="문제 제목"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">출처</label>
                <input
                  type="text"
                  required
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors"
                  placeholder="예: IPhO 2023, KPhO 2022"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">연도</label>
                <input
                  type="number"
                  required
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                  태그 (쉼표로 구분)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors"
                  placeholder="예: electromagnetism, special-relativity"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                문제 내용 (LaTeX 지원)
              </label>
              <textarea
                required
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none font-mono resize-none transition-colors"
                rows={10}
                placeholder={"LaTeX 수식을 포함한 문제 내용을 입력하세요.\n인라인 수식: $E = mc^2$\n블록 수식: $$\\int_0^\\infty e^{-x} dx = 1$$\n이미지 삽입: ![설명](/images/파일명.svg \"캡션\")"}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider">
                공식 풀이 (LaTeX 지원)
              </label>
              <textarea
                required
                value={formData.officialSolution}
                onChange={(e) => setFormData({ ...formData, officialSolution: e.target.value })}
                className="w-full px-4 py-3 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none font-mono resize-none transition-colors"
                rows={10}
                placeholder="공식 풀이를 입력하세요..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                className="px-6 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider"
              >
                {mode === "edit" ? "수정 완료" : "문제 등록"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium hover:border-black hover:text-black transition-colors uppercase tracking-wider"
              >
                취소
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Problem List */}
      <div className="border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">등록된 문제 ({allProblems.length})</h2>
        </div>
        <div className="divide-y divide-neutral-200">
          {allProblems.map((problem) => (
            <div key={problem.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-black text-sm truncate">{problem.title}</h3>
                <p className="text-xs text-neutral-400 mt-1">{problem.source} ({problem.year})</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {problem.tags.slice(0, 4).map((tag) => (
                    <span key={tag} className="text-xs text-neutral-400">#{tag}</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => openEditForm(problem)}
                  className="px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors uppercase tracking-wider"
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(problem.id)}
                  className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider"
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
