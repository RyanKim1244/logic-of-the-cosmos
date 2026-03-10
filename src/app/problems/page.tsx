"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { Problem } from "@/types";
import ProblemCard from "@/components/ProblemCard";
import FilterSidebar from "@/components/FilterSidebar";
import type { SortOption, StatusFilter } from "@/components/FilterSidebar";

export default function ProblemsPage() {
  const { user } = useAuth();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("number");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [solvedCounts, setSolvedCounts] = useState<Record<string, number>>({});
  const [discussionCounts, setDiscussionCounts] = useState<Record<string, number>>({});
  const PER_PAGE = 20;

  const mapProblem = (p: Record<string, unknown>): Problem => ({
    id: p.id as string,
    problemNumber: p.problem_number as number,
    title: p.title as string,
    source: p.source as string,
    year: p.year as number,
    tags: p.tags as string[],
    content: p.content as string,
    officialSolution: p.official_solution as string,
    createdAt: p.created_at as string,
    updatedAt: p.updated_at as string,
  });

  const fetchProblems = async (signal?: AbortSignal, isBackground = false) => {
    if (!isBackground) {
      setError(null);
    }

    // Show stale cache immediately, only show loading if no data at all
    const cached = getCached<Problem[]>("problems", true);
    if (cached) {
      setProblems(cached);
      setLoading(false);
      // If cache is still fresh, skip re-fetch
      if (!isCacheStale("problems")) return;
    } else if (!isBackground) {
      setLoading(true);
    }

    try {
      const { data, error: fetchError } = await withRetry(
        () => withTimeout(
          supabase.from("problems").select("*").order("problem_number", { ascending: true }),
          8000, signal
        ), 1, 1000, signal
      );
      if (fetchError) {
        // Only show error if we have no existing data
        if (problems.length === 0) {
          setError(`문제 목록을 불러오는 데 실패했습니다. (${fetchError.message})`);
        }
      } else if (data && data.length > 0) {
        const mapped = data.map(mapProblem);
        setProblems(mapped);
        setCache("problems", mapped);
      }
    } catch (e) {
      if (signal?.aborted) return;
      // Only show error if we have no existing data
      if (problems.length === 0) {
        setError(`문제 목록을 불러오는 데 실패했습니다. (${e instanceof Error ? e.message : "알 수 없는 오류"})`);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    let controller = new AbortController();
    async function fetchSolvedCounts(sig: AbortSignal) {
      const cached = getCached<Record<string, number>>("solvedCounts", true);
      if (cached) {
        setSolvedCounts(cached);
        if (!isCacheStale("solvedCounts")) return;
      }
      try {
        const { data } = await withTimeout(
          supabase.from("user_solved_problems").select("problem_id"),
          5000, sig
        );
        if (sig.aborted) return;
        if (data) {
          const counts: Record<string, number> = {};
          for (const row of data) {
            counts[row.problem_id] = (counts[row.problem_id] || 0) + 1;
          }
          setSolvedCounts(counts);
          setCache("solvedCounts", counts);
        }
      } catch { /* ignore */ }
    }
    async function fetchDiscussionCounts(sig: AbortSignal) {
      const cached = getCached<Record<string, number>>("discussionCounts", true);
      if (cached) {
        setDiscussionCounts(cached);
        if (!isCacheStale("discussionCounts")) return;
      }
      try {
        const { data } = await withTimeout(
          supabase.from("discussions").select("problem_id"),
          5000, sig
        );
        if (sig.aborted) return;
        if (data) {
          const counts: Record<string, number> = {};
          for (const row of data) {
            counts[row.problem_id] = (counts[row.problem_id] || 0) + 1;
          }
          setDiscussionCounts(counts);
          setCache("discussionCounts", counts);
        }
      } catch { /* ignore */ }
    }

    fetchProblems(controller.signal);
    fetchSolvedCounts(controller.signal);
    fetchDiscussionCounts(controller.signal);

    // Re-fetch when tab becomes visible (keeps data fresh)
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        fetchProblems(controller.signal, true);
        fetchSolvedCounts(controller.signal);
        fetchDiscussionCounts(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const filteredProblems = useMemo(() => {
    const filtered = problems.filter((problem) => {
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

      // Status filter
      let matchesStatus = true;
      if (statusFilter === "solved") {
        matchesStatus = user?.solvedProblems.includes(problem.id) ?? false;
      } else if (statusFilter === "unsolved") {
        matchesStatus = !user?.solvedProblems.includes(problem.id);
      } else if (statusFilter === "bookmarked") {
        matchesStatus = user?.bookmarkedProblems.includes(problem.id) ?? false;
      }

      return matchesTags && matchesSource && matchesSearch && matchesStatus;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "most_solved":
          return (solvedCounts[b.id] || 0) - (solvedCounts[a.id] || 0);
        case "most_discussed":
          return (discussionCounts[b.id] || 0) - (discussionCounts[a.id] || 0);
        default: // "number"
          return a.problemNumber - b.problemNumber;
      }
    });
  }, [problems, selectedTags, selectedSources, searchQuery, sortBy, statusFilter, user, solvedCounts, discussionCounts]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedTags, selectedSources, searchQuery, sortBy, statusFilter]);

  const totalPages = Math.ceil(filteredProblems.length / PER_PAGE);
  const paginatedProblems = filteredProblems.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-neutral-400 text-center py-20 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => fetchProblems()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
        </div>
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
          sortBy={sortBy}
          onSortChange={setSortBy}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
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
                {totalPages > 1 && (
                  <span className="ml-2">· 페이지 {currentPage}/{totalPages}</span>
                )}
              </p>
              <div className="grid md:grid-cols-2 gap-5">
                {paginatedProblems.map((problem) => (
                  <div key={problem.id} className="problem-card-hover">
                    <ProblemCard problem={problem} solvedCount={solvedCounts[problem.id] || 0} />
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-neutral-200 text-sm hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200"
                  >
                    &larr;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter((page) => {
                      if (totalPages <= 7) return true;
                      if (page === 1 || page === totalPages) return true;
                      if (Math.abs(page - currentPage) <= 1) return true;
                      return false;
                    })
                    .map((page, i, arr) => {
                      const showEllipsis = i > 0 && page - arr[i - 1] > 1;
                      return (
                        <span key={page} className="flex items-center gap-2">
                          {showEllipsis && <span className="text-neutral-300 text-sm px-1">···</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`w-9 h-9 text-sm border transition-colors ${
                              page === currentPage
                                ? "bg-black text-white border-black"
                                : "border-neutral-200 hover:border-black"
                            }`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-neutral-200 text-sm hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200"
                  >
                    &rarr;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
