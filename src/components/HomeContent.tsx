"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { Problem } from "@/types";
import ProblemCard from "@/components/ProblemCard";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";

interface ContestPreview {
  id: string;
  name: string;
  short_name: string;
  years: number[];
}

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
      {/* Hero Section */}
      <section className="hero-gradient text-white py-36 md:py-52 relative overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extralight mb-8 tracking-tight hero-title">
            Logic of The <span className="bg-gradient-to-r from-blue-300 via-purple-300 to-blue-400 bg-clip-text text-transparent">Cosmos</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mx-auto mb-8 hero-line" />
          <p className="text-xl md:text-2xl text-neutral-300 mb-4 max-w-2xl mx-auto font-light hero-subtitle">
            과학의 모든 영역을 탐구하는 거대한 토론의 장
          </p>
          <p className="text-neutral-500 mb-14 max-w-xl mx-auto text-base font-light hero-subtitle-delay">
            올림피아드 · 대학 기출 · 대학원 수준 · 연구 문제까지 — 경계 없는 과학 탐구
          </p>
          <div className="flex items-center justify-center gap-4 hero-cta">
            <Link href="/problems" className="inline-block px-10 py-3.5 bg-white text-black font-medium hover:bg-neutral-200 transition-all text-sm tracking-widest uppercase hover:tracking-[0.2em]">문제 풀러 가기</Link>
            <Link href="/contests" className="inline-block px-10 py-3.5 border border-neutral-500 text-neutral-300 font-medium hover:border-white hover:text-white transition-all text-sm tracking-widest uppercase">기출문제</Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-28 quote-section border-b border-neutral-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <blockquote className="relative">
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-neutral-200/60 font-serif select-none">&ldquo;</span>
              <p className="text-xl md:text-2xl font-light text-neutral-800 leading-relaxed italic mb-5">
                &ldquo;Земля — колыбель разума, но нельзя вечно жить в колыбели.&rdquo;
              </p>
              <p className="text-base md:text-lg text-neutral-600 font-light mb-8 leading-relaxed">
                &ldquo;지구는 인류의 요람이다. 그러나 영원히 요람 속에 머물 수는 없다.&rdquo;
              </p>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mb-5" />
              <footer className="text-sm text-neutral-400 tracking-wide">
                <span className="font-medium text-neutral-600">Konstantin Tsiolkovsky</span>
                <span className="mx-2 text-neutral-300">|</span>
                <span className="text-neutral-500">콘스탄틴 치올콥스키</span>
                <span className="mx-2 text-neutral-300">|</span>
                <span className="text-neutral-400 text-xs tracking-widest">1857 – 1935</span>
              </footer>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="text-center text-xs text-neutral-400 uppercase tracking-[0.3em] mb-14">Platform Overview</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: "총 문제 수", value: stats?.problems ?? 0 },
              { label: "등록 대회", value: stats?.contests ?? 0 },
              { label: "토론 댓글 수", value: stats?.discussions ?? 0 },
              { label: "참여자 수", value: stats?.authors ?? 0 },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div className="p-8 text-center border border-neutral-200 bg-white stat-card">
                  <div className="text-4xl md:text-5xl font-extralight text-black">
                    {statsConfirmed ? <CountUp target={stat.value} /> : <span className="inline-block w-12 h-10 bg-neutral-100 animate-pulse rounded" />}
                  </div>
                  <div className="text-xs text-neutral-400 mt-3 uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contests Preview */}
      <section className="py-24 border-b border-neutral-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-light text-black mb-1">기출문제 아카이브</h2>
                <p className="text-sm text-neutral-400">국제 올림피아드부터 대학 기출까지, 연도별로 정리된 문제를 풀어보세요</p>
              </div>
              <Link href="/contests" className="text-neutral-400 hover:text-black transition-colors text-sm group flex items-center gap-2">
                전체 보기 <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {topContests.map((contest, i) => (
              <ScrollReveal key={contest.id} delay={i * 100}>
                <Link href={`/contests/${contest.id}`}>
                  <div className="border border-neutral-200 p-6 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-2">{contest.short_name}</span>
                    <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors mb-2 flex-1">{contest.name}</h3>
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-100">
                      <span>{contest.years.length > 0 ? `${contest.years[contest.years.length - 1]}–${contest.years[0]}` : ""}</span>
                      <span className="font-medium text-neutral-500">{problemCounts[contest.id] || 0}문제</span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Problems */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-center justify-between mb-12">
              <div>
                <h2 className="text-2xl font-light text-black mb-1">최근 문제</h2>
                <p className="text-sm text-neutral-400">새로 등록된 문제들을 확인하세요</p>
              </div>
              <Link href="/problems" className="text-neutral-400 hover:text-black transition-colors text-sm group flex items-center gap-2">
                전체 보기 <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProblems.map((problem, i) => (
              <ScrollReveal key={problem.id} delay={i * 120}>
                <div className="problem-card-hover">
                  <ProblemCard problem={problem} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="text-2xl font-light text-center mb-4">열린 과학 토론의 장</h2>
            <p className="text-neutral-500 text-sm text-center mb-16">분야와 수준의 경계를 넘어, 함께 탐구하는 커뮤니티</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "\u221E", title: "경계 없는 탐구", desc: "중등 올림피아드부터 대학원 연구 문제까지, 물리·화학·생물·수학·지구과학 전 분야를 다룹니다." },
              { icon: "\u21CC", title: "실시간 토론", desc: "각 문제마다 토론 스레드가 열립니다. 풀이를 공유하고, 다른 접근법을 제시하며 깊이 있는 대화를 나누세요." },
              { icon: "\u03A3", title: "LaTeX 수식 지원", desc: "수학적 논증을 정확하게 표현할 수 있습니다. 토론과 풀이에서 자유롭게 LaTeX 수식을 사용하세요." },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 150}>
                <div className="p-8 border border-neutral-800 feature-card group">
                  <div className="w-12 h-12 border border-neutral-700 flex items-center justify-center mb-6 group-hover:border-white transition-colors">
                    <span className="text-xl font-light text-neutral-400 group-hover:text-white transition-colors">{feature.icon}</span>
                  </div>
                  <h3 className="font-medium text-sm uppercase tracking-widest mb-4">{feature.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <h2 className="text-2xl font-light text-center text-black mb-14">빠른 탐색</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <Link href="/problems" className="block">
                <div className="border border-neutral-200 bg-white p-8 hover:border-black transition-all group">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black transition-colors">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-black transition-colors">?</span>
                  </div>
                  <h3 className="text-base font-medium mb-2 group-hover:text-black transition-colors">문제 목록</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">태그와 출처로 문제를 검색하고, 번호로 빠르게 찾아보세요.</p>
                  <span className="inline-block mt-4 text-xs text-neutral-400 group-hover:text-black transition-colors">{statsConfirmed ? `${stats.problems}개의 문제` : "—"} &rarr;</span>
                </div>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Link href="/contests" className="block">
                <div className="border border-neutral-200 bg-white p-8 hover:border-black transition-all group">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black transition-colors">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-black transition-colors">#</span>
                  </div>
                  <h3 className="text-base font-medium mb-2 group-hover:text-black transition-colors">기출문제</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">대회별 기출문제를 연도별로 정리해 체계적으로 학습하세요.</p>
                  <span className="inline-block mt-4 text-xs text-neutral-400 group-hover:text-black transition-colors">{statsConfirmed ? `${stats.contests}개의 대회` : "—"} &rarr;</span>
                </div>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Link href="/community" className="block">
                <div className="border border-neutral-200 bg-white p-8 hover:border-black transition-all group">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black transition-colors">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-black transition-colors">&gt;</span>
                  </div>
                  <h3 className="text-base font-medium mb-2 group-hover:text-black transition-colors">커뮤니티</h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">자유 토론과 질문을 통해 다른 학습자들과 소통하세요.</p>
                  <span className="inline-block mt-4 text-xs text-neutral-400 group-hover:text-black transition-colors">토론 참여하기 &rarr;</span>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-neutral-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <ScrollReveal>
            <h2 className="text-2xl md:text-3xl font-light text-black mb-4">과학의 경계를 넓혀보세요</h2>
            <p className="text-neutral-400 text-sm mb-10 max-w-lg mx-auto">문제를 풀고, 풀이를 공유하고, 함께 성장하세요.</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/problems" className="px-8 py-3 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">문제 풀기</Link>
              {!user && (
                <Link href="/login" className="px-8 py-3 border border-neutral-300 text-neutral-700 text-xs font-medium tracking-widest uppercase hover:border-black hover:text-black transition-colors">계정 만들기</Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
