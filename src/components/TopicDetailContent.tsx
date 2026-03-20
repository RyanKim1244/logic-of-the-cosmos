"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { supabase, withTimeout } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Topic {
  id: string;
  title: string;
  content: string;
  author_id: string | null;
  author_name: string;
  tags: string[];
  created_at: string;
  upvotes: number;
}

interface Comment {
  id: string;
  topic_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
  parent_id: string | null;
  upvotes: number;
}

interface TopicDetailContentProps {
  initialTopic: Topic;
  initialComments: Comment[];
}

export default function TopicDetailContent({
  initialTopic,
  initialComments,
}: TopicDetailContentProps) {
  const { user } = useAuth();
  const t = useTranslations();
  const [topic, setTopic] = useState<Topic>(initialTopic);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [topicVoted, setTopicVoted] = useState(false);
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const authorName = user ? user.name : "Guest";
  const id = topic.id;

  // Fetch user's upvote status
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    const sig = controller.signal;

    Promise.all([
      withTimeout(supabase.from("topic_upvotes").select("*").eq("user_id", user.id).eq("topic_id", id).maybeSingle(), 5000, sig),
      withTimeout(supabase.from("comment_upvotes").select("comment_id").eq("user_id", user.id), 5000, sig),
    ]).then(([topicUpvote, commentUpvotes]) => {
      if (sig.aborted) return;
      setTopicVoted(!!topicUpvote.data);
      if (commentUpvotes.data) {
        setVotedComments(new Set(commentUpvotes.data.map((u) => u.comment_id)));
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
      } catch { /* keep existing */ }
    }

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        refresh(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [id]);

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(console.error);
    }
  }, [comments]);

  const handleUpvoteTopic = async () => {
    if (!user) return;
    if (topicVoted) {
      await supabase.from("topic_upvotes").delete().eq("user_id", user.id).eq("topic_id", topic.id);
      await supabase.from("topics").update({ upvotes: topic.upvotes - 1 }).eq("id", topic.id);
      setTopic({ ...topic, upvotes: topic.upvotes - 1 });
      setTopicVoted(false);
    } else {
      await supabase.from("topic_upvotes").insert({ user_id: user.id, topic_id: topic.id });
      await supabase.from("topics").update({ upvotes: topic.upvotes + 1 }).eq("id", topic.id);
      setTopic({ ...topic, upvotes: topic.upvotes + 1 });
      setTopicVoted(true);
    }
  };

  const handleUpvoteComment = async (commentId: string) => {
    if (!user) return;
    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const newVoted = new Set(votedComments);
    if (newVoted.has(commentId)) {
      newVoted.delete(commentId);
      await supabase.from("comment_upvotes").delete().eq("user_id", user.id).eq("comment_id", commentId);
      await supabase.from("topic_comments").update({ upvotes: comment.upvotes - 1 }).eq("id", commentId);
      setComments(comments.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes - 1 } : c)));
    } else {
      newVoted.add(commentId);
      await supabase.from("comment_upvotes").insert({ user_id: user.id, comment_id: commentId });
      await supabase.from("topic_comments").update({ upvotes: comment.upvotes + 1 }).eq("id", commentId);
      setComments(comments.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c)));
    }
    setVotedComments(newVoted);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { data, error } = await supabase
      .from("topic_comments")
      .insert({
        topic_id: topic.id,
        author_id: user?.id || null,
        author_name: authorName,
        content: newComment.trim(),
        parent_id: null,
      })
      .select()
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setNewComment("");
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    const { data, error } = await supabase
      .from("topic_comments")
      .insert({
        topic_id: topic.id,
        author_id: user?.id || null,
        author_name: authorName,
        content: replyContent.trim(),
        parent_id: replyTo,
      })
      .select()
      .single();

    if (!error && data) {
      setComments([...comments, data]);
      setReplyContent("");
      setReplyTo(null);
    }
  };

  const handleDeleteTopic = async () => {
    if (!confirm(t("community.deleteTopicConfirm"))) return;
    await supabase.from("topic_comments").delete().eq("topic_id", topic.id);
    const { error } = await supabase.from("topics").delete().eq("id", topic.id);
    if (!error) router.push("/community");
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm(t("community.deleteCommentConfirm"))) return;
    await supabase.from("topic_comments").delete().eq("parent_id", commentId);
    const { error } = await supabase.from("topic_comments").delete().eq("id", commentId);
    if (!error) {
      setComments(comments.filter((c) => c.id !== commentId && c.parent_id !== commentId));
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0];
  const topLevel = comments.filter((c) => c.parent_id === null);
  const getReplies = (parentId: string) => comments.filter((c) => c.parent_id === parentId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" ref={sectionRef}>
      <Link href="/community" className="text-xs text-neutral-400 hover:text-black transition-colors uppercase tracking-widest mb-8 inline-block">
        &larr; {t("community.title")}
      </Link>

      {/* Topic */}
      <article className="border border-neutral-200 p-6 mb-8">
        <div className="flex gap-5">
          <div className="flex flex-col items-center shrink-0 pt-1">
            <button
              onClick={handleUpvoteTopic}
              className={`p-1 transition-colors ${topicVoted ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}
            >
              <svg className="w-5 h-5" fill={topicVoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-medium ${topicVoted ? "text-black" : "text-neutral-500"}`}>{topic.upvotes}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-medium text-black mb-4">{topic.title}</h1>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap mb-4">{topic.content}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {topic.tags.map((tag) => (<span key={tag} className="px-2 py-0.5 bg-neutral-100 text-xs text-neutral-600">#{tag}</span>))}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
              <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-medium">{topic.author_name.charAt(0).toUpperCase()}</span>
              {topic.author_id ? (
                <Link href={`/profile/${topic.author_id}`} className="text-sm font-medium text-black hover:underline">{topic.author_name}</Link>
              ) : (
                <span className="text-sm font-medium text-black">{topic.author_name}</span>
              )}
              <span className="text-xs text-neutral-400">{formatDate(topic.created_at)}</span>
              {(topic.author_id === user?.id || user?.is_admin) && (
                <button
                  onClick={handleDeleteTopic}
                  className="ml-auto text-xs text-neutral-400 hover:text-red-500 font-medium uppercase tracking-wider transition-colors"
                >
                  {t("common.delete")}{user?.is_admin && topic.author_id !== user?.id ? ` (${t("community.admin")})` : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      </article>

      {/* Comment Form */}
      <div className="border border-neutral-200 p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-medium">{authorName.charAt(0).toUpperCase()}</span>
          <span className="text-sm font-medium">{authorName}</span>
          {!user && <span className="text-xs text-neutral-400">({t("discussions.loginToComment")})</span>}
        </div>
        <form onSubmit={handleSubmitComment}>
          <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder={t("discussions.writeComment")} rows={3} className="w-full px-4 py-3 border border-neutral-200 text-sm focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white" />
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={!newComment.trim()} className="px-6 py-2 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">{t("discussions.submit")}</button>
          </div>
        </form>
      </div>

      <div className="mb-4">
        <span className="text-xs text-neutral-400 uppercase tracking-wider">{comments.length} {t("community.comments")}</span>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        {topLevel.length === 0 && (
          <p className="text-neutral-400 text-center py-8 text-sm border border-neutral-200">{t("discussions.noDiscussions")}</p>
        )}
        {topLevel.map((comment) => (
          <div key={comment.id} className="border border-neutral-200 p-5">
            <div className="flex gap-4">
              <div className="flex flex-col items-center shrink-0">
                <button onClick={() => handleUpvoteComment(comment.id)} className={`p-0.5 transition-colors ${votedComments.has(comment.id) ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}>
                  <svg className="w-4 h-4" fill={votedComments.has(comment.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className={`text-xs font-medium ${votedComments.has(comment.id) ? "text-black" : "text-neutral-400"}`}>{comment.upvotes}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-neutral-800 text-white flex items-center justify-center text-xs font-medium">{comment.author_name.charAt(0).toUpperCase()}</span>
                  {comment.author_id ? (
                    <Link href={`/profile/${comment.author_id}`} className="font-medium text-sm text-black hover:underline">{comment.author_name}</Link>
                  ) : (
                    <span className="font-medium text-sm text-black">{comment.author_name}</span>
                  )}
                  <span className="text-xs text-neutral-400">{formatDate(comment.created_at)}</span>
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed mb-2">{comment.content}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => { setReplyTo(replyTo === comment.id ? null : comment.id); setReplyContent(""); }} className="text-xs text-neutral-400 hover:text-black font-medium uppercase tracking-wider transition-colors">
                    {replyTo === comment.id ? t("solutions.cancel") : t("discussions.reply")}
                  </button>
                  {(comment.author_id === user?.id || user?.is_admin) && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="text-xs text-neutral-400 hover:text-red-500 font-medium uppercase tracking-wider transition-colors"
                    >
                      {t("common.delete")}{user?.is_admin && comment.author_id !== user?.id ? ` (${t("community.admin")})` : ""}
                    </button>
                  )}
                </div>

                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="mt-4 pl-4 border-l-2 border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <button onClick={() => handleUpvoteComment(reply.id)} className={`p-0.5 transition-colors ${votedComments.has(reply.id) ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}>
                          <svg className="w-3 h-3" fill={votedComments.has(reply.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className={`text-xs ${votedComments.has(reply.id) ? "text-black" : "text-neutral-400"}`}>{reply.upvotes}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs">{reply.author_name.charAt(0).toUpperCase()}</span>
                          {reply.author_id ? (
                            <Link href={`/profile/${reply.author_id}`} className="font-medium text-sm text-neutral-700 hover:underline">{reply.author_name}</Link>
                          ) : (
                            <span className="font-medium text-sm text-neutral-700">{reply.author_name}</span>
                          )}
                          <span className="text-xs text-neutral-400">{formatDate(reply.created_at)}</span>
                        </div>
                        <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                        {(reply.author_id === user?.id || user?.is_admin) && (
                          <button
                            onClick={() => handleDeleteComment(reply.id)}
                            className="text-xs text-neutral-400 hover:text-red-500 font-medium uppercase tracking-wider transition-colors mt-1"
                          >
                            {t("common.delete")}{user?.is_admin && reply.author_id !== user?.id ? ` (${t("community.admin")})` : ""}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {replyTo === comment.id && (
                  <form onSubmit={handleSubmitReply} className="mt-4 pl-4 border-l-2 border-neutral-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs">{authorName.charAt(0).toUpperCase()}</span>
                      <span className="text-xs text-neutral-500">{authorName}</span>
                    </div>
                    <textarea value={replyContent} onChange={(e) => setReplyContent(e.target.value)} placeholder={t("discussions.writeComment")} rows={2} className="w-full px-3 py-2 border border-neutral-200 text-sm focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white" />
                    <div className="flex justify-end mt-2">
                      <button type="submit" disabled={!replyContent.trim()} className="px-4 py-1.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed">{t("discussions.reply")}</button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
