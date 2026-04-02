"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import LatexRenderer from "@/components/LatexRenderer";

interface Discussion {
  id: string;
  problem_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  edited_at?: string | null;
  is_deleted?: boolean;
  upvotes: number;
  downvotes: number;
}

type SortMode = "best" | "new" | "old";
type VoteMap = Record<string, 1 | -1>;

function timeAgo(dateStr: string, locale: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return locale === "ko" ? "방금" : "just now";
  if (mins < 60) return `${mins}${locale === "ko" ? "분 전" : "m ago"}`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}${locale === "ko" ? "시간 전" : "h ago"}`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}${locale === "ko" ? "일 전" : "d ago"}`;
  return new Date(dateStr).toLocaleDateString();
}

function sortDiscussions(discussions: Discussion[], mode: SortMode): Discussion[] {
  return [...discussions].sort((a, b) => {
    if (mode === "best") return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
    if (mode === "new") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });
}

// ── Vote Buttons ──
function VoteButtons({ score, userVote, onVote }: {
  score: number;
  userVote: 1 | -1 | 0;
  onVote: (value: 1 | -1 | 0) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <button
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={`p-0.5 rounded transition-colors ${
          userVote === 1 ? "text-orange-500" : "text-neutral-300 hover:text-orange-400"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={userVote === 1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`text-[11px] font-semibold tabular-nums ${
        userVote === 1 ? "text-orange-500" : userVote === -1 ? "text-blue-500" : "text-neutral-400"
      }`}>
        {score}
      </span>
      <button
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={`p-0.5 rounded transition-colors ${
          userVote === -1 ? "text-blue-500" : "text-neutral-300 hover:text-blue-400"
        }`}
      >
        <svg className="w-3.5 h-3.5" fill={userVote === -1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

// ── Recursive Discussion Thread ──
function DiscussionThread({
  disc, allDiscussions, depth, userVotes, user, onVote, onReply, onEdit, onDelete, sortMode, locale,
}: {
  disc: Discussion;
  allDiscussions: Discussion[];
  depth: number;
  userVotes: VoteMap;
  user: { id: string; name: string; is_admin: boolean } | null;
  onVote: (id: string, value: 1 | -1 | 0) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (id: string, content: string) => Promise<void>;
  onDelete: (id: string) => void;
  sortMode: SortMode;
  locale: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(disc.content);
  const [submitting, setSubmitting] = useState(false);

  const replies = sortDiscussions(
    allDiscussions.filter((d) => d.parent_id === disc.id),
    sortMode
  );
  const score = disc.upvotes - disc.downvotes;
  const userVote = userVotes[disc.id] ?? 0;
  const isOwner = user?.id === disc.author_id;
  const canModify = isOwner || user?.is_admin;
  const maxDepth = 5;

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    await onReply(disc.id, replyContent.trim());
    setReplyContent("");
    setShowReply(false);
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    await onEdit(disc.id, editContent.trim());
    setIsEditing(false);
    setSubmitting(false);
  };

  const isDeleted = disc.is_deleted;
  if (isDeleted && replies.length === 0) return null;

  return (
    <div className={depth > 0 ? "pl-5 sm:pl-6" : ""}>
      <div className="flex gap-3">
        {/* Collapse line */}
        {depth > 0 && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-4 flex flex-col items-center shrink-0 group/line"
          >
            <div className={`w-0.5 flex-1 rounded-full transition-colors ${
              collapsed ? "bg-blue-400" : "bg-neutral-200 group-hover/line:bg-neutral-400"
            }`} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            {!isDeleted && (
              <>
                <span className="w-6 h-6 bg-neutral-800 text-white flex items-center justify-center text-[10px] font-medium rounded-full shrink-0">
                  {disc.author_name.charAt(0).toUpperCase()}
                </span>
                {disc.author_id ? (
                  <Link href={`/profile/${disc.author_id}`} className="text-xs font-semibold text-neutral-800 hover:underline">
                    {disc.author_name}
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-neutral-800">{disc.author_name}</span>
                )}
              </>
            )}
            {isDeleted && (
              <span className="text-xs text-neutral-400 italic">[{locale === "ko" ? "삭제됨" : "deleted"}]</span>
            )}
            <span className="text-[10px] text-neutral-400">{timeAgo(disc.created_at, locale)}</span>
            {disc.edited_at && !isDeleted && (
              <span className="text-[10px] text-neutral-400 italic">({locale === "ko" ? "수정됨" : "edited"})</span>
            )}
            {collapsed && (
              <button onClick={() => setCollapsed(false)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                [{replies.length} {locale === "ko" ? "개 더보기" : "more"}]
              </button>
            )}
          </div>

          {!collapsed && (
            <>
              {/* Content with vote */}
              {!isDeleted && (
                <div className="flex gap-3">
                  <VoteButtons score={score} userVote={userVote} onVote={(v) => onVote(disc.id, v)} />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="mb-3">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black focus:outline-none resize-none bg-neutral-50 focus:bg-white"
                        />
                        <div className="flex gap-2 mt-2">
                          <button onClick={handleSaveEdit} disabled={submitting} className="px-4 py-1.5 bg-black text-white text-[11px] font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
                            {locale === "ko" ? "저장" : "Save"}
                          </button>
                          <button onClick={() => { setIsEditing(false); setEditContent(disc.content); }} className="px-4 py-1.5 text-[11px] text-neutral-500 hover:text-black transition-colors">
                            {locale === "ko" ? "취소" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-700 leading-relaxed mb-2">
                        <LatexRenderer content={disc.content} />
                      </div>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-4 text-[11px] mb-1">
                        {user && depth < maxDepth && (
                          <button onClick={() => { setShowReply(!showReply); setReplyContent(""); }} className="text-neutral-400 hover:text-black font-medium transition-colors">
                            {locale === "ko" ? "답글" : "Reply"}
                          </button>
                        )}
                        {isOwner && (
                          <button onClick={() => { setIsEditing(true); setEditContent(disc.content); }} className="text-neutral-400 hover:text-black font-medium transition-colors">
                            {locale === "ko" ? "수정" : "Edit"}
                          </button>
                        )}
                        {canModify && (
                          <button onClick={() => onDelete(disc.id)} className="text-neutral-400 hover:text-red-500 font-medium transition-colors">
                            {locale === "ko" ? "삭제" : "Delete"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reply form */}
                    {showReply && (
                      <form onSubmit={handleSubmitReply} className="mt-3 mb-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={locale === "ko" ? "답글을 작성하세요... (LaTeX: $수식$)" : "Write a reply... (LaTeX: $formula$)"}
                          rows={2}
                          className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black focus:outline-none resize-none bg-neutral-50 focus:bg-white"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-2">
                          <button type="submit" disabled={!replyContent.trim() || submitting} className="px-4 py-1.5 bg-black text-white text-[11px] font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-40">
                            {locale === "ko" ? "답글" : "Reply"}
                          </button>
                          <button type="button" onClick={() => setShowReply(false)} className="px-4 py-1.5 text-[11px] text-neutral-500 hover:text-black transition-colors">
                            {locale === "ko" ? "취소" : "Cancel"}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {/* Nested replies */}
              {replies.length > 0 && (
                <div className="mt-3 space-y-3">
                  {replies.map((reply) => (
                    <DiscussionThread
                      key={reply.id}
                      disc={reply}
                      allDiscussions={allDiscussions}
                      depth={depth + 1}
                      userVotes={userVotes}
                      user={user}
                      onVote={onVote}
                      onReply={onReply}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      sortMode={sortMode}
                      locale={locale}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ──
export default function DiscussionSection({ problemId }: { problemId: string }) {
  const { user } = useAuth();
  const { locale } = useLanguage();
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [votes, setVotes] = useState<VoteMap>({});
  const [newComment, setNewComment] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [submitting, setSubmitting] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  const authorName = user ? user.name : "Guest";

  // Fetch discussions + user votes
  useEffect(() => {
    const controller = new AbortController();
    async function fetch() {
      try {
        const { data } = await withRetry(
          () => withTimeout(
            supabase.from("discussions").select("*").eq("problem_id", problemId).or("is_solution.is.null,is_solution.eq.false").order("created_at", { ascending: true }),
            8000, controller.signal
          ), 1, 1000, controller.signal
        );
        if (!controller.signal.aborted && data) setDiscussions(data);

        if (user) {
          const { data: voteData } = await supabase
            .from("discussion_votes")
            .select("discussion_id, value")
            .eq("user_id", user.id);
          if (voteData) {
            const map: VoteMap = {};
            voteData.forEach((v: { discussion_id: string; value: number }) => {
              map[v.discussion_id] = v.value as 1 | -1;
            });
            setVotes(map);
          }
        }
      } catch {}
    }
    fetch();
    return () => controller.abort();
  }, [problemId, user]);

  // MathJax
  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      const el = sectionRef.current;
      if (window.MathJax.typesetClear) window.MathJax.typesetClear([el]);
      window.MathJax.typesetPromise([el]).catch(() => {});
    }
  }, [discussions]);

  // Vote
  const handleVote = useCallback(async (discId: string, value: 1 | -1 | 0) => {
    if (!user) return;
    const prev = votes[discId] ?? 0;
    setVotes((v) => {
      const next = { ...v };
      if (value === 0) delete next[discId];
      else next[discId] = value;
      return next;
    });
    setDiscussions((ds) => ds.map((d) => d.id === discId ? {
      ...d,
      upvotes: d.upvotes + (value === 1 ? 1 : 0) - (prev === 1 ? 1 : 0),
      downvotes: d.downvotes + (value === -1 ? 1 : 0) - (prev === -1 ? 1 : 0),
    } : d));
    await supabase.rpc("vote_discussion", { p_user_id: user.id, p_discussion_id: discId, p_value: value });
  }, [user, votes]);

  // Submit comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("discussions").insert({
      problem_id: problemId, author_id: user?.id || null, author_name: authorName,
      content: newComment.trim(), parent_id: null,
    }).select().single();
    if (!error && data) { setDiscussions([...discussions, data]); setNewComment(""); }
    setSubmitting(false);
  };

  // Reply
  const handleReply = useCallback(async (parentId: string, content: string) => {
    const { data, error } = await supabase.from("discussions").insert({
      problem_id: problemId, author_id: user?.id || null, author_name: authorName,
      content, parent_id: parentId,
    }).select().single();
    if (!error && data) setDiscussions((ds) => [...ds, data]);
  }, [problemId, user, authorName]);

  // Edit
  const handleEdit = useCallback(async (id: string, content: string) => {
    const { error } = await supabase.from("discussions").update({
      content, edited_at: new Date().toISOString(),
    }).eq("id", id);
    if (!error) setDiscussions((ds) => ds.map((d) => d.id === id ? { ...d, content, edited_at: new Date().toISOString() } : d));
  }, []);

  // Delete
  const handleDelete = useCallback(async (id: string) => {
    const replies = discussions.filter((d) => d.parent_id === id);
    if (replies.length > 0) {
      await supabase.from("discussions").update({ is_deleted: true, content: "" }).eq("id", id);
      setDiscussions((ds) => ds.map((d) => d.id === id ? { ...d, is_deleted: true, content: "" } : d));
    } else {
      await supabase.from("discussions").delete().eq("id", id);
      setDiscussions((ds) => ds.filter((d) => d.id !== id));
    }
  }, [discussions]);

  const topLevel = sortDiscussions(discussions.filter((d) => d.parent_id === null), sortMode);
  const commentCount = discussions.filter((d) => !d.is_deleted).length;

  return (
    <div ref={sectionRef} className="mt-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-black">
            {locale === "ko" ? "토론" : "Discussion"}
          </h2>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{commentCount}</span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-0.5">
          {(["best", "new", "old"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all ${
                sortMode === mode ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {mode === "best" ? (locale === "ko" ? "추천순" : "Best")
                : mode === "new" ? (locale === "ko" ? "최신순" : "New")
                : (locale === "ko" ? "오래된순" : "Old")}
            </button>
          ))}
        </div>
      </div>

      {/* Comment form */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden mb-8">
        <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-100 flex items-center gap-2.5">
          <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-medium rounded-full shrink-0">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="text-xs font-medium text-neutral-700">{authorName}</span>
          {!user && <span className="text-[10px] text-neutral-400">({locale === "ko" ? "로그인하면 이름 표시" : "login for name"})</span>}
        </div>
        <form onSubmit={handleSubmitComment} className="p-5">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={locale === "ko" ? "의견을 공유하세요... (LaTeX: $수식$)" : "Share your thoughts... (LaTeX: $formula$)"}
            className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm focus:border-black focus:outline-none resize-none bg-white transition-colors min-h-[100px]"
            rows={4}
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-neutral-300">LaTeX: $...$, $$...$$</span>
            <button
              type="submit"
              disabled={!newComment.trim() || submitting}
              className="px-5 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {submitting ? "..." : (locale === "ko" ? "댓글" : "Comment")}
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      <div className="space-y-4">
        {topLevel.length === 0 && (
          <div className="text-center py-14 border border-dashed border-neutral-200 rounded-xl">
            <svg className="w-10 h-10 text-neutral-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-neutral-400 text-sm mb-1">
              {locale === "ko" ? "아직 토론이 없습니다" : "No comments yet"}
            </p>
            <p className="text-neutral-300 text-xs">
              {locale === "ko" ? "첫 번째 댓글을 남겨보세요!" : "Be the first to comment!"}
            </p>
          </div>
        )}
        {topLevel.map((disc) => (
          <div key={disc.id} className="border border-neutral-200 rounded-xl p-5">
            <DiscussionThread
              disc={disc}
              allDiscussions={discussions}
              depth={0}
              userVotes={votes}
              user={user ? { id: user.id, name: user.name, is_admin: user.is_admin } : null}
              onVote={handleVote}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
              sortMode={sortMode}
              locale={locale}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
