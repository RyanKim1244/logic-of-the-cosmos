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

  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="border border-neutral-200 p-5 sticky top-20">
        {/* Search */}
        <div className="mb-6">
          <label className="block text-xs font-medium text-neutral-500 mb-2 uppercase tracking-wider">검색</label>
          <input
            type="text"
            placeholder="문제 제목, 출처..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors"
          />
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <h3 className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wider">과목</h3>
          <div className="space-y-2">
            {(Object.keys(SUBJECT_LABELS) as Subject[]).map((subject) => (
              <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => toggleSubject(subject)}
                  className="rounded-none border-neutral-400 text-black focus:ring-black"
                />
                <span className="text-sm text-neutral-600">{SUBJECT_LABELS[subject]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-4">
          <h3 className="text-xs font-medium text-neutral-500 mb-3 uppercase tracking-wider">난이도</h3>
          <div className="space-y-2">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((difficulty) => (
              <label key={difficulty} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(difficulty)}
                  onChange={() => toggleDifficulty(difficulty)}
                  className="rounded-none border-neutral-400 text-black focus:ring-black"
                />
                <span className="text-sm text-neutral-600">{DIFFICULTY_LABELS[difficulty]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Reset */}
        {(selectedSubjects.length > 0 || selectedDifficulties.length > 0 || searchQuery) && (
          <button
            onClick={() => {
              onSubjectChange([]);
              onDifficultyChange([]);
              onSearchChange("");
            }}
            className="w-full text-xs text-neutral-500 hover:text-black font-medium py-2 border border-neutral-300 hover:border-black transition-colors uppercase tracking-wider"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  );
}
