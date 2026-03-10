"use client";

import { useState, useEffect, useRef } from "react";
import { supabase, withTimeout } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import LatexRenderer from "@/components/LatexRenderer";

interface Solution {
  id: string;
  problem_id: string;
  author_id: string | null;
  author_name: string;
  content: string;
  created_at: string;
}

export default function SolutionSection({ problemId }: { problemId: string }) {
  const { user } = useAuth();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [newSolution, setNewSolution] = useState("");
  const [isWriting, setIsWriting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mySolution = solutions.find((s) => s.author_id === user?.id);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchSolutions() {
      try {
        const { data } = await withTimeout(
          supabase.from("discussions").select("*").eq("problem_id", problemId).eq("is_solution", true).is("parent_id", null).order("created_at", { ascending: true }),
          5000, controller.signal
        );
        if (!controller.signal.aborted && data) setSolutions(data);
      } catch { /* ignore */ }
    }
    fetchSolutions();
    return () => controller.abort();
  }, [problemId]);

  useEffect(() => {
    if (sectionRef.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([sectionRef.current]).catch(console.error);
    }
  }, [solutions]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSolution.trim() || !user) return;

    const { data, error } = await supabase
      .from("discussions")
      .insert({
        problem_id: problemId,
        author_id: user.id,
        author_name: user.name,
        content: newSolution.trim(),
        is_solution: true,
        parent_id: null,
      })
      .select()
      .single();

    if (!error && data) {
      setSolutions([...solutions, data]);
      setNewSolution("");
      setIsWriting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editContent.trim() || !editingId) return;

    const { error } = await supabase
      .from("discussions")
      .update({ content: editContent.trim() })
      .eq("id", editingId);

    if (!error) {
      setSolutions(solutions.map((s) =>
        s.id === editingId ? { ...s, content: editContent.trim() } : s
      ));
      setEditingId(null);
      setEditContent("");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("풀이를 삭제하시겠습니까?")) return;

    const { error } = await supabase
      .from("discussions")
      .delete()
      .eq("id", id);

    if (!error) {
      setSolutions(solutions.filter((s) => s.id !== id));
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toISOString().split("T")[0];

  return (
    <div ref={sectionRef}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-light text-black">풀이 공유</h2>
          <span className="text-xs text-neutral-400">{solutions.length}개의 풀이</span>
        </div>
        {user && !mySolution && !isWriting && (
          <button
            onClick={() => setIsWriting(true)}
            className="px-5 py-2 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            내 풀이 작성
          </button>
        )}
      </div>

      {/* Submit form */}
      {isWriting && (
        <form onSubmit={handleSubmit} className="border border-neutral-200 p-5 mb-6 animate-fade-slide-up">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs font-medium text-black">{user?.name}</span>
          </div>
          <textarea
            value={newSolution}
            onChange={(e) => setNewSolution(e.target.value)}
            placeholder={"나만의 풀이를 작성하세요. LaTeX 수식을 사용할 수 있습니다.\n인라인: $E = mc^2$\n블록: $$\\int_0^\\infty e^{-x} dx = 1$$"}
            className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none resize-none text-xs transition-colors bg-neutral-50 focus:bg-white font-mono"
            rows={8}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => { setIsWriting(false); setNewSolution(""); }}
              className="px-5 py-2 border border-neutral-300 text-neutral-500 text-xs font-medium tracking-widest uppercase hover:border-black hover:text-black transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!newSolution.trim()}
              className="px-5 py-2 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              풀이 등록
            </button>
          </div>
        </form>
      )}

      {/* Solutions list */}
      {solutions.length === 0 && !isWriting ? (
        <p className="text-neutral-400 text-center py-8 text-xs">
          아직 공유된 풀이가 없습니다. {user ? "첫 번째 풀이를 작성해보세요!" : "로그인 후 풀이를 작성할 수 있습니다."}
        </p>
      ) : (
        <div className="space-y-4">
          {solutions.map((solution) => {
            const isExpanded = expandedIds.has(solution.id);
            return (
              <div key={solution.id} className={`border ${solution.author_id === user?.id ? "border-blue-200 bg-blue-50/20" : "border-neutral-200"}`}>
                <button
                  type="button"
                  onClick={() => toggleExpand(solution.id)}
                  className="w-full p-4 sm:p-6 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-8 h-8 bg-neutral-800 text-white flex items-center justify-center text-xs font-medium shrink-0">
                      {solution.author_name.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <span className="font-medium text-black text-xs">{solution.author_name}</span>
                      {solution.author_id === user?.id && (
                        <span className="ml-2 text-[10px] text-blue-500 font-medium uppercase tracking-wider">내 풀이</span>
                      )}
                      <span className="text-xs text-neutral-400 ml-2">{formatDate(solution.created_at)}</span>
                    </div>
                  </div>
                  <svg className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div className="animate-expand" data-collapsed={!isExpanded}>
                  <div className="animate-expand-inner">
                    {isExpanded && (
                      <div className="px-4 sm:px-6 pb-4 sm:pb-6 animate-fade-slide-up">
                        {solution.author_id === user?.id && editingId !== solution.id && (
                          <div className="flex items-center gap-2 mb-3 pl-11">
                            <button
                              onClick={() => { setEditingId(solution.id); setEditContent(solution.content); }}
                              className="text-xs text-neutral-400 hover:text-black transition-colors uppercase tracking-wider"
                            >
                              수정
                            </button>
                            <button
                              onClick={() => handleDelete(solution.id)}
                              className="text-xs text-neutral-400 hover:text-red-500 transition-colors uppercase tracking-wider"
                            >
                              삭제
                            </button>
                          </div>
                        )}

                        {editingId === solution.id ? (
                          <form onSubmit={handleEdit} className="animate-fade-slide-up">
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none resize-none text-xs transition-colors font-mono"
                              rows={8}
                            />
                            <div className="flex justify-end gap-2 mt-3">
                              <button
                                type="button"
                                onClick={() => { setEditingId(null); setEditContent(""); }}
                                className="px-4 py-1.5 border border-neutral-300 text-neutral-500 text-xs font-medium tracking-widest uppercase hover:border-black hover:text-black transition-colors"
                              >
                                취소
                              </button>
                              <button
                                type="submit"
                                disabled={!editContent.trim()}
                                className="px-4 py-1.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-30"
                              >
                                수정 완료
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="pl-11">
                            <LatexRenderer content={solution.content} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
