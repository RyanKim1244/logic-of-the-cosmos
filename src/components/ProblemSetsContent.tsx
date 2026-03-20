"use client";

import { useState, useEffect } from "react";
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { ProblemSet } from "@/types";

interface ProblemOption {
  id: string;
  problem_number: number;
  title: string;
  source: string;
}

export default function ProblemSetsContent() {
  const t = useTranslations();
  const { user } = useAuth();
  const [sets, setSets] = useState<ProblemSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newTimeLimit, setNewTimeLimit] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [selectedProblems, setSelectedProblems] = useState<ProblemOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ProblemOption[]>([]);
  const [searching, setSearching] = useState(false);

  const fetchSets = async () => {
    const { data } = await supabase
      .from("problem_sets")
      .select("id, title, description, owner_id, is_public, time_limit_minutes, created_at")
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch problem counts and owner names
    const ownerIds = [...new Set(data.map((s) => s.owner_id))];
    const [itemsRes, profilesRes] = await Promise.allSettled([
      supabase.from("problem_set_items").select("set_id"),
      ownerIds.length > 0
        ? supabase.from("profiles").select("id, name").in("id", ownerIds)
        : Promise.resolve({ data: [] }),
    ]);

    const itemCounts: Record<string, number> = {};
    if (itemsRes.status === "fulfilled" && itemsRes.value.data) {
      for (const item of itemsRes.value.data) {
        itemCounts[item.set_id] = (itemCounts[item.set_id] || 0) + 1;
      }
    }

    const ownerMap = new Map<string, string>();
    if (profilesRes.status === "fulfilled" && profilesRes.value.data) {
      for (const p of profilesRes.value.data as { id: string; name: string }[]) {
        ownerMap.set(p.id, p.name);
      }
    }

    setSets(
      data.map((s) => ({
        id: s.id,
        title: s.title,
        description: s.description || "",
        ownerId: s.owner_id,
        ownerName: ownerMap.get(s.owner_id) || t("common.unknown"),
        isPublic: s.is_public,
        timeLimitMinutes: s.time_limit_minutes,
        problemCount: itemCounts[s.id] || 0,
        createdAt: s.created_at,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchSets();
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    const isNumeric = /^\d+$/.test(query);

    let queryBuilder = supabase
      .from("problems")
      .select("id, problem_number, title, source")
      .limit(10);

    if (isNumeric) {
      queryBuilder = queryBuilder.eq("problem_number", parseInt(query));
    } else {
      queryBuilder = queryBuilder.ilike("title", `%${query}%`);
    }

    const { data } = await queryBuilder;
    if (data) {
      const selectedIds = new Set(selectedProblems.map((p) => p.id));
      setSearchResults(data.filter((p) => !selectedIds.has(p.id)));
    }
    setSearching(false);
  };

  const addProblem = (problem: ProblemOption) => {
    setSelectedProblems([...selectedProblems, problem]);
    setSearchResults(searchResults.filter((p) => p.id !== problem.id));
    setSearchQuery("");
  };

  const removeProblem = (problemId: string) => {
    setSelectedProblems(selectedProblems.filter((p) => p.id !== problemId));
  };

  const handleCreate = async () => {
    if (!user || !newTitle.trim() || selectedProblems.length === 0) return;
    setCreating(true);

    const timeLimitNum = newTimeLimit ? parseInt(newTimeLimit) : null;

    const { data, error } = await supabase
      .from("problem_sets")
      .insert({
        title: newTitle.trim(),
        description: newDesc.trim(),
        owner_id: user.id,
        is_public: isPublic,
        time_limit_minutes: timeLimitNum,
      })
      .select("id")
      .single();

    if (!error && data) {
      // Insert problem items
      const items = selectedProblems.map((p, i) => ({
        set_id: data.id,
        problem_id: p.id,
        order_index: i,
      }));
      await supabase.from("problem_set_items").insert(items);

      setNewTitle("");
      setNewDesc("");
      setNewTimeLimit("");
      setIsPublic(true);
      setSelectedProblems([]);
      setShowCreate(false);
      fetchSets();
    }
    setCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-light tracking-tight">{t("problemSets.title")}</h1>
          <p className="text-sm text-neutral-400 mt-1">{t("problemSets.subtitle")}</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            {showCreate ? t("common.cancel") : t("problemSets.create")}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border border-neutral-200 p-6 mb-8 animate-fade-slide-up">
          <h3 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-4">{t("problemSets.newSet")}</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("problemSets.setName")}
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t("problemSets.description")}
              rows={2}
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none resize-none"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">{t("problemSets.timeLimit")}</label>
                <input
                  type="number"
                  value={newTimeLimit}
                  onChange={(e) => setNewTimeLimit(e.target.value)}
                  placeholder="120"
                  min="1"
                  className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span className="text-sm text-neutral-600">{t("problemSets.public")}</span>
                </label>
              </div>
            </div>

            {/* Problem search */}
            <div>
              <label className="text-xs text-neutral-400 block mb-2">{t("problemSets.addProblems")}</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("problemSets.searchPlaceholder")}
                className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
              />
              {searching && <p className="text-xs text-neutral-400 mt-1">{t("common.loading")}</p>}
              {searchResults.length > 0 && (
                <div className="border border-neutral-200 mt-1 max-h-48 overflow-y-auto">
                  {searchResults.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addProblem(p)}
                      className="w-full text-left px-4 py-2.5 hover:bg-neutral-50 transition-colors border-b border-neutral-100 last:border-0"
                    >
                      <span className="text-[10px] text-neutral-300 font-mono mr-2">#{p.problem_number}</span>
                      <span className="text-sm">{p.title}</span>
                      <span className="text-xs text-neutral-400 ml-2">{p.source}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected problems */}
            {selectedProblems.length > 0 && (
              <div>
                <label className="text-xs text-neutral-400 block mb-2">
                  {t("problemSets.selectedProblems")} ({selectedProblems.length})
                </label>
                <div className="space-y-1">
                  {selectedProblems.map((p, i) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between border border-neutral-200 px-4 py-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-300 font-mono w-6">{i + 1}.</span>
                        <span className="text-[10px] text-neutral-300 font-mono">#{p.problem_number}</span>
                        <span className="text-sm truncate">{p.title}</span>
                      </div>
                      <button
                        onClick={() => removeProblem(p.id)}
                        className="text-neutral-300 hover:text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleCreate}
              disabled={creating || !newTitle.trim() || selectedProblems.length === 0}
              className="px-6 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              {creating ? t("problemSets.creating") : `${t("problemSets.createSet")} (${selectedProblems.length}${t("problemSets.problems")})`}
            </button>
          </div>
        </div>
      )}

      {/* Sets List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-200 p-6 animate-pulse">
              <div className="h-5 bg-neutral-100 rounded w-48 mb-3" />
              <div className="h-4 bg-neutral-50 rounded w-72" />
            </div>
          ))}
        </div>
      ) : sets.length === 0 ? (
        <div className="border border-neutral-200 p-12 text-center">
          <p className="text-neutral-400 text-sm">{t("problemSets.empty")}</p>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-black hover:underline mt-3 inline-block"
            >
              {t("problemSets.createFirst")} &rarr;
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {sets.map((set) => (
            <Link
              key={set.id}
              href={`/problem-sets/${set.id}`}
              className="block border border-neutral-200 p-6 hover:border-black transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-medium">{set.title}</h3>
                    {!set.isPublic && (
                      <span className="text-[10px] px-1.5 py-0.5 border border-neutral-200 text-neutral-400 uppercase">
                        {t("problemSets.private")}
                      </span>
                    )}
                  </div>
                  {set.description && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-1">{set.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-xs text-neutral-400">
                    <span>{set.ownerName}</span>
                    <span>{set.problemCount || 0}{t("problemSets.problems")}</span>
                    {set.timeLimitMinutes && (
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {set.timeLimitMinutes}{t("problemSets.minutes")}
                      </span>
                    )}
                    <span className="text-neutral-300">
                      {new Date(set.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                <svg className="w-5 h-5 text-neutral-300 group-hover:text-black transition-colors shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
