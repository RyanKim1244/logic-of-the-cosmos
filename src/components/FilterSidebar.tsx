"use client";

import { useMemo } from "react";
import { problems } from "@/data/problems";

interface FilterSidebarProps {
  selectedTags: string[];
  selectedSources: string[];
  searchQuery: string;
  onTagChange: (tags: string[]) => void;
  onSourceChange: (sources: string[]) => void;
  onSearchChange: (query: string) => void;
}

export default function FilterSidebar({
  selectedTags,
  selectedSources,
  searchQuery,
  onTagChange,
  onSourceChange,
  onSearchChange,
}: FilterSidebarProps) {
  // Collect all unique tags and sources
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, []);

  const allSources = useMemo(() => {
    const sources = new Set<string>();
    problems.forEach((p) => sources.add(p.source));
    return Array.from(sources).sort();
  }, []);

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagChange([...selectedTags, tag]);
    }
  };

  const toggleSource = (source: string) => {
    if (selectedSources.includes(source)) {
      onSourceChange(selectedSources.filter((s) => s !== source));
    } else {
      onSourceChange([...selectedSources, source]);
    }
  };

  const activeCount = selectedTags.length + selectedSources.length + (searchQuery ? 1 : 0);

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
                placeholder="제목, 출처, 태그 검색..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors bg-neutral-50 focus:bg-white"
              />
            </div>
          </div>

          {/* Source Filter */}
          <div className="mb-6">
            <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-[0.15em]">출처</h3>
            <div className="space-y-1.5">
              {allSources.map((source) => {
                const isSelected = selectedSources.includes(source);
                return (
                  <button
                    key={source}
                    onClick={() => toggleSource(source)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-all border ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-400"
                    }`}
                  >
                    <span className="text-xs font-medium truncate">{source}</span>
                    <span className={`text-xs ${isSelected ? "text-neutral-300" : "text-neutral-400"}`}>
                      {problems.filter((p) => p.source === source).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tag Filter */}
          <div className="mb-5">
            <h3 className="text-xs font-medium text-neutral-400 mb-3 uppercase tracking-[0.15em]">태그</h3>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-2.5 py-1.5 text-xs transition-all border ${
                      isSelected
                        ? "border-black bg-black text-white"
                        : "border-neutral-200 text-neutral-500 hover:border-neutral-400"
                    }`}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                onTagChange([]);
                onSourceChange([]);
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
