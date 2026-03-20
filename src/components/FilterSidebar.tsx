"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
        aria-label={selected.length > 0 ? t("problems.filterSelected", { label, count: selected.length }) : t("problems.filterLabel", { label })}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-neutral-200 text-sm hover:border-neutral-400 transition-colors bg-white"
      >
        <span className="text-neutral-500 text-xs uppercase tracking-wider">{label}</span>
        <div className="flex items-center gap-2">
          {selected.length > 0 && (
            <span className="bg-black text-white text-[10px] w-4.5 h-4.5 flex items-center justify-center px-1.5 py-0.5 font-medium">
              {selected.length}
            </span>
          )}
          <svg className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div role="listbox" aria-label={t("problems.listLabel", { label })} className="absolute z-20 top-full left-0 right-0 mt-1 border border-neutral-200 bg-white shadow-lg max-h-64 overflow-hidden flex flex-col">
          {items.length > 6 && (
            <div className="p-2 border-b border-neutral-100">
              <input
                type="text"
                placeholder={t("problems.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs border border-neutral-200 focus:border-black focus:outline-none"
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
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs hover:bg-neutral-50 transition-colors ${
                    isSelected ? "text-black font-medium" : "text-neutral-600"
                  }`}
                >
                  <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                    isSelected ? "border-black bg-black" : "border-neutral-300"
                  }`}>
                    {isSelected && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  {renderItem(item)}
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="px-3 py-3 text-xs text-neutral-400 text-center">{t("problems.noResults")}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

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
  const t = useTranslations();

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "number", label: t("problems.sortNumber") },
    { value: "latest", label: t("problems.sortLatest") },
    { value: "most_solved", label: t("problems.sortMostSolved") },
    { value: "most_discussed", label: t("problems.sortMostDiscussed") },
  ];

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: t("problems.statusAll") },
    { value: "unsolved", label: t("problems.statusUnsolved") },
    { value: "solved", label: t("problems.statusSolved") },
    { value: "bookmarked", label: t("problems.statusBookmarked") },
  ];

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

  const activeCount = selectedTags.length + selectedSources.length + (searchQuery ? 1 : 0) + (statusFilter !== "all" ? 1 : 0) + (sortBy !== "number" ? 1 : 0);

  return (
    <aside className="w-full lg:w-72 shrink-0">
      <div className="border border-neutral-200 sticky top-20">
        {/* Header */}
        <div className="px-5 py-4 bg-black text-white flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-[0.2em]">{t("problems.filterHeader")}</span>
          {activeCount > 0 && (
            <span className="w-5 h-5 bg-white text-black text-xs flex items-center justify-center font-medium">
              {activeCount}
            </span>
          )}
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          <div className="relative">
            <svg aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={t("problems.filterSearch")}
              aria-label={t("problems.filterSearch")}
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-3 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors bg-neutral-50 focus:bg-white"
            />
          </div>

          {/* Sort */}
          {onSortChange && (
            <div>
              <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-1.5">{t("problems.sort")}</label>
              <div className="grid grid-cols-2 gap-1">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onSortChange(opt.value)}
                    className={`px-2 py-2 text-[11px] font-medium tracking-wider transition-colors ${
                      sortBy === opt.value
                        ? "bg-black text-white"
                        : "border border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
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
              <label className="block text-xs text-neutral-400 uppercase tracking-wider mb-1.5">{t("problems.status")}</label>
              <div className="grid grid-cols-2 gap-1">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => onStatusFilterChange(opt.value)}
                    className={`px-2 py-2 text-[11px] font-medium tracking-wider transition-colors ${
                      statusFilter === opt.value
                        ? "bg-black text-white"
                        : "border border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
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
            label={t("problems.filterSources")}
            items={allSources}
            selected={selectedSources}
            onToggle={toggleSource}
            renderItem={(source) => (
              <span className="flex items-center justify-between w-full">
                <span className="truncate">{source}</span>
                <span className="text-neutral-400 shrink-0 ml-2">
                  {problems.filter((p) => p.source === source).length}
                </span>
              </span>
            )}
          />

          {/* Tag Dropdown */}
          <Dropdown
            label={t("problems.filterTags")}
            items={allTags}
            selected={selectedTags}
            onToggle={toggleTag}
            renderItem={(tag) => <span>#{tag}</span>}
          />

          {/* Selected pills */}
          {(selectedSources.length > 0 || selectedTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {selectedSources.map((source) => (
                <button
                  key={source}
                  onClick={() => toggleSource(source)}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-[10px] text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  {source}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
              {selectedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className="flex items-center gap-1 px-2 py-1 bg-neutral-100 text-[10px] text-neutral-600 hover:bg-neutral-200 transition-colors"
                >
                  #{tag}
                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ))}
            </div>
          )}

          {/* Reset */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                onTagChange([]);
                onSourceChange([]);
                onSearchChange("");
                onSortChange?.("number");
                onStatusFilterChange?.("all");
              }}
              className="w-full text-xs text-neutral-400 hover:text-black font-medium py-2.5 border border-neutral-200 hover:border-black transition-all uppercase tracking-widest"
            >
              {t("problems.filterClear")}
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
