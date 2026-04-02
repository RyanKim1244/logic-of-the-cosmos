"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, withTimeout } from "@/lib/supabase";
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
  edited_at: string | null;
  upvotes: number;
  downvotes: number;
}

interface Comment {
  id: string;
  topic_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  edited_at: string | null;
  parent_id: string | null;
  upvotes: number;
  downvotes: number;
  is_deleted: boolean;
}

type SortMode = "best" | "new" | "controversial";
type VoteMap = Record<string, 1 | -1>;

interface TopicDetailContentProps {
  initialTopic: Topic;
  initialComments: Comment[];
}

// ── Vote Button Component ──
function VoteButtons({
  score,
  userVote,
  onVote,
  size = "md",
}: {
  score: number;
  userVote: 1 | -1 | 0;
  onVote: (value: 1 | -1 | 0) => void;
  size?: "md" | "sm";
}) {
  const iconClass = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <div className="flex flex-col items-center gap-0.5 shrink-0">
      <button
        onClick={() => onVote(userVote === 1 ? 0 : 1)}
        className={`p-0.5 rounded transition-colors ${
          userVote === 1 ? "text-orange-500" : "text-neutral-300 hover:text-orange-400"
        }`}
      >
        <svg className={iconClass} fill={userVote === 1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
        </svg>
      </button>
      <span className={`text-xs font-semibold tabular-nums ${
        userVote === 1 ? "text-orange-500" : userVote === -1 ? "text-blue-500" : "text-neutral-500"
      }`}>
        {score}
      </span>
      <button
        onClick={() => onVote(userVote === -1 ? 0 : -1)}
        className={`p-0.5 rounded transition-colors ${
          userVote === -1 ? "text-blue-500" : "text-neutral-300 hover:text-blue-400"
        }`}
      >
        <svg className={iconClass} fill={userVote === -1 ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
    </div>
  );
}

// ── Recursive Comment Component ──
function CommentThread({
  comment,
  allComments,
  depth,
  userVotes,
  user,
  onVote,
  onReply,
  onEdit,
  onDelete,
  sortMode,
  locale,
}: {
  comment: Comment;
  allComments: Comment[];
  depth: number;
  userVotes: VoteMap;
  user: { id: string; name: string; is_admin: boolean } | null;
  onVote: (commentId: string, value: 1 | -1 | 0) => void;
  onReply: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => void;
  sortMode: SortMode;
  locale: string;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showReply, setShowReply] = useState(false);
  const [replyContent, setReplyContent] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [submitting, setSubmitting] = useState(false);

  const replies = sortComments(
    allComments.filter((c) => c.parent_id === comment.id),
    sortMode
  );
  const score = comment.upvotes - comment.downvotes;
  const userVote = userVotes[comment.id] ?? 0;
  const isOwner = user?.id === comment.author_id;
  const canModify = isOwner || user?.is_admin;
  const maxDepth = 6;

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submitting) return;
    setSubmitting(true);
    await onReply(comment.id, replyContent.trim());
    setReplyContent("");
    setShowReply(false);
    setSubmitting(false);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || submitting) return;
    setSubmitting(true);
    await onEdit(comment.id, editContent.trim());
    setIsEditing(false);
    setSubmitting(false);
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return locale === "ko" ? "방금" : "just now";
    if (mins < 60) return `${mins}${locale === "ko" ? "분 전" : "m ago"}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${locale === "ko" ? "시간 전" : "h ago"}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}${locale === "ko" ? "일 전" : "d ago"}`;
    return new Date(dateStr).toLocaleDateString();
  };

  if (comment.is_deleted && replies.length === 0) return null;

  return (
    <div className={`${depth > 0 ? "pl-5 sm:pl-6" : ""}`}>
      <div className="flex gap-3 group">
        {/* Collapse line */}
        {depth > 0 && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-4 flex flex-col items-center shrink-0 group/line"
            title={collapsed ? "Expand" : "Collapse"}
          >
            <div className={`w-0.5 flex-1 rounded-full transition-colors ${
              collapsed ? "bg-blue-400" : "bg-neutral-200 group-hover/line:bg-neutral-400"
            }`} />
          </button>
        )}

        <div className="flex-1 min-w-0">
          {/* Comment header */}
          <div className="flex items-center gap-2 mb-1">
            {!comment.is_deleted && (
              <>
                <span className="w-5 h-5 bg-neutral-800 text-white flex items-center justify-center text-[10px] font-medium rounded-full shrink-0">
                  {comment.author_name.charAt(0).toUpperCase()}
                </span>
                {comment.author_id ? (
                  <Link href={`/profile/${comment.author_id}`} className="text-xs font-semibold text-neutral-800 hover:underline">
                    {comment.author_name}
                  </Link>
                ) : (
                  <span className="text-xs font-semibold text-neutral-800">{comment.author_name}</span>
                )}
              </>
            )}
            {comment.is_deleted && (
              <span className="text-xs text-neutral-400 italic">[{locale === "ko" ? "삭제됨" : "deleted"}]</span>
            )}
            <span className="text-[10px] text-neutral-400">{timeAgo(comment.created_at)}</span>
            {comment.edited_at && !comment.is_deleted && (
              <span className="text-[10px] text-neutral-400 italic">
                ({locale === "ko" ? "수정됨" : "edited"})
              </span>
            )}
            {collapsed && (
              <button onClick={() => setCollapsed(false)} className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                [{replies.length} {locale === "ko" ? "개 더보기" : "more"}]
              </button>
            )}
          </div>

          {!collapsed && (
            <>
              {/* Comment body */}
              {!comment.is_deleted && (
                <div className="flex gap-2.5">
                  <VoteButtons score={score} userVote={userVote} onVote={(v) => onVote(comment.id, v)} size="sm" />
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="mb-2">
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none resize-none bg-neutral-50 focus:bg-white"
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={handleSaveEdit} disabled={submitting} className="px-3 py-1 bg-black text-white text-[11px] font-medium rounded hover:bg-neutral-800 transition-colors disabled:opacity-40">
                            {locale === "ko" ? "저장" : "Save"}
                          </button>
                          <button onClick={() => { setIsEditing(false); setEditContent(comment.content); }} className="px-3 py-1 text-[11px] text-neutral-500 hover:text-black transition-colors">
                            {locale === "ko" ? "취소" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-neutral-700 leading-relaxed mb-1.5">
                        <LatexRenderer content={comment.content} />
                      </div>
                    )}

                    {/* Actions */}
                    {!isEditing && (
                      <div className="flex items-center gap-3 text-[11px]">
                        {user && depth < maxDepth && (
                          <button
                            onClick={() => { setShowReply(!showReply); setReplyContent(""); }}
                            className="text-neutral-400 hover:text-black font-medium transition-colors"
                          >
                            {locale === "ko" ? "답글" : "Reply"}
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => { setIsEditing(true); setEditContent(comment.content); }}
                            className="text-neutral-400 hover:text-black font-medium transition-colors"
                          >
                            {locale === "ko" ? "수정" : "Edit"}
                          </button>
                        )}
                        {canModify && (
                          <button
                            onClick={() => onDelete(comment.id)}
                            className="text-neutral-400 hover:text-red-500 font-medium transition-colors"
                          >
                            {locale === "ko" ? "삭제" : "Delete"}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Reply form */}
                    {showReply && (
                      <form onSubmit={handleSubmitReply} className="mt-2">
                        <textarea
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          placeholder={locale === "ko" ? "답글을 작성하세요... (LaTeX: $수식$)" : "Write a reply... (LaTeX: $formula$)"}
                          rows={2}
                          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none resize-none bg-neutral-50 focus:bg-white"
                          autoFocus
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button type="submit" disabled={!replyContent.trim() || submitting} className="px-3 py-1 bg-black text-white text-[11px] font-medium rounded hover:bg-neutral-800 transition-colors disabled:opacity-40">
                            {locale === "ko" ? "답글" : "Reply"}
                          </button>
                          <button type="button" onClick={() => setShowReply(false)} className="px-3 py-1 text-[11px] text-neutral-500 hover:text-black transition-colors">
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
                    <CommentThread
                      key={reply.id}
                      comment={reply}
                      allComments={allComments}
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

// ── Sort Helpers ──
function sortComments(comments: Comment[], mode: SortMode): Comment[] {
  return [...comments].sort((a, b) => {
    switch (mode) {
      case "best":
        return (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes);
      case "new":
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      case "controversial": {
        const aTotal = a.upvotes + a.downvotes;
        const bTotal = b.upvotes + b.downvotes;
        if (aTotal === 0 && bTotal === 0) return 0;
        const aRatio = aTotal > 0 ? Math.min(a.upvotes, a.downvotes) / Math.max(a.upvotes, a.downvotes) : 0;
        const bRatio = bTotal > 0 ? Math.min(b.upvotes, b.downvotes) / Math.max(b.upvotes, b.downvotes) : 0;
        return bRatio * bTotal - aRatio * aTotal;
      }
      default:
        return 0;
    }
  });
}

// ── Main Component ──
export default function TopicDetailContent({
  initialTopic,
  initialComments,
}: TopicDetailContentProps) {
  const { user } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const sectionRef = useRef<HTMLDivElement>(null);

  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [topicVote, setTopicVote] = useState<1 | -1 | 0>(0);
  const [commentVotes, setCommentVotes] = useState<VoteMap>({});
  const [newComment, setNewComment] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("best");
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState(topic.title);
  const [editTopicContent, setEditTopicContent] = useState(topic.content);

  const id = topic.id;
  const topicScore = topic.upvotes - topic.downvotes;
  const authorName = user ? user.name : "Guest";

  // Fetch vote states
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const sig = controller.signal;

    Promise.all([
      withTimeout(supabase.from("topic_upvotes").select("value").eq("user_id", user.id).eq("topic_id", id).maybeSingle(), 5000, sig),
      withTimeout(supabase.from("comment_upvotes").select("comment_id, value").eq("user_id", user.id), 5000, sig),
    ]).then(([topicRes, commentRes]) => {
      if (sig.aborted) return;
      if (topicRes.data?.value) setTopicVote(topicRes.data.value as 1 | -1);
      if (commentRes.data) {
        const map: VoteMap = {};
        commentRes.data.forEach((v: { comment_id: string; value: number }) => {
          map[v.comment_id] = v.value as 1 | -1;
        });
        setCommentVotes(map);
      }
    }).catch(() => {});

    return () => controller.abort();
  }, [user, id]);

  // Background refresh
  useEffect(() => {
    let controller = new AbortController();
    async function refresh(sig: AbortSignal) {
      try {
        const [{ data: topicData }, { data: commentsData }] = await Promise.all([
          withTimeout(supabase.from("topics").select("*").eq("id", id).single(), 8000, sig),
          withTimeout(supabase.from("topic_comments").select("*").eq("topic_id", id).order("created_at", { ascending: true }), 8000, sig),
        ]);
        if (sig.aborted) return;
        if (topicData) setTopic(topicData);
        if (commentsData) setComments(commentsData);
      } catch {}
    }
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        refresh(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => { controller.abort(); document.removeEventListener("visibilitychange", handleVisibility); };
  }, [id]);

  // MathJax typeset
  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(() => {});
    }
  }, [comments, topic]);

  // Vote on topic
  const handleTopicVote = useCallback(async (value: 1 | -1 | 0) => {
    if (!user) return;
    const prev = topicVote;
    setTopicVote(value);
    // Optimistic update
    setTopic((t) => ({
      ...t,
      upvotes: t.upvotes + (value === 1 ? 1 : 0) - (prev === 1 ? 1 : 0),
      downvotes: t.downvotes + (value === -1 ? 1 : 0) - (prev === -1 ? 1 : 0),
    }));
    await supabase.rpc("vote_topic", { p_user_id: user.id, p_topic_id: id, p_value: value });
  }, [user, topicVote, id]);

  // Vote on comment
  const handleCommentVote = useCallback(async (commentId: string, value: 1 | -1 | 0) => {
    if (!user) return;
    const prev = commentVotes[commentId] ?? 0;
    setCommentVotes((v) => {
      const next = { ...v };
      if (value === 0) delete next[commentId];
      else next[commentId] = value;
      return next;
    });
    setComments((cs) => cs.map((c) => c.id === commentId ? {
      ...c,
      upvotes: c.upvotes + (value === 1 ? 1 : 0) - (prev === 1 ? 1 : 0),
      downvotes: c.downvotes + (value === -1 ? 1 : 0) - (prev === -1 ? 1 : 0),
    } : c));
    await supabase.rpc("vote_comment", { p_user_id: user.id, p_comment_id: commentId, p_value: value });
  }, [user, commentVotes]);

  // Submit top-level comment
  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const { data, error } = await supabase.from("topic_comments").insert({
      topic_id: id, author_id: user?.id || null, author_name: authorName,
      content: newComment.trim(), parent_id: null,
    }).select().single();
    if (!error && data) { setComments([...comments, data]); setNewComment(""); }
  };

  // Reply to comment
  const handleReply = useCallback(async (parentId: string, content: string) => {
    const { data, error } = await supabase.from("topic_comments").insert({
      topic_id: id, author_id: user?.id || null, author_name: authorName,
      content, parent_id: parentId,
    }).select().single();
    if (!error && data) setComments((cs) => [...cs, data]);
  }, [id, user, authorName]);

  // Edit comment
  const handleEdit = useCallback(async (commentId: string, content: string) => {
    const { error } = await supabase.from("topic_comments").update({
      content, edited_at: new Date().toISOString(),
    }).eq("id", commentId);
    if (!error) {
      setComments((cs) => cs.map((c) => c.id === commentId ? { ...c, content, edited_at: new Date().toISOString() } : c));
    }
  }, []);

  // Soft delete comment
  const handleDelete = useCallback(async (commentId: string) => {
    const replies = comments.filter((c) => c.parent_id === commentId);
    if (replies.length > 0) {
      // Soft delete — keep for thread integrity
      await supabase.from("topic_comments").update({
        is_deleted: true, content: "",
      }).eq("id", commentId);
      setComments((cs) => cs.map((c) => c.id === commentId ? { ...c, is_deleted: true, content: "" } : c));
    } else {
      // Hard delete — no children
      await supabase.from("topic_comments").delete().eq("id", commentId);
      setComments((cs) => cs.filter((c) => c.id !== commentId));
    }
  }, [comments]);

  // Delete topic
  const handleDeleteTopic = async () => {
    if (!confirm(locale === "ko" ? "토픽을 삭제하시겠습니까?" : "Delete this topic?")) return;
    await supabase.from("topic_comments").delete().eq("topic_id", id);
    const { error } = await supabase.from("topics").delete().eq("id", id);
    if (!error) router.push("/community");
  };

  // Edit topic
  const handleSaveTopicEdit = async () => {
    if (!editTopicTitle.trim() || !editTopicContent.trim()) return;
    const { error } = await supabase.from("topics").update({
      title: editTopicTitle.trim(), content: editTopicContent.trim(), edited_at: new Date().toISOString(),
    }).eq("id", id);
    if (!error) {
      setTopic({ ...topic, title: editTopicTitle.trim(), content: editTopicContent.trim(), edited_at: new Date().toISOString() });
      setIsEditingTopic(false);
    }
  };

  const topLevel = sortComments(comments.filter((c) => c.parent_id === null), sortMode);

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return locale === "ko" ? "방금" : "just now";
    if (mins < 60) return `${mins}${locale === "ko" ? "분 전" : "m ago"}`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}${locale === "ko" ? "시간 전" : "h ago"}`;
    const days = Math.floor(hrs / 24);
    if (days < 30) return `${days}${locale === "ko" ? "일 전" : "d ago"}`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16" ref={sectionRef}>
      <Link href="/community" className="text-xs text-neutral-400 hover:text-black transition-colors uppercase tracking-widest mb-8 inline-block">
        &larr; {t.common.community}
      </Link>

      {/* ── Topic ── */}
      <article className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-neutral-50 border-b border-neutral-100 px-6 py-4">
          {isEditingTopic ? (
            <input
              type="text"
              value={editTopicTitle}
              onChange={(e) => setEditTopicTitle(e.target.value)}
              className="w-full text-xl font-semibold text-black bg-white border border-neutral-200 rounded-lg px-3 py-1.5 focus:border-black focus:outline-none"
            />
          ) : (
            <h1 className="text-xl font-semibold text-black">{topic.title}</h1>
          )}
        </div>
        <div className="p-6 flex gap-4">
          <VoteButtons score={topicScore} userVote={topicVote} onVote={handleTopicVote} />
          <div className="flex-1 min-w-0">

            {isEditingTopic ? (
              <div className="mb-3">
                <textarea
                  value={editTopicContent}
                  onChange={(e) => setEditTopicContent(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none resize-none bg-neutral-50 focus:bg-white"
                />
                <div className="flex gap-2 mt-2">
                  <button onClick={handleSaveTopicEdit} className="px-4 py-1.5 bg-black text-white text-xs font-medium rounded hover:bg-neutral-800 transition-colors">
                    {locale === "ko" ? "저장" : "Save"}
                  </button>
                  <button onClick={() => { setIsEditingTopic(false); setEditTopicTitle(topic.title); setEditTopicContent(topic.content); }} className="px-4 py-1.5 text-xs text-neutral-500 hover:text-black transition-colors">
                    {locale === "ko" ? "취소" : "Cancel"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-neutral-700 leading-relaxed mb-4">
                <LatexRenderer content={topic.content} />
              </div>
            )}

            {topic.tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap mb-4">
                {topic.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-neutral-100 text-xs text-neutral-600 rounded-md">#{tag}</span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3 pt-3 border-t border-neutral-100 text-xs text-neutral-400">
              <span className="w-6 h-6 bg-black text-white flex items-center justify-center text-[10px] font-medium rounded-full">
                {topic.author_name.charAt(0).toUpperCase()}
              </span>
              {topic.author_id ? (
                <Link href={`/profile/${topic.author_id}`} className="font-semibold text-neutral-700 hover:underline">{topic.author_name}</Link>
              ) : (
                <span className="font-semibold text-neutral-700">{topic.author_name}</span>
              )}
              <span>{timeAgo(topic.created_at)}</span>
              {topic.edited_at && (
                <span className="italic">({locale === "ko" ? "수정됨" : "edited"})</span>
              )}

              <div className="ml-auto flex items-center gap-3">
                {topic.author_id === user?.id && !isEditingTopic && (
                  <button onClick={() => { setIsEditingTopic(true); setEditTopicTitle(topic.title); setEditTopicContent(topic.content); }} className="hover:text-black transition-colors font-medium">
                    {locale === "ko" ? "수정" : "Edit"}
                  </button>
                )}
                {(topic.author_id === user?.id || user?.is_admin) && (
                  <button onClick={handleDeleteTopic} className="hover:text-red-500 transition-colors font-medium">
                    {locale === "ko" ? "삭제" : "Delete"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* ── Comment Form ── */}
      <div className="border border-neutral-200 rounded-xl overflow-hidden mb-6">
        <div className="bg-neutral-50 px-5 py-3 border-b border-neutral-100 flex items-center gap-2">
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
            rows={3}
            className="w-full px-4 py-3 border border-neutral-200 rounded-lg text-sm focus:border-black focus:outline-none resize-none bg-white transition-colors"
          />
          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px] text-neutral-300">
              {locale === "ko" ? "LaTeX 수식: $...$, 블록: $$...$$" : "LaTeX: $...$, block: $$...$$"}
            </span>
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-5 py-2 bg-black text-white text-xs font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {locale === "ko" ? "댓글" : "Comment"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Sort & Count ── */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-semibold text-black">{locale === "ko" ? "댓글" : "Comments"}</h3>
          <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">{comments.filter((c) => !c.is_deleted).length}</span>
        </div>
        <div className="flex items-center gap-1 bg-neutral-100 rounded-full p-0.5">
          {(["best", "new", "controversial"] as SortMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setSortMode(mode)}
              className={`px-3 py-1 text-[11px] font-medium rounded-full transition-all ${
                sortMode === mode ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-600"
              }`}
            >
              {mode === "best" ? (locale === "ko" ? "추천순" : "Best")
                : mode === "new" ? (locale === "ko" ? "최신순" : "New")
                : (locale === "ko" ? "논쟁" : "Controversial")}
            </button>
          ))}
        </div>
      </div>

      {/* ── Comments ── */}
      <div className="space-y-4">
        {topLevel.length === 0 && (
          <div className="text-center py-12 border border-dashed border-neutral-200 rounded-xl">
            <svg className="w-8 h-8 text-neutral-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-neutral-400 text-sm">
              {locale === "ko" ? "아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!" : "No comments yet. Be the first to comment!"}
            </p>
          </div>
        )}
        {topLevel.map((comment) => (
          <div key={comment.id} className="border border-neutral-200 rounded-xl p-5 sm:p-6">
            <CommentThread
              comment={comment}
              allComments={comments}
              depth={0}
              userVotes={commentVotes}
              user={user ? { id: user.id, name: user.name, is_admin: user.is_admin } : null}
              onVote={handleCommentVote}
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
