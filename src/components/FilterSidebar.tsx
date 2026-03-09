"use client";

import { Subject, Difficulty, SUBJECT_LABELS, DIFFICULTY_LABELS } from "@/types";

interface FilterSidebarProps {
  selectedSubjects: Subject[];
  selectedDifficulties: Difficulty[];
  searchQuery: string;
  onSubjectChange: (subjects: Subject[]) => void;
  onDifficultyChange: (difficulties: Difficulty[]) => void;
  onSearchChange: (query: string) => void;
}

const SUBJECT_ICONS: Record<Subject, string> = {
  physics: "⚛",
  chemistry: "⚗",
  biology: "🧬",
  math: "∑",
  "earth-science": "🌍",
};

const DIFFICULTY_DOTS: Record<Difficulty, string> = {
  easy: "bg-emerald-400",
  medium: "bg-amber-400",
  hard: "bg-orange-500",
  olympiad: "bg-red-500",
};

export default function FilterSidebar({
  selectedSubjects,
  selectedDifficulties,
  searchQuery,
  onSubjectChange,
  onDifficultyChange,
  onSearchChange,
}: FilterSidebarProps) {
  const toggleSubject = (subject: Subject) => {
    if (selectedSubjects.includes(subject)) {
      onSubjectChange(selectedSubjects.filter((s) => s !== subject));
    } else {
      onSubjectChange([...selectedSubjects, subject]);
    }
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    if (selectedDifficulties.includes(difficulty)) {
      onDifficultyChange(selectedDifficulties.filter((d) => d !== difficulty));
    } else {
      onDifficultyChange([...selectedDifficulties, difficulty]);
    }
  };

  const activeCount = selectedSubjects.length + selectedDifficulties.length + (searchQuery ? 1 : 0);

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="border border-neutral-200 sticky top-20 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 bg-black text-white flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.2em]">필터</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-white text-black text-xs flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </div>

        <div className="p-5">
          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="문제 제목, 출처, 태그..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors bg-neutral-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Subject Filter */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-[0.15em]">과목</h3>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(SUBJECT_LABELS) as Subject[]).map((subject) => {
                const isSelected = selectedSubjects.includes(subject);
                return (
                  <button
                    key={subject}
                    onClick={() => toggleSubject(subject)}
                    className={`flex items-center gap-2 px-3 py-2.5 text-sm transition-all border ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    <span className="text-xs">{SUBJECT_ICONS[subject]}</span>
                    <span className="text-xs font-medium">{SUBJECT_LABELS[subject]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Difficulty Filter */}
          <div className="mb-5">
            <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-[0.15em]">난이도</h3>
            <div className="space-y-1.5">
              {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((difficulty) => {
                const isSelected = selectedDifficulties.includes(difficulty);
                return (
                  <button
                    key={difficulty}
                    onClick={() => toggleDifficulty(difficulty)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all border ${
                      isSelected
                        ? "border-black bg-neutral-900 text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOTS[difficulty]}`} />
                    <span className="text-xs font-medium">{DIFFICULTY_LABELS[difficulty]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                onSubjectChange([]);
                onDifficultyChange([]);
                onSearchChange("");
              }}
              className="w-full text-xs text-neutral-400 hover:text-black font-medium py-2.5 border border-neutral-200 hover:border-black transition-all uppercase tracking-widest"
            >
              필터 초기화
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
