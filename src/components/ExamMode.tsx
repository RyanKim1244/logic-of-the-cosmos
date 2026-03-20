"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { Problem } from "@/types";
import LatexRenderer from "@/components/LatexRenderer";

interface ExamModeProps {
  problemSetId: string;
  problemSetTitle: string;
  problems: (Problem & { orderIndex: number })[];
  timeLimitMinutes: number;
}

export default function ExamMode({ problemSetId, problemSetTitle, problems, timeLimitMinutes }: ExamModeProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(timeLimitMinutes * 60);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  const currentProblem = problems[currentIndex];
  const answeredCount = Object.keys(answers).filter((k) => answers[k].trim()).length;

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getTimerColor = () => {
    const totalSeconds = timeLimitMinutes * 60;
    const ratio = remainingSeconds / totalSeconds;
    if (ratio <= 0.1) return "text-red-600";
    if (ratio <= 0.25) return "text-amber-600";
    return "text-neutral-800";
  };

  const finishExam = useCallback(async (isTimeout = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFinished(true);

    if (sessionId && user) {
      await supabase
        .from("exam_sessions")
        .update({
          finished_at: new Date().toISOString(),
          answers,
        })
        .eq("id", sessionId);
    }

    if (isTimeout) {
      // Could show a toast/notification
    }
  }, [sessionId, user, answers]);

  useEffect(() => {
    if (started && !finished) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            finishExam(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started, finished, finishExam]);

  const handleStart = async () => {
    startTimeRef.current = new Date();
    setStarted(true);
    setRemainingSeconds(timeLimitMinutes * 60);

    if (user) {
      const { data } = await supabase
        .from("exam_sessions")
        .insert({
          user_id: user.id,
          problem_set_id: problemSetId,
          time_limit_minutes: timeLimitMinutes,
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (data) setSessionId(data.id);
    }
  };

  const handleAnswer = (problemId: string, value: string) => {
    setAnswers({ ...answers, [problemId]: value });
  };

  // Start screen
  if (!started) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20">
        <div className="border border-neutral-200 p-12">
          <h2 className="text-2xl font-light mb-4">{t("exam.title")}</h2>
          <p className="text-lg font-light mb-2">{problemSetTitle}</p>
          <div className="flex items-center justify-center gap-6 text-sm text-neutral-500 mb-8">
            <span>{problems.length}{t("problemSets.problems")}</span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {timeLimitMinutes}{t("problemSets.minutes")}
            </span>
          </div>

          <div className="border border-neutral-200 p-6 mb-8 text-left">
            <h4 className="text-xs text-neutral-400 uppercase tracking-widest mb-3">{t("exam.instructions")}</h4>
            <ul className="text-sm text-neutral-500 space-y-2">
              <li>- {t("exam.timerStart")}</li>
              <li>- {t("exam.autoSubmit")}</li>
              <li>- {t("exam.freeNav")}</li>
              <li>- {t("exam.earlySubmit")}</li>
            </ul>
          </div>

          <button
            onClick={handleStart}
            className="px-8 py-3 bg-black text-white text-sm tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            {t("exam.start")}
          </button>
        </div>
      </div>
    );
  }

  // Finished screen
  if (finished) {
    const elapsed = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000)
      : timeLimitMinutes * 60;

    return (
      <div className="max-w-2xl mx-auto py-16">
        <div className="border border-neutral-200 p-12 text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-light mb-2">{t("exam.completed")}</h2>
          <p className="text-sm text-neutral-500 mb-6">{problemSetTitle}</p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-neutral-200 p-4">
              <div className="text-2xl font-extralight">{answeredCount}</div>
              <div className="text-xs text-neutral-400 mt-1">{t("exam.answered")}</div>
            </div>
            <div className="border border-neutral-200 p-4">
              <div className="text-2xl font-extralight">{problems.length}</div>
              <div className="text-xs text-neutral-400 mt-1">{t("exam.totalProblems")}</div>
            </div>
            <div className="border border-neutral-200 p-4">
              <div className="text-2xl font-extralight">{formatTime(elapsed)}</div>
              <div className="text-xs text-neutral-400 mt-1">{t("exam.elapsed")}</div>
            </div>
          </div>
        </div>

        {/* Review answers */}
        <div className="space-y-4">
          <h3 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">{t("exam.reviewAnswers")}</h3>
          {problems.map((p, i) => (
            <div key={p.id} className="border border-neutral-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-neutral-300 font-mono">Q{i + 1}</span>
                <span className="text-sm font-medium">{p.title}</span>
                {answers[p.id]?.trim() ? (
                  <span className="ml-auto text-xs text-emerald-500">{t("exam.written")}</span>
                ) : (
                  <span className="ml-auto text-xs text-neutral-300">{t("exam.notWritten")}</span>
                )}
              </div>
              {answers[p.id]?.trim() && (
                <div className="mt-2 text-sm text-neutral-600 bg-neutral-50 p-3">
                  {answers[p.id]}
                </div>
              )}
              <Link
                href={`/problems/${p.id}`}
                className="text-xs text-black hover:underline mt-2 inline-block"
              >
                {t("exam.viewSolution")} &rarr;
              </Link>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link
            href={`/problem-sets/${problemSetId}`}
            className="px-6 py-2.5 border border-neutral-200 text-sm tracking-widest uppercase hover:border-black transition-colors inline-block"
          >
            {t("exam.backToSet")}
          </Link>
        </div>
      </div>
    );
  }

  // Exam in progress
  return (
    <div className="max-w-4xl mx-auto">
      {/* Sticky timer bar */}
      <div className="sticky top-14 sm:top-16 z-40 bg-white border-b border-neutral-200 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-4">
            <span className="text-xs text-neutral-400 uppercase tracking-widest">{problemSetTitle}</span>
            <span className="text-xs text-neutral-300">
              Q{currentIndex + 1} / {problems.length}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className={`font-mono text-lg font-light ${getTimerColor()}`}>
              {formatTime(remainingSeconds)}
            </div>
            <button
              onClick={() => finishExam(false)}
              className="px-4 py-1.5 border border-neutral-200 text-xs tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors"
            >
              {t("exam.finish")}
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex gap-1 mt-2">
          {problems.map((p, i) => (
            <button
              key={p.id}
              onClick={() => setCurrentIndex(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === currentIndex
                  ? "bg-black"
                  : answers[p.id]?.trim()
                    ? "bg-emerald-400"
                    : "bg-neutral-200"
              }`}
              title={t("exam.problem", { num: i + 1 })}
            />
          ))}
        </div>
      </div>

      {/* Problem content */}
      <div className="px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs text-neutral-300 font-mono">Q{currentIndex + 1}</span>
            {currentProblem.problemNumber > 0 && (
              <span className="text-[10px] text-neutral-300 font-mono">#{currentProblem.problemNumber}</span>
            )}
            <span className="text-xs text-neutral-400">{currentProblem.source} {currentProblem.year}</span>
          </div>
          <h3 className="text-lg font-medium mb-6">{currentProblem.title}</h3>

          {/* Problem content */}
          <div className="border border-neutral-200 p-6 mb-6">
            <LatexRenderer content={currentProblem.content || ""} />
          </div>
        </div>

        {/* Answer area */}
        <div className="mb-8">
          <label className="text-xs text-neutral-400 uppercase tracking-widest block mb-2">{t("exam.answer")}</label>
          <textarea
            value={answers[currentProblem.id] || ""}
            onChange={(e) => handleAnswer(currentProblem.id, e.target.value)}
            placeholder={t("exam.answerPlaceholder")}
            rows={6}
            className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none resize-y"
          />
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-5 py-2.5 border border-neutral-200 text-xs tracking-widest uppercase hover:border-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {t("exam.previous")}
          </button>

          <div className="flex gap-2">
            {problems.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-8 h-8 text-xs transition-colors ${
                  i === currentIndex
                    ? "bg-black text-white"
                    : answers[problems[i].id]?.trim()
                      ? "border border-emerald-400 text-emerald-600"
                      : "border border-neutral-200 text-neutral-400 hover:border-black"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (currentIndex === problems.length - 1) {
                finishExam(false);
              } else {
                setCurrentIndex(currentIndex + 1);
              }
            }}
            className={`px-5 py-2.5 text-xs tracking-widest uppercase transition-colors ${
              currentIndex === problems.length - 1
                ? "bg-black text-white hover:bg-neutral-800"
                : "border border-neutral-200 hover:border-black"
            }`}
          >
            {currentIndex === problems.length - 1 ? t("exam.submit") : t("exam.next")}
          </button>
        </div>
      </div>
    </div>
  );
}
