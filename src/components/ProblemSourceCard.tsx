"use client";

import { useLanguage } from "@/context/LanguageContext";

interface ProblemSourceCardProps {
  source: string;
  problemUrl?: string | null;
  solutionUrl?: string | null;
}

export default function ProblemSourceCard({ source, problemUrl, solutionUrl }: ProblemSourceCardProps) {
  const { t, locale } = useLanguage();

  return (
    <div className="border border-neutral-200 rounded-xl mb-6">
      <div className="px-8 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <p className="text-base font-medium text-black">{source}</p>

        <div className="flex items-center gap-3 shrink-0">
          {/* Problem link */}
          {problemUrl ? (
            <a
              href={problemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3 bg-black text-white text-xs font-medium tracking-widest hover:bg-neutral-800 transition-colors rounded-lg"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {t.problemDetail.viewProblem}
            </a>
          ) : (
            <div className="inline-flex items-center gap-2 px-6 py-3 border border-neutral-200 text-xs text-neutral-400 cursor-not-allowed rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.problemDetail.linkPreparing}
            </div>
          )}

          {solutionUrl && (
            <a
              href={solutionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 px-6 py-3 border border-neutral-200 text-black text-xs font-medium tracking-widest hover:border-black hover:bg-neutral-50 transition-colors rounded-lg"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {locale === "ko" ? "풀이 보기" : "View Solution"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
