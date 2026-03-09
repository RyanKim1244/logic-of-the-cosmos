"use client";

import { useState, useMemo } from "react";
import { problems } from "@/data/problems";
import ProblemCard from "@/components/ProblemCard";
import FilterSidebar from "@/components/FilterSidebar";
import { Subject, Difficulty } from "@/types";

export default function ProblemsPage() {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesSubject =
        selectedSubjects.length === 0 || selectedSubjects.includes(problem.subject);
      const matchesDifficulty =
        selectedDifficulties.length === 0 || selectedDifficulties.includes(problem.difficulty);
      const matchesSearch =
        !searchQuery ||
        problem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSubject && matchesDifficulty && matchesSearch;
    });
  }, [selectedSubjects, selectedDifficulties, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-light text-black mb-10">문제 목록</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          selectedSubjects={selectedSubjects}
          selectedDifficulties={selectedDifficulties}
          searchQuery={searchQuery}
          onSubjectChange={setSelectedSubjects}
          onDifficultyChange={setSelectedDifficulties}
          onSearchChange={setSearchQuery}
        />

        <div className="flex-1">
          {filteredProblems.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <p className="text-base">검색 결과가 없습니다.</p>
              <p className="text-sm mt-2">필터를 조정해 보세요.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-neutral-400 mb-4 uppercase tracking-wider">
                {filteredProblems.length}개의 문제
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {filteredProblems.map((problem) => (
                  <div key={problem.id} className="problem-card-hover">
                    <ProblemCard problem={problem} />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
