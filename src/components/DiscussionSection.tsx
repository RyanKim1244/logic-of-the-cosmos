"use client";

import { useState, useEffect, useRef } from "react";
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Discussion {
  id: string;
  problem_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
}

interface DiscussionSectionProps {
  problemId: string;
}

export default function DiscussionSection({ problemId }: DiscussionSectionProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const authorName = user ? user.name : "Guest";

  useEffect(() => {
    const controller = new AbortController();
    async function fetchDiscussions() {
      try {
        const { data } = await withRetry(
          () => withTimeout(
            supabase.from("discussions").select("*").eq("problem_id", problemId).or("is_solution.is.null,is_solution.eq.false").order("created_at", { ascending: true }),
            8000, controller.signal
          ), 1, 1000, controller.signal
        );
        if (!controller.signal.aborted && data) setDiscussions(data);
      } catch { /* ignore */ }
    }
    fetchDiscussions();
    return () => controller.abort();
  }, [problemId]);

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      const el = sectionRef.current;
      if (window.MathJax.typesetClear) {
        window.MathJax.typesetClear([el]);
      }
      window.MathJax.typesetPromise([el]).catch(console.error);
    }
  }, [discussions]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("discussions")
      .insert({
        problem_id: problemId,
        author_id: user?.id || null,
        author_name: authorName,
        content: newComment.trim(),
        parent_id: null,
      })
      .select()
      .single();

    if (!error && data) {
      setDiscussions([...discussions, data]);
      setNewComment("");
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    const { data, error } = await supabase
      .from("discussions")
      .insert({
        problem_id: problemId,
        author_id: user?.id || null,
        author_name: authorName,
        content: replyContent.trim(),
        parent_id: replyTo,
      })
      .select()
      .single();

    if (!error && data) {
      setDiscussions([...discussions, data]);
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (!confirm("Delete this comment?")) return;
    const { error } = await supabase.from("discussions").delete().eq("id", id);
    if (!error) {
      // Also remove replies to this comment
      setDiscussions(discussions.filter((d) => d.id !== id && d.parent_id !== id));
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0];
  const topLevel = discussions.filter((d) => d.parent_id === null);
  const getReplies = (parentId: string) => discussions.filter((d) => d.parent_id === parentId);

  return (
    <div ref={sectionRef} className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-light text-black">{t("discussions.title")}</h2>
        <span className="text-xs text-neutral-400">{discussions.length} {t("community.comments")}</span>
      </div>

      {/* New comment form */}
      <div className="border border-neutral-200 p-5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="text-xs font-medium text-black">{authorName}</span>
          {!user && (
            <span className="text-xs text-neutral-400">({t("discussions.loginToComment")})</span>
          )}
        </div>
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t("discussions.writeComment")}
            className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none resize-none text-xs transition-colors bg-neutral-50 focus:bg-white"
            rows={4}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t("discussions.submit")}
            </button>
          </div>
        </form>
      </div>

      {/* Discussion list */}
      <div className="space-y-4">
        {topLevel.length === 0 && (
          <p className="text-neutral-400 text-center py-8 text-xs">{t("discussions.noDiscussions")}</p>
        )}
        {topLevel.map((disc) => (
          <div key={disc.id} className="border border-neutral-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 bg-neutral-800 text-white flex items-center justify-center text-xs font-medium shrink-0">
                {disc.author_name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                {disc.author_id ? (
                  <Link href={`/profile/${disc.author_id}`} className="font-medium text-black text-xs hover:underline">{disc.author_name}</Link>
                ) : (
                  <span className="font-medium text-black text-xs">{disc.author_name}</span>
                )}
                <span className="text-xs text-neutral-400 ml-2">{formatDate(disc.created_at)}</span>
              </div>
            </div>
            <div className="text-neutral-700 mb-3 whitespace-pre-wrap text-xs leading-relaxed pl-11">{disc.content}</div>
            <div className="pl-11 flex items-center gap-3">
              <button
                onClick={() => {
                  setReplyTo(replyTo === disc.id ? null : disc.id);
                  setReplyContent("");
                }}
                className="text-xs text-neutral-400 hover:text-black font-medium uppercase tracking-wider transition-colors"
              >
                {replyTo === disc.id ? t("solutions.cancel") : t("discussions.reply")}
              </button>
              {(disc.author_id === user?.id || user?.is_admin) && (
                <button
                  onClick={() => handleDeleteComment(disc.id)}
                  className="text-xs text-neutral-400 hover:text-red-500 font-medium uppercase tracking-wider transition-colors"
                >
                  Delete{user?.is_admin && disc.author_id !== user?.id ? " (Admin)" : ""}
                </button>
              )}
            </div>

            {/* Replies */}
            {getReplies(disc.id).map((reply) => (
              <div key={reply.id} className="ml-11 mt-4 pl-4 border-l-2 border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-medium shrink-0">
                    {reply.author_name.charAt(0).toUpperCase()}
                  </span>
                  {reply.author_id ? (
                    <Link href={`/profile/${reply.author_id}`} className="font-medium text-neutral-700 text-xs hover:underline">{reply.author_name}</Link>
                  ) : (
                    <span className="font-medium text-neutral-700 text-xs">{reply.author_name}</span>
                  )}
                  <span className="text-xs text-neutral-400">{formatDate(reply.created_at)}</span>
                </div>
                <div className="text-neutral-600 text-xs whitespace-pre-wrap leading-relaxed pl-8">{reply.content}</div>
                {(reply.author_id === user?.id || user?.is_admin) && (
                  <button
                    onClick={() => handleDeleteComment(reply.id)}
                    className="text-xs text-neutral-400 hover:text-red-500 font-medium uppercase tracking-wider transition-colors mt-1 pl-8"
                  >
                    Delete{user?.is_admin && reply.author_id !== user?.id ? " (Admin)" : ""}
                  </button>
                )}
              </div>
            ))}

            {/* Reply form */}
            {replyTo === disc.id && (
              <form onSubmit={handleSubmitReply} className="ml-11 mt-4 pl-4 border-l-2 border-neutral-100 animate-fade-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-medium shrink-0">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-xs text-neutral-500">{authorName}</span>
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder={t("discussions.writeComment")}
                  className="w-full px-3 py-2 border border-neutral-200 text-xs focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    {t("discussions.reply")}
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
