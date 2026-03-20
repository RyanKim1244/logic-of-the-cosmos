"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from '@/i18n/navigation';
import dynamic from "next/dynamic";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getDisplayText } from "@/lib/multilang";
import type { Problem } from "@/types";

const ExamMode = dynamic(() => import("@/components/ExamMode"), { ssr: false });

interface SetProblem extends Problem {
  orderIndex: number;
}

interface SetDetail {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  ownerName: string;
  isPublic: boolean;
  timeLimitMinutes: number | null;
  createdAt: string;
}

export default function ProblemSetDetailContent({ setId }: { setId: string }) {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const [setDetail, setSetDetail] = useState<SetDetail | null>(null);
  const [problems, setProblems] = useState<SetProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [examMode, setExamMode] = useState(false);

  const isOwner = user?.id === setDetail?.ownerId;

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data: setData } = await supabase
        .from("problem_sets")
        .select("*")
        .eq("id", setId)
        .single();

      if (!setData || cancelled) {
        setLoading(false);
        return;
      }

      // Fetch owner name
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", setData.owner_id)
        .single();

      setSetDetail({
        id: setData.id,
        title: setData.title,
        description: setData.description || "",
        ownerId: setData.owner_id,
        ownerName: ownerProfile?.name || t("common.unknown"),
        isPublic: setData.is_public,
        timeLimitMinutes: setData.time_limit_minutes,
        createdAt: setData.created_at,
      });

      // Fetch problem items
      const { data: items } = await supabase
        .from("problem_set_items")
        .select("problem_id, order_index")
        .eq("set_id", setId)
        .order("order_index");

      if (items && items.length > 0 && !cancelled) {
        const problemIds = items.map((item) => item.problem_id);
        const { data: problemsData } = await supabase
          .from("problems")
          .select("id, problem_number, title, source, year, tags, content, official_solution, created_at, updated_at")
          .in("id", problemIds);

        if (problemsData && !cancelled) {
          const orderMap = new Map(items.map((item) => [item.problem_id, item.order_index]));
          const mapped: SetProblem[] = problemsData.map((p) => ({
            id: p.id,
            problemNumber: p.problem_number,
            title: p.title,
            source: p.source,
            year: p.year,
            tags: p.tags,
            content: p.content,
            officialSolution: p.official_solution,
            createdAt: p.created_at,
            updatedAt: p.updated_at,
            orderIndex: orderMap.get(p.id) ?? 0,
          }));
          mapped.sort((a, b) => a.orderIndex - b.orderIndex);
          setProblems(mapped);
        }
      }

      if (!cancelled) setLoading(false);
    })();

    return () => { cancelled = true; };
  }, [setId]);

  const handleDelete = async () => {
    if (!isOwner) return;
    await supabase.from("problem_sets").delete().eq("id", setId);
    router.push("/problem-sets");
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-100 rounded w-64" />
          <div className="h-4 bg-neutral-50 rounded w-96" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-50 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!setDetail) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-neutral-400">{t("problemSets.notFound")}</p>
        <Link href="/problem-sets" className="text-sm text-black hover:underline mt-4 inline-block">
          {t("problemSets.backToList")} &rarr;
        </Link>
      </div>
    );
  }

  // Exam mode
  if (examMode && setDetail.timeLimitMinutes) {
    return (
      <ExamMode
        problemSetId={setId}
        problemSetTitle={setDetail.title}
        problems={problems}
        timeLimitMinutes={setDetail.timeLimitMinutes}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="border border-neutral-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-2xl font-light">{setDetail.title}</h1>
              {!setDetail.isPublic && (
                <span className="text-[10px] px-1.5 py-0.5 border border-neutral-200 text-neutral-400 uppercase">
                  {t("problemSets.private")}
                </span>
              )}
            </div>
            {setDetail.description && (
              <p className="text-sm text-neutral-500 mb-3">{setDetail.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span>{setDetail.ownerName}</span>
              <span>{problems.length}{t("problemSets.problems")}</span>
              {setDetail.timeLimitMinutes && (
                <span className="flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {setDetail.timeLimitMinutes}{t("problemSets.minutes")}
                </span>
              )}
              <span className="text-neutral-300">
                {new Date(setDetail.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            {setDetail.timeLimitMinutes && problems.length > 0 && (
              <button
                onClick={() => setExamMode(true)}
                className="px-5 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
              >
                {t("problemSets.startExam")}
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 border border-neutral-200 text-xs text-neutral-400 tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors"
              >
                {t("common.delete")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Start exam CTA for sets without time limit */}
      {!setDetail.timeLimitMinutes && problems.length > 0 && (
        <div className="border border-dashed border-neutral-300 p-6 mb-8 text-center">
          <p className="text-sm text-neutral-500 mb-3">
            {t("problemSets.noTimeLimit")}
          </p>
        </div>
      )}

      {/* Problem List */}
      <section>
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-4">{t("problems.title")}</h2>
        {problems.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">{t("problemSets.emptySet")}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {problems.map((p, i) => (
              <Link
                key={p.id}
                href={`/problems/${p.id}`}
                className="block border border-neutral-200 p-4 hover:border-black transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-neutral-300 font-mono w-8 shrink-0">{i + 1}.</span>
                  {p.problemNumber > 0 && (
                    <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{p.problemNumber}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium truncate block">{getDisplayText(p.title)}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-neutral-400">{p.source}</span>
                    <span className="text-xs text-neutral-300">{p.year}</span>
                  </div>
                </div>
                {p.tags.length > 0 && (
                  <div className="flex gap-1 mt-2 ml-8">
                    {p.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-neutral-50 text-neutral-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
