"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, withTimeout } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Discussion {
  id: string;
  problem_id: string;
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
        const { data } = await withTimeout(
          supabase.from("discussions").select("*").eq("problem_id", problemId).or("is_solution.is.null,is_solution.eq.false").order("created_at", { ascending: true }),
          5000, controller.signal
        );
        if (!controller.signal.aborted && data) setDiscussions(data);
      } catch { /* ignore */ }
    }
    fetchDiscussions();
    return () => controller.abort();
  }, [problemId]);

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(console.error);
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

  const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0];
  const topLevel = discussions.filter((d) => d.parent_id === null);
  const getReplies = (parentId: string) => discussions.filter((d) => d.parent_id === parentId);

  return (
    <div ref={sectionRef} className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-light text-black">토론</h2>
        <span className="text-xs text-neutral-400">{discussions.length}개의 댓글</span>
      </div>

      {/* New comment form */}
      <div className="border border-neutral-200 p-5 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium text-black">{authorName}</span>
          {!user && (
            <span className="text-xs text-neutral-400">(로그인하면 이름으로 표시됩니다)</span>
          )}
        </div>
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="의견을 공유하세요... (LaTeX 수식 사용 가능: $...$ 또는 $$...$$)"
            className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none resize-none text-sm transition-colors bg-neutral-50 focus:bg-white"
            rows={4}
          />
          <div className="flex justify-end mt-3">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
            >
              댓글 등록
            </button>
          </div>
        </form>
      </div>

      {/* Discussion list */}
      <div className="space-y-4">
        {topLevel.length === 0 && (
          <p className="text-neutral-400 text-center py-8 text-sm">아직 토론이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
        )}
        {topLevel.map((disc) => (
          <div key={disc.id} className="border border-neutral-200 p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 bg-neutral-800 text-white flex items-center justify-center text-xs font-medium shrink-0">
                {disc.author_name.charAt(0).toUpperCase()}
              </span>
              <div className="flex-1 min-w-0">
                <span className="font-medium text-black text-sm">{disc.author_name}</span>
                <span className="text-xs text-neutral-400 ml-2">{formatDate(disc.created_at)}</span>
              </div>
            </div>
            <div className="text-neutral-700 mb-3 whitespace-pre-wrap text-xs leading-relaxed pl-11">{disc.content}</div>
            <div className="pl-11">
              <button
                onClick={() => {
                  setReplyTo(replyTo === disc.id ? null : disc.id);
                  setReplyContent("");
                }}
                className="text-xs text-neutral-400 hover:text-black font-medium uppercase tracking-wider transition-colors"
              >
                {replyTo === disc.id ? "취소" : "답글"}
              </button>
            </div>

            {/* Replies */}
            {getReplies(disc.id).map((reply) => (
              <div key={reply.id} className="ml-11 mt-4 pl-4 border-l-2 border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs font-medium shrink-0">
                    {reply.author_name.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-neutral-700 text-sm">{reply.author_name}</span>
                  <span className="text-xs text-neutral-400">{formatDate(reply.created_at)}</span>
                </div>
                <div className="text-neutral-600 text-xs whitespace-pre-wrap leading-relaxed pl-8">{reply.content}</div>
              </div>
            ))}

            {/* Reply form */}
            {replyTo === disc.id && (
              <form onSubmit={handleSubmitReply} className="ml-11 mt-4 pl-4 border-l-2 border-neutral-100">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-xs font-medium shrink-0">
                    {authorName.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-sm text-neutral-500">{authorName}</span>
                </div>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="답글을 작성하세요... (LaTeX 수식 사용 가능: $...$)"
                  className="w-full px-3 py-2 border border-neutral-200 text-sm focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white"
                  rows={3}
                />
                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!replyContent.trim()}
                    className="px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    답글 등록
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
