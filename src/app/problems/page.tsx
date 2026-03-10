"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Problem } from "@/types";
import ProblemCard from "@/components/ProblemCard";
import FilterSidebar from "@/components/FilterSidebar";

export default function ProblemsPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchProblems() {
      const { data } = await supabase
        .from("problems")
        .select("*")
        .order("problem_number", { ascending: true });
      if (data) {
        setProblems(data.map((p) => ({
          id: p.id,
          problemNumber: p.problem_number,
          title: p.title,
          source: p.source,
          year: p.year,
          tags: p.tags,
          content: p.content,
          officialSolution: p.official_solution,
          createdAt: p.created_at,
          updatedAt: p.updated_at,
        })));
      }
      setLoading(false);
    }
    fetchProblems();
  }, []);

  const filteredProblems = useMemo(() => {
    return problems.filter((problem) => {
      const matchesTags =
        selectedTags.length === 0 || selectedTags.some((tag) => problem.tags.includes(tag));
      const matchesSource =
        selectedSources.length === 0 || selectedSources.includes(problem.source);
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        problem.title.toLowerCase().includes(query) ||
        problem.source.toLowerCase().includes(query) ||
        problem.tags.some((tag) => tag.toLowerCase().includes(query)) ||
        String(problem.problemNumber).includes(searchQuery);
      return matchesTags && matchesSource && matchesSearch;
    });
  }, [problems, selectedTags, selectedSources, searchQuery]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-neutral-400 text-center py-20 text-sm">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-light text-black mb-10">문제 목록</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar
          selectedTags={selectedTags}
          selectedSources={selectedSources}
          searchQuery={searchQuery}
          onTagChange={setSelectedTags}
          onSourceChange={setSelectedSources}
          onSearchChange={setSearchQuery}
          problems={problems}
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
