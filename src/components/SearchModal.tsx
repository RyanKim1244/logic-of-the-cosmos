"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase, withTimeout } from "@/lib/supabase";

interface SearchResult {
  type: "problem" | "topic";
  id: string;
  title: string;
  subtitle: string;
}

export default function SearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent toggles
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const searchControllerRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    // Abort previous search request
    searchControllerRef.current?.abort();

    if (!q.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    const controller = new AbortController();
    searchControllerRef.current = controller;
    const searchTerm = `%${q}%`;
    const numericQuery = q.trim().replace(/^#/, "");
    const isNumericSearch = /^\d+$/.test(numericQuery);

    try {
      const problemQuery = isNumericSearch
        ? supabase.from("problems").select("id, problem_number, title, source, year")
            .or(`problem_number.eq.${numericQuery},title.ilike.${searchTerm},source.ilike.${searchTerm}`)
            .limit(5)
        : supabase.from("problems").select("id, problem_number, title, source, year")
            .or(`title.ilike.${searchTerm},source.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(5);

      const [problemsRes, topicsRes] = await Promise.all([
        withTimeout(problemQuery, 3000, controller.signal),
        withTimeout(
          supabase.from("topics").select("id, title, author_name")
            .or(`title.ilike.${searchTerm},content.ilike.${searchTerm}`)
            .limit(3),
          3000, controller.signal
        ),
      ]);

      if (controller.signal.aborted) return;

      const items: SearchResult[] = [];
      if (problemsRes.data) {
        for (const p of problemsRes.data) {
          items.push({ type: "problem", id: p.id, title: p.title, subtitle: `#${p.problem_number} · ${p.source} · ${p.year}` });
        }
      }
      if (topicsRes.data) {
        for (const t of topicsRes.data) {
          items.push({ type: "topic", id: t.id, title: t.title, subtitle: `커뮤니티 · ${t.author_name}` });
        }
      }
      setResults(items);
      setSelectedIndex(0);
    } catch { /* aborted or timeout */ }
    setSearching(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 200);
    return () => clearTimeout(timer);
  }, [query, search]);

  const navigate = (result: SearchResult) => {
    onClose();
    if (result.type === "problem") {
      router.push(`/problems/${result.id}`);
    } else {
      router.push(`/community/${result.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      navigate(results[selectedIndex]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-backdrop" />
      <div
        className="relative w-full max-w-lg bg-white border border-neutral-200 shadow-2xl animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center border-b border-neutral-200 px-4">
          <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="번호, 제목, 출처, 토픽 검색..."
            className="flex-1 px-3 py-4 text-sm focus:outline-none"
          />
          <kbd className="text-[10px] text-neutral-400 border border-neutral-200 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        {query.trim() && (
          <div className="max-h-80 overflow-y-auto">
            {searching ? (
              <p className="text-sm text-neutral-400 text-center py-8">검색 중...</p>
            ) : results.length === 0 ? (
              <p className="text-sm text-neutral-400 text-center py-8">검색 결과가 없습니다.</p>
            ) : (
              <div className="py-2">
                {results.map((result, i) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigate(result)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-colors ${
                      i === selectedIndex ? "bg-neutral-100" : ""
                    }`}
                  >
                    <span className={`text-[10px] font-medium uppercase tracking-widest px-1.5 py-0.5 border ${
                      result.type === "problem"
                        ? "text-blue-600 border-blue-200"
                        : "text-purple-600 border-purple-200"
                    }`}>
                      {result.type === "problem" ? "문제" : "토픽"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      <p className="text-xs text-neutral-400 truncate">{result.subtitle}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="py-8 text-center">
            <p className="text-xs text-neutral-400">문제 번호, 제목, 출처, 토픽으로 검색하세요</p>
            <p className="text-[10px] text-neutral-300 mt-2">
              <kbd className="border border-neutral-200 px-1 py-0.5 rounded">↑</kbd>{" "}
              <kbd className="border border-neutral-200 px-1 py-0.5 rounded">↓</kbd> 이동{" "}
              <kbd className="border border-neutral-200 px-1 py-0.5 rounded">Enter</kbd> 선택
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
