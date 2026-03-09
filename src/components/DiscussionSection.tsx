"use client";

import { useState, useEffect, useRef } from "react";
import { Discussion } from "@/types";

interface DiscussionSectionProps {
  problemId: string;
  initialDiscussions: Discussion[];
}

export default function DiscussionSection({ problemId, initialDiscussions }: DiscussionSectionProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>(initialDiscussions);
  const [newComment, setNewComment] = useState("");
  const [author, setAuthor] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(console.error);
    }
  }, [discussions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !author.trim()) return;

    const discussion: Discussion = {
      id: `disc-${Date.now()}`,
      problemId,
      author: author.trim(),
      content: newComment.trim(),
      createdAt: new Date().toISOString().split("T")[0],
      parentId: replyTo,
    };

    setDiscussions([...discussions, discussion]);
    setNewComment("");
    setReplyTo(null);
  };

  const topLevel = discussions.filter((d) => d.parentId === null);
  const getReplies = (parentId: string) => discussions.filter((d) => d.parentId === parentId);

  return (
    <div ref={sectionRef} className="mt-10">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">토론</h2>

      {/* Discussion list */}
      <div className="space-y-6 mb-8">
        {topLevel.length === 0 && (
          <p className="text-gray-500 text-center py-8">아직 토론이 없습니다. 첫 번째 댓글을 남겨보세요!</p>
        )}
        {topLevel.map((disc) => (
          <div key={disc.id} className="border border-gray-200 rounded-lg p-5 bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-cosmos-700">{disc.author}</span>
              <span className="text-xs text-gray-400">{disc.createdAt}</span>
            </div>
            <div className="text-gray-700 mb-3 whitespace-pre-wrap">{disc.content}</div>
            <button
              onClick={() => setReplyTo(replyTo === disc.id ? null : disc.id)}
              className="text-sm text-cosmos-600 hover:text-cosmos-800 font-medium"
            >
              {replyTo === disc.id ? "취소" : "답글"}
            </button>

            {/* Replies */}
            {getReplies(disc.id).map((reply) => (
              <div key={reply.id} className="ml-6 mt-4 pl-4 border-l-2 border-cosmos-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-cosmos-600 text-sm">{reply.author}</span>
                  <span className="text-xs text-gray-400">{reply.createdAt}</span>
                </div>
                <div className="text-gray-700 text-sm whitespace-pre-wrap">{reply.content}</div>
              </div>
            ))}

            {/* Reply form */}
            {replyTo === disc.id && (
              <form onSubmit={handleSubmit} className="ml-6 mt-4 pl-4 border-l-2 border-cosmos-200">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="답글을 작성하세요... (LaTeX 수식 사용 가능: $...$)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none resize-none"
                  rows={3}
                />
                <div className="flex gap-2 mt-2">
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="이름"
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-cosmos-600 text-white rounded-lg text-sm font-medium hover:bg-cosmos-700 transition-colors"
                  >
                    답글 등록
                  </button>
                </div>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* New comment form */}
      <div className="border border-gray-200 rounded-lg p-5 bg-white">
        <h3 className="font-semibold text-gray-900 mb-4">새 댓글 작성</h3>
        <form onSubmit={handleSubmit}>
          <textarea
            value={replyTo ? "" : newComment}
            onChange={(e) => {
              setReplyTo(null);
              setNewComment(e.target.value);
            }}
            placeholder="의견을 공유하세요... (LaTeX 수식 사용 가능: $...$ 또는 $$...$$)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none resize-none"
            rows={4}
          />
          <div className="flex gap-3 mt-3">
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="이름"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cosmos-500 focus:border-transparent outline-none"
            />
            <button
              type="submit"
              className="px-6 py-2 bg-cosmos-600 text-white rounded-lg font-medium hover:bg-cosmos-700 transition-colors"
            >
              댓글 등록
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
