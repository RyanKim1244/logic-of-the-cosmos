"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { Problem, ContestPreview } from "@/types";
import ProblemCard from "@/components/ProblemCard";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";


interface HomeStats {
  problems: number;
  contests: number;
  discussions: number;
  authors: number;
}

interface HomeContentProps {
  initialProblems: Problem[];
  initialContests: ContestPreview[];
  initialStats: HomeStats;
  initialProblemCounts: Record<string, number>;
}

export default function HomeContent({
  initialProblems,
  initialContests,
  initialStats,
  initialProblemCounts,
}: HomeContentProps) {
  const { user } = useAuth();
  const [recentProblems, setRecentProblems] = useState<Problem[]>(initialProblems);
  const [topContests, setTopContests] = useState<ContestPreview[]>(initialContests);
  const [stats, setStats] = useState<HomeStats>(initialStats);
  const [problemCounts, setProblemCounts] = useState<Record<string, number>>(initialProblemCounts);
  const [statsConfirmed, setStatsConfirmed] = useState(
    initialStats.problems > 0 || initialStats.contests > 0 || initialStats.discussions > 0 || initialStats.authors > 0
  );

  useEffect(() => {
    // Seed in-memory cache with server data so SPA navigations are instant
    if (initialProblems.length > 0 && !getCached("homeRecentProblems", true)) {
      setCache("homeRecentProblems", initialProblems);
    }
    if (initialContests.length > 0 && !getCached("homeContests", true)) {
      setCache("homeContests", initialContests);
    }
    if (initialStats.problems > 0 && !getCached("homeStats", true)) {
      setCache("homeStats", initialStats);
    }
    if (Object.keys(initialProblemCounts).length > 0 && !getCached("homeProblemCounts", true)) {
      setCache("homeProblemCounts", initialProblemCounts);
    }
  }, [initialProblems, initialContests, initialStats, initialProblemCounts]);

  useEffect(() => {
    let controller = new AbortController();

    async function fetchData() {
      // Serve stale in-memory cache (for SPA navigation)
      const cachedProblems = getCached<Problem[]>("homeRecentProblems", true);
      const cachedContests = getCached<ContestPreview[]>("homeContests", true);
      const cachedStats = getCached<HomeStats>("homeStats", true);
      const cachedCounts = getCached<Record<string, number>>("homeProblemCounts", true);

      if (cachedProblems) setRecentProblems(cachedProblems);
      if (cachedContests) setTopContests(cachedContests);
      if (cachedStats) {
        setStats(cachedStats);
        setStatsConfirmed(true);
      }
      if (cachedCounts) setProblemCounts(cachedCounts);

      // If all caches are fresh, no need to refetch
      if (cachedProblems && cachedContests && cachedStats && cachedCounts &&
          !isCacheStale("homeRecentProblems") && !isCacheStale("homeContests") &&
          !isCacheStale("homeStats") && !isCacheStale("homeProblemCounts")) {
        return;
      }

      try {
        const sig = controller.signal;

        const results = await Promise.allSettled([
          withRetry(() => withTimeout(supabase.from("problems").select("id, problem_number, title, source, year, tags, created_at, updated_at").order("created_at", { ascending: false }).limit(3), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("contests").select("id, name, short_name, years").limit(4), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("problems").select("*", { count: "exact", head: true }), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("contests").select("*", { count: "exact", head: true }), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("discussions").select("*", { count: "exact", head: true }), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("discussions").select("author_name"), 6000, sig), 1, 800, sig),
          withRetry(() => withTimeout(supabase.from("problems").select("source"), 6000, sig), 1, 800, sig),
        ]);

        if (controller.signal.aborted) return;

        // Log errors for debugging
        const queryNames = ["problems", "contests", "problemCount", "contestCount", "discussionCount", "authorData", "problemSources"];
        results.forEach((res, i) => {
          if (res.status === "rejected") {
            console.error(`[Home] ${queryNames[i]} rejected:`, res.reason);
          } else if (res.value.error) {
            console.error(`[Home] ${queryNames[i]} error:`, res.value.error.message);
          }
        });

        const problemsRes = results[0].status === "fulfilled" && !results[0].value.error ? results[0].value : null;
        const contestsRes = results[1].status === "fulfilled" && !results[1].value.error ? results[1].value : null;
        const problemCountRes = results[2].status === "fulfilled" && !results[2].value.error ? results[2].value : null;
        const contestCountRes = results[3].status === "fulfilled" && !results[3].value.error ? results[3].value : null;
        const discussionCountRes = results[4].status === "fulfilled" && !results[4].value.error ? results[4].value : null;
        const authorDataRes = results[5].status === "fulfilled" && !results[5].value.error ? results[5].value : null;
        const problemSourcesRes = results[6].status === "fulfilled" && !results[6].value.error ? results[6].value : null;

        /* eslint-disable @typescript-eslint/no-explicit-any */
        let mappedProblems: Problem[] | undefined;
        if (problemsRes?.data && problemsRes.data.length > 0) {
          mappedProblems = (problemsRes.data as any[]).map((p) => ({
            id: p.id, problemNumber: p.problem_number, title: p.title, source: p.source,
            year: p.year, tags: p.tags, content: p.content || "", officialSolution: p.official_solution || "",
            createdAt: p.created_at, updatedAt: p.updated_at,
          }));
          /* eslint-enable @typescript-eslint/no-explicit-any */
          setRecentProblems(mappedProblems);
          setCache("homeRecentProblems", mappedProblems);
        }

        if (contestsRes?.data && contestsRes.data.length > 0) {
          setTopContests(contestsRes.data);
          setCache("homeContests", contestsRes.data);
        }

        const uniqueAuthors = authorDataRes?.data ? new Set(authorDataRes.data.map((d: { author_name: string }) => d.author_name)).size : 0;
        const newStats = {
          problems: problemCountRes?.count ?? 0,
          contests: contestCountRes?.count ?? 0,
          discussions: discussionCountRes?.count ?? 0,
          authors: uniqueAuthors,
        };
        setStats(newStats);
        setStatsConfirmed(true);
        setCache("homeStats", newStats);

        let newCounts: Record<string, number> = {};
        if (contestsRes?.data && contestsRes.data.length > 0 && problemSourcesRes?.data && problemSourcesRes.data.length > 0) {
          const allSources = problemSourcesRes.data;
          for (const c of contestsRes.data) {
            const shortLower = c.short_name.toLowerCase();
            newCounts[c.id] = allSources.filter((p: { source: string }) => p.source.toLowerCase().includes(shortLower)).length;
          }
          setProblemCounts(newCounts);
          setCache("homeProblemCounts", newCounts);
        }
      } catch {
        // On fetch failure, keep existing state
      }
    }

    // Refresh on mount (stale-while-revalidate: show server data, update in background)
    fetchData();

    // When user returns to this tab, re-fetch (but keep existing data visible)
    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller = new AbortController();
        fetchData();
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  return (
    <div>
      {/* ── Hero ── */}
      <section className="hero-gradient text-white py-40 md:py-56 relative overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <span className="section-label text-neutral-500 mb-6 inline-block">Beautiful Science</span>
          </ScrollReveal>
          <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extralight mb-6 tracking-tight hero-title leading-none">
            Logic of The <span className="hero-gradient-text">Cosmos</span>
          </h1>
          <div className="w-20 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent mx-auto mb-8 hero-line" />
          <p className="text-xl md:text-2xl text-neutral-400 mb-14 max-w-2xl mx-auto font-light hero-subtitle tracking-wide">
            과학의 모든 영역을 탐구하는 거대한 토론의 장
          </p>
          <div className="flex items-center justify-center gap-3 hero-cta flex-wrap">
            <Link href="/problems" className="hero-btn-v2-primary">
              문제 풀러 가기
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link href="/contests" className="hero-btn-v2-outline">기출문제</Link>
          </div>
        </div>
      </section>

      {/* ── Quote ── */}
      <section className="py-24 quote-section border-b border-neutral-100 relative overflow-hidden">
        <div className="quote-float-1 absolute top-10 left-[10%] w-72 h-72 bg-blue-100/20 rounded-full blur-3xl pointer-events-none" />
        <div className="quote-float-2 absolute bottom-10 right-[10%] w-60 h-60 bg-purple-100/20 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <blockquote className="relative">
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-7xl text-neutral-200/70 font-serif select-none quote-mark leading-none">&ldquo;</span>
              <p className="text-base sm:text-lg md:text-xl font-light text-neutral-700 leading-relaxed italic mb-4 pt-4">
                &ldquo;지구는 인류의 요람이다. 그러나 영원히 요람 속에 머물 수는 없다.&rdquo;
              </p>
              <p className="text-sm text-neutral-400 italic mb-6">
                &ldquo;Земля — колыбель разума, но нельзя вечно жить в колыбели.&rdquo;
              </p>
              <div className="w-10 h-px bg-neutral-300 mx-auto mb-5" />
              <footer className="text-sm text-neutral-400 tracking-wide">
                <span className="font-medium text-neutral-600">Konstantin Tsiolkovsky</span>
                <span className="mx-2 text-neutral-300">/</span>
                <span className="text-neutral-500">콘스탄틴 치올콥스키</span>
                <span className="mx-2 text-neutral-300">/</span>
                <span className="font-mono text-neutral-400 text-xs">1857 – 1935</span>
              </footer>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-20 bg-neutral-50 border-b border-neutral-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.025] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <p className="section-label text-center mb-10">Platform Overview</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {[
              { label: "총 문제 수", value: stats?.problems ?? 0 },
              { label: "등록 대회", value: stats?.contests ?? 0 },
              { label: "토론 수", value: stats?.discussions ?? 0 },
              { label: "참여자 수", value: stats?.authors ?? 0 },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 80}>
                <div className="stat-card-v2">
                  <div className="stat-number mb-2">
                    {statsConfirmed
                      ? <CountUp target={stat.value} />
                      : <span className="inline-block w-14 h-10 skeleton rounded" />
                    }
                  </div>
                  <div className="text-[11px] text-neutral-400 uppercase tracking-[0.22em]">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contests Preview ── */}
      <section className="py-24 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <span className="section-label">Archives</span>
                <h2 className="text-3xl md:text-4xl font-light text-black">기출문제 아카이브</h2>
                <p className="text-sm text-neutral-400 mt-2">국제 올림피아드부터 대학 기출까지, 연도별로 정리된 문제를 풀어보세요</p>
              </div>
              <Link href="/contests" className="link-arrow mb-1 shrink-0">
                전체 보기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topContests.map((contest, i) => (
              <ScrollReveal key={contest.id} delay={i * 80}>
                <Link href={`/contests/${contest.id}`} className="block h-full">
                  <div className="contest-card-v2">
                    <span className="text-[10px] font-semibold text-neutral-300 uppercase tracking-[0.2em] mb-3 block">{contest.short_name}</span>
                    <h3 className="text-[15px] font-medium text-neutral-800 mb-3 flex-1 leading-snug">{contest.name}</h3>
                    <div className="mt-auto flex items-center justify-between pt-3 border-t border-neutral-100 text-xs text-neutral-400">
                      <span className="font-mono">{contest.years.length > 0 ? `${contest.years[contest.years.length - 1]}–${contest.years[0]}` : ""}</span>
                      <span className="font-medium text-neutral-600">{problemCounts[contest.id] || 0}문제</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Problems ── */}
      <section className="py-24 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="section-label">Recently Added</span>
                <h2 className="text-3xl md:text-4xl font-light text-black">최근 문제</h2>
              </div>
              <Link href="/problems" className="link-arrow mb-1 shrink-0">
                전체 보기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </ScrollReveal>
          <div className="space-y-2">
            {recentProblems.map((problem, i) => (
              <ScrollReveal key={problem.id} delay={i * 80}>
                <ProblemCard problem={problem} />
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-neutral-200 relative overflow-hidden">
        <div className="features-glow-1 absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="features-glow-2 absolute bottom-0 right-1/4 w-80 h-80 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <p className="section-label text-center text-neutral-400 mb-4">Why LOTC</p>
            <h2 className="text-3xl md:text-5xl font-extralight text-center text-black mb-3 tracking-tight">열린 과학 토론의 장</h2>
            <p className="text-neutral-500 text-sm text-center mb-16 tracking-wide">분야와 수준의 경계를 넘어, 함께 탐구하는 커뮤니티</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                symbol: "∞",
                title: "경계 없는 탐구",
                desc: "중등 올림피아드부터 대학원 연구 문제까지, 물리·화학·생물·수학·지구과학 전 분야를 다룹니다.",
              },
              {
                symbol: "⇌",
                title: "실시간 토론",
                desc: "각 문제마다 토론 스레드가 열립니다. 풀이를 공유하고, 다른 접근법을 제시하며 깊이 있는 대화를 나누세요.",
              },
              {
                symbol: "✦",
                title: "문제 학습 AI",
                desc: "AI 튜터가 문제 풀이를 도와줍니다. 힌트 요청, 개념 질문, 풀이 검증까지 자유롭게 대화하세요.",
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 120}>
                <div className="feature-card-v2 group bg-white border border-neutral-200 rounded-xl">
                  <div className="w-12 h-12 border border-neutral-200 rounded-lg flex items-center justify-center mb-6 group-hover:border-neutral-400 transition-colors">
                    <span className="text-xl font-light text-neutral-400 group-hover:text-black transition-colors">{feature.symbol}</span>
                  </div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.15em] mb-3 text-neutral-800 group-hover:text-black transition-colors">{feature.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-700 transition-colors">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Quick Links ── */}
      <section className="py-24 bg-neutral-50 border-b border-neutral-100 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.4] pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <p className="section-label text-center mb-3">Explore</p>
            <h2 className="text-3xl md:text-4xl font-light text-center text-black mb-12">빠른 탐색</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              {
                href: "/problems",
                symbol: "?",
                title: "문제 목록",
                desc: "태그와 출처로 문제를 검색하고, 번호로 빠르게 찾아보세요.",
                meta: statsConfirmed ? `${stats.problems}개의 문제` : "—",
              },
              {
                href: "/contests",
                symbol: "#",
                title: "기출문제",
                desc: "대회별 기출문제를 연도별로 정리해 체계적으로 학습하세요.",
                meta: statsConfirmed ? `${stats.contests}개의 대회` : "—",
              },
              {
                href: "/community",
                symbol: ">",
                title: "커뮤니티",
                desc: "자유 토론과 질문을 통해 다른 학습자들과 소통하세요.",
                meta: "토론 참여하기",
              },
            ].map((item, i) => (
              <ScrollReveal key={item.href} delay={i * 80}>
                <Link href={item.href} className="block h-full">
                  <div className="ql-card group">
                    <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black group-hover:bg-black transition-all duration-250">
                      <span className="text-base font-light text-neutral-400 group-hover:text-white transition-colors">{item.symbol}</span>
                    </div>
                    <h3 className="text-base font-semibold mb-2 text-neutral-800 group-hover:text-black transition-colors">{item.title}</h3>
                    <p className="text-sm text-neutral-400 leading-relaxed flex-1">{item.desc}</p>
                    <span className="inline-flex items-center gap-1.5 mt-5 text-xs text-neutral-400 group-hover:text-black transition-colors font-medium tracking-wide">
                      {item.meta}
                      <svg className="w-3 h-3 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 relative overflow-hidden">
        <div className="cta-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[150px] sm:w-[500px] sm:h-[250px] bg-gradient-to-r from-blue-100/15 via-purple-100/15 to-blue-100/15 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <span className="section-label mb-4 inline-block">Get Started</span>
            <h2 className="text-3xl md:text-5xl font-extralight text-black mb-4 tracking-tight">과학의 경계를 넓혀보세요</h2>
            <p className="text-neutral-400 text-sm mb-10 max-w-md mx-auto leading-relaxed tracking-wide">
              문제를 풀고, 풀이를 공유하고, 함께 성장하세요.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Link href="/problems" className="cta-primary-v2">
                문제 풀기
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              {!user && (
                <Link href="/login" className="cta-secondary-v2">계정 만들기</Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
