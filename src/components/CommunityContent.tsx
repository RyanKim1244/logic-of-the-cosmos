"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, invalidateCache, isCacheStale } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LatexRenderer from "@/components/LatexRenderer";

interface Topic {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author_name: string;
  tags: string[];
  created_at: string;
  upvotes: number;
  downvotes: number;
}

interface CommunityContentProps {
  initialTopics: Topic[];
  initialCommentCounts: Record<string, number>;
}

export default function CommunityContent({
  initialTopics,
  initialCommentCounts,
}: CommunityContentProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"latest" | "popular">("latest");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [allTopics, setAllTopics] = useState<Topic[]>(initialTopics);
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>(initialCommentCounts);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PER_PAGE = 20;

  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTags, setNewTags] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialTopics.length > 0 && !getCached("communityTopics", true)) {
      setCache("communityTopics", initialTopics);
    }
    if (Object.keys(initialCommentCounts).length > 0 && !getCached("communityCommentCounts", true)) {
      setCache("communityCommentCounts", initialCommentCounts);
    }
  }, [initialTopics, initialCommentCounts]);

  useEffect(() => {
    let controller = new AbortController();
    async function fetchTopics(sig: AbortSignal) {
      const cachedTopics = getCached<Topic[]>("communityTopics", true);
      const cachedCounts = getCached<Record<string, number>>("communityCommentCounts", true);
      if (cachedTopics) setAllTopics(cachedTopics);
      if (cachedCounts) setCommentCounts(cachedCounts);
      if (cachedTopics && cachedCounts && !isCacheStale("communityTopics") && !isCacheStale("communityCommentCounts")) return;

      try {
        const { data: topics, error: fetchError } = await withRetry(
          () => withTimeout(
            supabase.from("topics").select("*").order("created_at", { ascending: false }),
            8000, sig
          ), 1, 1000, sig
        );

        if (sig.aborted) return;
        if (fetchError) {
          if (allTopics.length === 0) setError("토픽을 불러오는 데 실패했습니다.");
          setLoadingTopics(false);
          return;
        }

        if (topics && topics.length > 0) {
          setAllTopics(topics);
          setCache("communityTopics", topics);

          const topicIds = topics.map((t) => t.id);
          if (topicIds.length > 0) {
            const { data: comments } = await withTimeout(
              supabase.from("topic_comments").select("topic_id").in("topic_id", topicIds),
              5000, sig
            );
            if (sig.aborted) return;
            const counts: Record<string, number> = {};
            if (comments) {
              for (const c of comments) {
                counts[c.topic_id] = (counts[c.topic_id] || 0) + 1;
              }
            }
            setCommentCounts(counts);
            setCache("communityCommentCounts", counts);
          }
        }
      } catch {
        if (sig.aborted) return;
        if (allTopics.length === 0) setError("토픽을 불러오는 데 실패했습니다.");
      }
      setLoadingTopics(false);
    }

    // Refresh on mount (stale-while-revalidate)
    fetchTopics(controller.signal);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller.abort();
        controller = new AbortController();
        fetchTopics(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  const filteredTopics = useMemo(() => {
    const filtered = allTopics.filter((topic) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        topic.title.toLowerCase().includes(q) ||
        topic.content.toLowerCase().includes(q) ||
        topic.tags.some((t) => t.toLowerCase().includes(q)) ||
        topic.author_name.toLowerCase().includes(q)
      );
    });

    return filtered.sort((a, b) => {
      if (sortBy === "popular") return b.upvotes - a.upvotes;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [allTopics, searchQuery, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortBy]);

  const totalPages = Math.ceil(filteredTopics.length / PER_PAGE);
  const paginatedTopics = filteredTopics.slice(
    (currentPage - 1) * PER_PAGE,
    currentPage * PER_PAGE
  );

  const handleCreateTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const tags = newTags.split(",").map((t) => t.trim()).filter(Boolean);
    const { data, error } = await supabase
      .from("topics")
      .insert({
        title: newTitle.trim(),
        content: newContent.trim(),
        author_id: user?.id || null,
        author_name: user ? user.name : "Guest",
        tags,
      })
      .select()
      .single();

    if (!error && data) {
      setAllTopics([data, ...allTopics]);
      setCommentCounts({ ...commentCounts, [data.id]: 0 });
      setNewTitle("");
      setNewContent("");
      setNewTags("");
      setShowCreateForm(false);
      invalidateCache("communityTopics");
      invalidateCache("communityCommentCounts");
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0];

  if (loadingTopics) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-3 py-8">{[1,2,3].map(i => <div key={i} className="border border-neutral-200 rounded-xl p-5 animate-pulse"><div className="h-5 bg-neutral-100 rounded w-48 mb-3" /><div className="h-4 bg-neutral-50 rounded w-full mb-2" /><div className="h-3 bg-neutral-50 rounded w-32" /></div>)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center py-20">
          <p className="text-red-500 text-sm mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-3xl font-light text-black mb-2">{t.communityPage.title}</h1>
          <p className="text-sm text-neutral-400">{t.communityPage.subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors shrink-0"
        >
          {showCreateForm ? t.common.cancel : t.communityPage.newTopic}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form onSubmit={handleCreateTopic} className="border border-neutral-200 rounded-xl p-6 mb-8">
          <h2 className="text-sm font-medium text-black mb-4 uppercase tracking-widest">{t.communityPage.createTopic}</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-1.5">{t.communityPage.topicTitle}</label>
              <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder={t.communityPage.topicTitle} required className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-1.5">{t.communityPage.topicContent}</label>
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder={t.communityPage.topicContent} required rows={5} className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors resize-none" />
            </div>
            <div>
              <label className="block text-xs text-neutral-400 uppercase tracking-widest mb-1.5">
                {t.communityPage.topicTags}
              </label>
              <input type="text" value={newTags} onChange={(e) => setNewTags(e.target.value)} placeholder={t.communityPage.topicTags} className="w-full px-4 py-2.5 border border-neutral-200 text-sm focus:border-black focus:outline-none transition-colors" />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-neutral-400">
                작성자: <span className="text-neutral-600">{user ? user.name : "Guest"}</span>
              </span>
              <button type="submit" disabled={!newTitle.trim() || !newContent.trim()} className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                {t.common.create}
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder={t.communityPage.search} className="w-full pl-10 pr-4 py-2.5 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none transition-colors" />
        </div>
        <div className="flex border border-neutral-200 rounded-lg overflow-hidden">
          <button onClick={() => setSortBy("latest")} className={`px-4 py-2.5 text-xs font-medium tracking-wider transition-colors ${sortBy === "latest" ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>{t.communityPage.latest}</button>
          <button onClick={() => setSortBy("popular")} className={`px-4 py-2.5 text-xs font-medium tracking-wider transition-colors ${sortBy === "popular" ? "bg-black text-white" : "text-neutral-500 hover:text-black"}`}>{t.communityPage.popular}</button>
        </div>
      </div>

      <p className="text-xs text-neutral-400 mb-4 uppercase tracking-wider">
        {filteredTopics.length} {t.communityPage.topics}
        {totalPages > 1 && (
          <span className="ml-2">· 페이지 {currentPage}/{totalPages}</span>
        )}
      </p>

      {/* Topic List */}
      <div className="space-y-3">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16 border border-neutral-200 rounded-xl">
            <p className="text-neutral-400 text-sm">{t.communityPage.noResults}</p>
          </div>
        ) : (
          paginatedTopics.map((topic) => (
            <Link key={topic.id} href={`/community/${topic.id}`} className="block border border-neutral-200 rounded-xl p-5 hover:border-black transition-all group">
              <div className="flex gap-4">
                <div className="flex flex-col items-center shrink-0 pt-0.5 gap-0.5">
                  <svg className="w-4 h-4 text-neutral-300 group-hover:text-orange-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                  </svg>
                  <span className="text-xs font-semibold text-neutral-500 tabular-nums">{topic.upvotes - (topic.downvotes || 0)}</span>
                  <svg className="w-4 h-4 text-neutral-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-medium text-black group-hover:text-neutral-700 transition-colors mb-1.5 line-clamp-1">{topic.title}</h2>
                  <div className="text-sm text-neutral-500 line-clamp-2 mb-3 leading-relaxed">
                    <LatexRenderer content={topic.content} />
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {topic.tags.map((tag) => (<span key={tag} className="text-xs text-neutral-400">#{tag}</span>))}
                    <span className="text-xs text-neutral-300">|</span>
                    <span className="text-xs text-neutral-400">{topic.author_name}</span>
                    <span className="text-xs text-neutral-300">&middot;</span>
                    <span className="text-xs text-neutral-400">{formatDate(topic.created_at)}</span>
                    <span className="text-xs text-neutral-300">&middot;</span>
                    <span className="text-xs text-neutral-400">{t.communityPage.replies} {commentCounts[topic.id] || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-10">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200"
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
                    className={`w-9 h-9 text-sm border rounded-lg transition-colors ${
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
            className="px-3 py-2 border border-neutral-200 rounded-lg text-sm hover:border-black transition-colors disabled:opacity-30 disabled:hover:border-neutral-200"
          >
            &rarr;
          </button>
        </div>
      )}
    </div>
  );
}
