"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext";
import { getDisplayText } from "@/lib/multilang";

const ContributionHeatmap = dynamic(() => import("@/components/ContributionHeatmap"), {
  ssr: false,
  loading: () => <div className="border border-neutral-200 p-6 h-48 animate-pulse bg-neutral-50" />,
});

interface PublicProfile {
  id: string;
  name: string;
  bio: string;
  created_at: string;
}

interface SolveRecord {
  problem_id: string;
  created_at: string;
  problem_number: number;
  title: string;
  source: string;
}

interface PublicProfileContentProps {
  profile: PublicProfile;
  solvedCount: number;
  solutionCount: number;
  discussionCount: number;
  solvedDates: string[];
  solveHistory: SolveRecord[];
}

export default function PublicProfileContent({
  profile,
  solvedCount,
  solutionCount,
  discussionCount,
  solvedDates,
  solveHistory,
}: PublicProfileContentProps) {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (user && user.id === profile.id) {
      router.replace("/profile");
    }
  }, [user, profile.id, router]);

  const joinDate = new Date(profile.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group solve history by date
  const groupedHistory: Record<string, SolveRecord[]> = {};
  for (const record of solveHistory) {
    const dateStr = new Date(record.created_at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groupedHistory[dateStr]) groupedHistory[dateStr] = [];
    groupedHistory[dateStr].push(record);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border border-neutral-200 p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-2xl font-light">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-light mb-1">{profile.name}</h1>
            {profile.bio && <p className="text-sm text-neutral-500 mb-2">{profile.bio}</p>}
            <p className="text-xs text-neutral-400">{t("profile.joinDate", { date: joinDate })}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{solvedCount}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">{t("profile.solved")}</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{solutionCount}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">{t("profile.solutions")}</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{discussionCount}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">{t("profile.discussions")}</div>
        </div>
      </div>

      {/* Contribution Heatmap */}
      <section className="mb-8">
        <ContributionHeatmap solvedDates={solvedDates} />
      </section>

      {/* Solve History */}
      <section className="mb-8">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">{t("profile.heatmap")}</h2>
        {solveHistory.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">{t("profile.emptyHistory")}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, records]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-medium text-neutral-600">{date}</h3>
                  <span className="text-xs text-neutral-400">{records.length}{t("contests.problems")}</span>
                </div>
                <div className="space-y-1.5 ml-5 border-l border-neutral-200 pl-4">
                  {records.map((record, i) => (
                    <Link
                      key={`${record.problem_id}-${i}`}
                      href={`/problems/${record.problem_id}`}
                      className="block border border-emerald-300 p-3 hover:border-black transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center shrink-0" title={t("problems.solved")}>
                          <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            {record.problem_number > 0 && <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{record.problem_number}</span>}
                            <span className="text-sm font-medium truncate">{getDisplayText(record.title)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-xs text-neutral-400">{record.source}</span>
                          <span className="text-[10px] text-neutral-300">
                            {new Date(record.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
