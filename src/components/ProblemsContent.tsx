"use client";

import { useState, useMemo, useEffect } from "react";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Problem } from "@/types";
import ProblemCard from "@/components/ProblemCard";

interface ProblemsContentProps {
  initialProblems: Problem[];
  initialSolvedCounts: Record<string, number>;
  initialDiscussionCounts: Record<string, number>;
}

export default function ProblemsContent({
  initialProblems,
  initialSolvedCounts,
  initialDiscussionCounts,
}: ProblemsContentProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [problems, setProblems] = useState<Problem[]>(initialProblems);
  const [loading, setLoading] = useState(false);
  const [selectedTags] = useState<string[]>([]);
  const [selectedSources] = useState<string[]>([]);
  const [searchQuery] = useState("");
  const [sortBy] = useState("number");
  const [statusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [solvedCounts, setSolvedCounts] = useState<Record<string, number>>(initialSolvedCounts);
  const [discussionCounts, setDiscussionCounts] = useState<Record<string, number>>(initialDiscussionCounts);
  const PER_PAGE = 20;

  const mapProblem = (p: Record<string, unknown>): Problem => ({
    id: p.id as string,
    problemNumber: p.problem_number as number,
    title: p.title as string,
    source: p.source as string,
    year: p.year as number,
    tags: p.tags as string[],
    content: (p.content as string) || "",
    officialSolution: (p.official_solution as string) || "",
    createdAt: p.created_at as string,
    updatedAt: p.updated_at as string,
  });

  // Seed in-memory cache with server data
  useEffect(() => {
    if (initialProblems.length > 0 && !getCached("problems", true)) {
      setCache("problems", initialProblems);
    }
    if (Object.keys(initialSolvedCounts).length > 0 && !getCached("solvedCounts", true)) {
      setCache("solvedCounts", initialSolvedCounts);
    }
    if (Object.keys(initialDiscussionCounts).length > 0 && !getCached("discussionCounts", true)) {
      setCache("discussionCounts", initialDiscussionCounts);
    }
  }, [initialProblems, initialSolvedCounts, initialDiscussionCounts]);

  const fetchProblems = async (signal?: AbortSignal, isBackground = false) => {
    if (!isBackground) {
      setError(null);
    }

    const cached = getCached<Problem[]>("problems", true);
    if (cached) {
      setProblems(cached);
      if (!isCacheStale("problems")) return;
    }

    try {
      const { data, error: fetchError } = await withRetry(
        () => withTimeout(
          supabase.from("problems").select("id, problem_number, title, source, year, tags, created_at, updated_at").order("problem_number", { ascending: true }),
          8000, signal
        ), 1, 1000, signal
      );
      if (fetchError) {
        if (problems.length === 0) {
          setError(`${t.problemsPage.loadError} (${fetchError.message})`);
        }
      } else if (data && data.length > 0) {
        const mapped = data.map(mapProblem);
        setProblems(mapped);
        setCache("problems", mapped);
      }
    } catch (e) {
      if (signal?.aborted) return;
      if (problems.length === 0) {
        setError(`${t.problemsPage.loadError} (${e instanceof Error ? e.message : "알 수 없는 오류"})`);
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

    // Refresh on mount (stale-while-revalidate)
    fetchProblems(controller.signal, true);
    fetchSolvedCounts(controller.signal);
    fetchDiscussionCounts(controller.signal);

    // Re-fetch when tab becomes visible
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller.abort();
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

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "latest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "most_solved":
          return (solvedCounts[b.id] || 0) - (solvedCounts[a.id] || 0);
        case "most_discussed":
          return (discussionCounts[b.id] || 0) - (discussionCounts[a.id] || 0);
        default:
          return a.problemNumber - b.problemNumber;
      }
    });
  }, [problems, selectedTags, selectedSources, searchQuery, sortBy, statusFilter, user, solvedCounts, discussionCounts]);

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
        <div className="space-y-2 py-8">{[1,2,3,4,5].map(i => <div key={i} className="border border-neutral-200 rounded-xl p-4 animate-pulse"><div className="h-4 bg-neutral-100 rounded w-64 mb-2" /><div className="h-3 bg-neutral-50 rounded w-32" /></div>)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => fetchProblems()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">{t.problemsPage.retry}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="page-header">
        <span className="section-label">Problems</span>
        <h1 className="text-3xl md:text-4xl font-light text-black">{t.problemsPage.title}</h1>
      </div>

      <div className="pb-16">
        <div>
          {filteredProblems.length === 0 ? (
            <div className="text-center py-24 text-neutral-400 border border-neutral-100">
              <p className="text-sm font-medium mb-1">{t.problemsPage.noProblems}</p>
              <p className="text-xs text-neutral-300">{t.problemsPage.resetFilters}</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[11px] text-neutral-400 uppercase tracking-[0.18em]">
                  {t.problemsPage.count.replace("{count}", String(filteredProblems.length))}
                </p>
                {totalPages > 1 && (
                  <p className="text-[11px] text-neutral-400 font-mono">
                    {currentPage} / {totalPages}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                {paginatedProblems.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} solvedCount={solvedCounts[problem.id] || 0} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-10">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="page-btn px-3"
                  >
                    ←
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
                        <span key={page} className="flex items-center gap-1.5">
                          {showEllipsis && <span className="text-neutral-300 text-xs px-1 select-none">···</span>}
                          <button
                            onClick={() => setCurrentPage(page)}
                            className={`page-btn ${page === currentPage ? "active" : ""}`}
                          >
                            {page}
                          </button>
                        </span>
                      );
                    })}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="page-btn px-3"
                  >
                    →
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
