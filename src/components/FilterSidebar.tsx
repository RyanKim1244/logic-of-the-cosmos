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
      <div className="bg-white rounded-xl border border-gray-200 p-5 sticky top-20">
        {/* Search */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">검색</label>
          <input
            type="text"
            placeholder="문제 제목, 출처..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Subject Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">과목</h3>
          <div className="space-y-2">
            {(Object.keys(SUBJECT_LABELS) as Subject[]).map((subject) => (
              <label key={subject} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject)}
                  onChange={() => toggleSubject(subject)}
                  className="rounded text-cosmos-600 focus:ring-cosmos-500"
                />
                <span className="text-sm text-gray-600">{SUBJECT_LABELS[subject]}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">난이도</h3>
          <div className="space-y-2">
            {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map((difficulty) => (
              <label key={difficulty} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedDifficulties.includes(difficulty)}
                  onChange={() => toggleDifficulty(difficulty)}
                  className="rounded text-cosmos-600 focus:ring-cosmos-500"
                />
                <span className="text-sm text-gray-600">{DIFFICULTY_LABELS[difficulty]}</span>
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
            className="w-full text-sm text-cosmos-600 hover:text-cosmos-800 font-medium py-2 border border-cosmos-200 rounded-lg hover:bg-cosmos-50 transition-colors"
          >
            필터 초기화
          </button>
        )}
      </div>
    </aside>
  );
}
