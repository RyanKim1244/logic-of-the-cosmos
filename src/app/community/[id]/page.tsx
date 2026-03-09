"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { topics, topicComments as initialComments } from "@/data/community";
import { useAuth } from "@/context/AuthContext";
import { TopicComment } from "@/types";

export default function TopicDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const topic = topics.find((t) => t.id === id);

  const [comments, setComments] = useState<TopicComment[]>(
    initialComments.filter((c) => c.topicId === id)
  );
  const [topicUpvotes, setTopicUpvotes] = useState(topic?.upvotes ?? 0);
  const [topicVoted, setTopicVoted] = useState(false);
  const [votedComments, setVotedComments] = useState<Set<string>>(new Set());
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const sectionRef = useRef<HTMLDivElement>(null);

  const authorName = user ? user.name : "Guest";

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(console.error);
    }
  }, [comments]);

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <p className="text-neutral-400">토픽을 찾을 수 없습니다.</p>
        <Link href="/community" className="text-sm text-black hover:underline mt-4 inline-block">
          커뮤니티로 돌아가기
        </Link>
      </div>
    );
  }

  const handleUpvoteTopic = () => {
    if (topicVoted) {
      setTopicUpvotes(topicUpvotes - 1);
      setTopicVoted(false);
    } else {
      setTopicUpvotes(topicUpvotes + 1);
      setTopicVoted(true);
    }
  };

  const handleUpvoteComment = (commentId: string) => {
    const newVoted = new Set(votedComments);
    if (newVoted.has(commentId)) {
      newVoted.delete(commentId);
      setComments(comments.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes - 1 } : c)));
    } else {
      newVoted.add(commentId);
      setComments(comments.map((c) => (c.id === commentId ? { ...c, upvotes: c.upvotes + 1 } : c)));
    }
    setVotedComments(newVoted);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: TopicComment = {
      id: `tc-${Date.now()}`,
      topicId: topic.id,
      author: authorName,
      content: newComment.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      parentId: null,
      upvotes: 0,
    };

    setComments([...comments, comment]);
    setNewComment("");
  };

  const handleSubmitReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyTo) return;

    const comment: TopicComment = {
      id: `tc-${Date.now()}`,
      topicId: topic.id,
      author: authorName,
      content: replyContent.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      parentId: replyTo,
      upvotes: 0,
    };

    setComments([...comments, comment]);
    setReplyContent("");
    setReplyTo(null);
  };

  const topLevel = comments.filter((c) => c.parentId === null);
  const getReplies = (parentId: string) => comments.filter((c) => c.parentId === parentId);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12" ref={sectionRef}>
      {/* Breadcrumb */}
      <Link href="/community" className="text-xs text-neutral-400 hover:text-black transition-colors uppercase tracking-widest mb-8 inline-block">
        &larr; 커뮤니티
      </Link>

      {/* Topic */}
      <article className="border border-neutral-200 p-6 mb-8">
        <div className="flex gap-5">
          {/* Upvote */}
          <div className="flex flex-col items-center shrink-0 pt-1">
            <button
              onClick={handleUpvoteTopic}
              className={`p-1 transition-colors ${topicVoted ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}
            >
              <svg className="w-5 h-5" fill={topicVoted ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
            <span className={`text-sm font-medium ${topicVoted ? "text-black" : "text-neutral-500"}`}>{topicUpvotes}</span>
          </div>

          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-medium text-black mb-4">{topic.title}</h1>
            <p className="text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap mb-4">{topic.content}</p>
            <div className="flex items-center gap-3 flex-wrap">
              {topic.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-neutral-100 text-xs text-neutral-600">#{tag}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-4 border-t border-neutral-100">
              <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-medium">
                {topic.author.charAt(0).toUpperCase()}
              </span>
              <span className="text-sm font-medium text-black">{topic.author}</span>
              <span className="text-xs text-neutral-400">{topic.createdAt}</span>
            </div>
          </div>
        </div>
      </article>

      {/* Comment Form */}
      <div className="border border-neutral-200 p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <span className="w-7 h-7 bg-black text-white flex items-center justify-center text-xs font-medium">
            {authorName.charAt(0).toUpperCase()}
          </span>
          <span className="text-sm font-medium">{authorName}</span>
          {!user && <span className="text-xs text-neutral-400">(로그인하면 이름으로 표시됩니다)</span>}
        </div>
        <form onSubmit={handleSubmitComment}>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="의견을 공유하세요..."
            rows={3}
            className="w-full px-4 py-3 border border-neutral-200 text-sm focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white"
          />
          <div className="flex justify-end mt-2">
            <button
              type="submit"
              disabled={!newComment.trim()}
              className="px-6 py-2 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              댓글 등록
            </button>
          </div>
        </form>
      </div>

      {/* Comments */}
      <div className="mb-4">
        <span className="text-xs text-neutral-400 uppercase tracking-wider">{comments.length}개의 댓글</span>
      </div>

      <div className="space-y-3">
        {topLevel.length === 0 && (
          <p className="text-neutral-400 text-center py-8 text-sm border border-neutral-200">
            아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
          </p>
        )}
        {topLevel.map((comment) => (
          <div key={comment.id} className="border border-neutral-200 p-5">
            <div className="flex gap-4">
              {/* Upvote */}
              <div className="flex flex-col items-center shrink-0">
                <button
                  onClick={() => handleUpvoteComment(comment.id)}
                  className={`p-0.5 transition-colors ${votedComments.has(comment.id) ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}
                >
                  <svg className="w-4 h-4" fill={votedComments.has(comment.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </button>
                <span className={`text-xs font-medium ${votedComments.has(comment.id) ? "text-black" : "text-neutral-400"}`}>
                  {comment.upvotes}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-6 h-6 bg-neutral-800 text-white flex items-center justify-center text-xs font-medium">
                    {comment.author.charAt(0).toUpperCase()}
                  </span>
                  <span className="font-medium text-sm text-black">{comment.author}</span>
                  <span className="text-xs text-neutral-400">{comment.createdAt}</span>
                </div>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap leading-relaxed mb-2">
                  {comment.content}
                </p>
                <button
                  onClick={() => {
                    setReplyTo(replyTo === comment.id ? null : comment.id);
                    setReplyContent("");
                  }}
                  className="text-xs text-neutral-400 hover:text-black font-medium uppercase tracking-wider transition-colors"
                >
                  {replyTo === comment.id ? "취소" : "답글"}
                </button>

                {/* Replies */}
                {getReplies(comment.id).map((reply) => (
                  <div key={reply.id} className="mt-4 pl-4 border-l-2 border-neutral-100">
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          onClick={() => handleUpvoteComment(reply.id)}
                          className={`p-0.5 transition-colors ${votedComments.has(reply.id) ? "text-black" : "text-neutral-300 hover:text-neutral-500"}`}
                        >
                          <svg className="w-3 h-3" fill={votedComments.has(reply.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                        </button>
                        <span className={`text-xs ${votedComments.has(reply.id) ? "text-black" : "text-neutral-400"}`}>
                          {reply.upvotes}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-5 h-5 bg-neutral-200 text-neutral-600 flex items-center justify-center text-xs">
                            {reply.author.charAt(0).toUpperCase()}
                          </span>
                          <span className="font-medium text-sm text-neutral-700">{reply.author}</span>
                          <span className="text-xs text-neutral-400">{reply.createdAt}</span>
                        </div>
                        <p className="text-sm text-neutral-600 whitespace-pre-wrap leading-relaxed">{reply.content}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Reply form */}
                {replyTo === comment.id && (
                  <form onSubmit={handleSubmitReply} className="mt-4 pl-4 border-l-2 border-neutral-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="w-5 h-5 bg-black text-white flex items-center justify-center text-xs">
                        {authorName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-xs text-neutral-500">{authorName}</span>
                    </div>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="답글을 작성하세요..."
                      rows={2}
                      className="w-full px-3 py-2 border border-neutral-200 text-sm focus:border-black focus:outline-none resize-none transition-colors bg-neutral-50 focus:bg-white"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="submit"
                        disabled={!replyContent.trim()}
                        className="px-4 py-1.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        답글 등록
                      </button>
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
