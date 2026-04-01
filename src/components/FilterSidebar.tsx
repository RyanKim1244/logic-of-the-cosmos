"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Problem } from "@/types";

export type SortOption = "number" | "latest" | "most_solved" | "most_discussed";
export type StatusFilter = "all" | "solved" | "unsolved" | "bookmarked";

interface FilterSidebarProps {
  selectedTags: string[];
  selectedSources: string[];
  searchQuery: string;
  onTagChange: (tags: string[]) => void;
  onSourceChange: (sources: string[]) => void;
  onSearchChange: (query: string) => void;
  problems?: Problem[];
  sortBy?: SortOption;
  onSortChange?: (sort: SortOption) => void;
  statusFilter?: StatusFilter;
  onStatusFilterChange?: (status: StatusFilter) => void;
}

function Dropdown({
  label,
  items,
  selected,
  onToggle,
  renderItem,
}: {
  label: string;
  items: string[];
  selected: string[];
  onToggle: (item: string) => void;
  renderItem: (item: string) => React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = search
    ? items.filter((item) => item.toLowerCase().includes(search.toLowerCase()))
    : items;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-haspopup="listbox"
        className="w-full flex items-center justify-between px-3 py-2 border border-neutral-200 hover:border-neutral-400 transition-colors bg-white"
      >
        <span className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium">{label}</span>
        <div className="flex items-center gap-1.5">
          {selected.length > 0 && (
            <span className="bg-black text-white text-[10px] px-1.5 py-0.5 font-medium leading-none">
              {selected.length}
            </span>
          )}
          <svg className={`w-3 h-3 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div className="absolute z-20 top-full left-0 right-0 mt-0.5 border border-neutral-200 bg-white shadow-md max-h-56 overflow-hidden flex flex-col">
          {items.length > 6 && (
            <div className="p-2 border-b border-neutral-100">
              <input
                type="text"
                placeholder="검색..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2 py-1.5 text-xs border border-neutral-200 focus:border-black focus:outline-none"
                autoFocus
              />
            </div>
          )}
          <div className="overflow-y-auto">
            {filtered.map((item) => {
              const isSelected = selected.includes(item);
              return (
                <button
                  key={item}
                  onClick={() => onToggle(item)}
                  className={`w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-neutral-50 transition-colors ${
                    isSelected ? "text-black font-medium" : "text-neutral-600"
                  }`}
                >
                  <span className={`w-3 h-3 border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-black bg-black" : "border-neutral-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {renderItem(item)}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-neutral-400 text-center">결과 없음</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "number", label: "번호순" },
  { value: "latest", label: "최신순" },
  { value: "most_solved", label: "많이 푼 순" },
  { value: "most_discussed", label: "토론 많은 순" },
];

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "unsolved", label: "미풀이" },
  { value: "solved", label: "풀이 완료" },
  { value: "bookmarked", label: "북마크" },
];

export default function FilterSidebar({
  selectedTags,
  selectedSources,
  searchQuery,
  onTagChange,
  onSourceChange,
  onSearchChange,
  problems = [],
  sortBy = "number",
  onSortChange,
  statusFilter = "all",
  onStatusFilterChange,
}: FilterSidebarProps) {
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    problems.forEach((p) => p.tags.forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [problems]);

  const allSources = useMemo(() => {
    const sources = new Set<string>();
    problems.forEach((p) => sources.add(p.source));
    return Array.from(sources).sort();
  }, [problems]);

  const toggleTag = (tag: string) => {
    onTagChange(selectedTags.includes(tag) ? selectedTags.filter((t) => t !== tag) : [...selectedTags, tag]);
  };

  const toggleSource = (source: string) => {
    onSourceChange(selectedSources.includes(source) ? selectedSources.filter((s) => s !== source) : [...selectedSources, source]);
  };

  const activeCount = selectedTags.length + selectedSources.length + (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (sortBy !== "number" ? 1 : 0);

  return (
    <aside className="w-full lg:w-52 shrink-0">
      <div className="border border-neutral-200 sticky top-20">
        {/* Header */}
        <div className="px-3 py-2.5 bg-black text-white flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-[0.2em]">필터</span>
          {activeCount > 0 && (
            <span className="inline-flex items-center justify-center w-4 h-4 bg-white text-black text-[10px] font-bold leading-none">
              {activeCount}
            </span>
          )}
        </div>

        <div className="p-3 space-y-3">
          {/* Search */}
          <div className="relative">
            <svg aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="번호, 제목 검색..."
              aria-label="문제 검색"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-7 pr-3 py-1.5 border border-neutral-200 text-[11px] focus:border-black focus:outline-none bg-neutral-50 focus:bg-white placeholder:text-neutral-400"
            />
            {searchQuery && (
              <button onClick={() => onSearchChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-black">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Sort */}
          {onSortChange && (
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1">정렬</p>
              <div className="grid grid-cols-2 gap-0.5">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSortChange(opt.value)}
                    className={`py-1 text-[10px] font-medium transition-colors ${
                      sortBy === opt.value
                        ? "bg-black text-white"
                        : "border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Status Filter */}
          {onStatusFilterChange && (
            <div>
              <p className="text-[10px] font-semibold text-neutral-400 uppercase tracking-[0.18em] mb-1">풀이 상태</p>
              <div className="grid grid-cols-2 gap-0.5">
                {STATUS_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onStatusFilterChange(opt.value)}
                    className={`py-1 text-[10px] font-medium transition-colors ${
                      statusFilter === opt.value
                        ? "bg-black text-white"
                        : "border border-neutral-200 text-neutral-500 hover:border-neutral-400 hover:text-black"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Source Dropdown */}
          <Dropdown
            label="출처"
            items={allSources}
            selected={selectedSources}
            onToggle={toggleSource}
            renderItem={(source) => (
              <span className="flex items-center justify-between w-full">
                <span className="truncate">{source}</span>
                <span className="text-neutral-300 shrink-0 ml-1 font-mono text-[10px]">
                  {problems.filter((p) => p.source === source).length}
                </span>
              </span>
            )}
          />

          {/* Tag Dropdown */}
          <Dropdown
            label="태그"
            items={allTags}
            selected={selectedTags}
            onToggle={toggleTag}
            renderItem={(tag) => <span>#{tag}</span>}
          />

          {/* Selected pills */}
          {(selectedSources.length > 0 || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-1">
              {selectedSources.map((source) => (
                <button key={source} onClick={() => toggleSource(source)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-black text-white text-[10px] hover:bg-neutral-800 transition-colors">
                  {source}
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              {selectedTags.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className="flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-100 text-[10px] text-neutral-700 hover:bg-neutral-200 transition-colors">
                  #{tag}
                  <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => { onTagChange([]); onSourceChange([]); onSearchChange(""); onSortChange?.("number"); onStatusFilterChange?.("all"); }}
              className="w-full text-[10px] text-neutral-400 hover:text-black font-medium py-1.5 border border-neutral-200 hover:border-black transition-all uppercase tracking-widest"
            >
              초기화
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
