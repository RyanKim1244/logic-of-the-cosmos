"use client";

import { useState, useEffect } from "react";
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
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
  const t = useTranslations();
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
            Logic of The <span className="hero-gradient-text">Cosmos</span>
          </h1>
          <div className="w-24 h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent mx-auto mb-8 hero-line" />
          <p className="text-2xl md:text-3xl text-neutral-300 mb-4 max-w-2xl mx-auto font-light hero-subtitle">
            {t("home.heroSubtitle")}
          </p>
          <p className="text-neutral-500 mb-14 max-w-xl mx-auto text-lg font-light hero-subtitle-delay">
            {t("home.heroSubDescription")}
          </p>
          <div className="flex items-center justify-center gap-4 hero-cta">
            <Link href="/problems" className="hero-btn-primary inline-block px-10 py-3.5 bg-white text-black font-medium transition-all text-sm tracking-widest uppercase">{t("home.ctaStart")}</Link>
            <Link href="/contests" className="hero-btn-outline inline-block px-10 py-3.5 border border-neutral-500 text-neutral-300 font-medium transition-all text-sm tracking-widest uppercase">{t("nav.contests")}</Link>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      <section className="py-28 quote-section border-b border-neutral-100 relative overflow-hidden">
        <div className="quote-float-1 absolute top-10 left-[10%] w-72 h-72 bg-blue-100/20 rounded-full blur-3xl" />
        <div className="quote-float-2 absolute bottom-10 right-[10%] w-60 h-60 bg-purple-100/20 rounded-full blur-3xl" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <blockquote className="relative">
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-8xl text-neutral-200/60 font-serif select-none quote-mark">&ldquo;</span>
              <p className="text-2xl md:text-3xl font-light text-neutral-800 leading-relaxed italic mb-5">
                &ldquo;Земля — колыбель разума, но нельзя вечно жить в колыбели.&rdquo;
              </p>
              <p className="text-lg md:text-xl text-neutral-600 font-light mb-8 leading-relaxed">
                &ldquo;{t("home.quoteTranslation")}&rdquo;
              </p>
              <div className="w-12 h-px bg-gradient-to-r from-transparent via-neutral-400 to-transparent mx-auto mb-5" />
              <footer className="text-base text-neutral-400 tracking-wide">
                <span className="font-medium text-neutral-600">Konstantin Tsiolkovsky</span>
                <span className="mx-2 text-neutral-300">|</span>
                <span className="text-neutral-500">{t("home.quoteAuthorLocal")}</span>
                <span className="mx-2 text-neutral-300">|</span>
                <span className="text-neutral-400 text-sm tracking-widest">1857 – 1935</span>
              </footer>
            </blockquote>
          </ScrollReveal>
        </div>
      </section>

      {/* Stats */}
      <section className="py-24 bg-neutral-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <h2 className="text-center text-sm md:text-base text-neutral-400 uppercase tracking-[0.3em] mb-14">Platform Overview</h2>
          </ScrollReveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: t("home.statsProblems"), value: stats?.problems ?? 0, icon: "Q" },
              { label: t("home.statsContests"), value: stats?.contests ?? 0, icon: "#" },
              { label: t("home.statsDiscussions"), value: stats?.discussions ?? 0, icon: ">" },
              { label: t("home.statsAuthors"), value: stats?.authors ?? 0, icon: "@" },
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div className="p-8 text-center border border-neutral-200 bg-white stat-card group">
                  <div className="text-5xl md:text-6xl font-extralight text-black transition-transform duration-300 group-hover:scale-110">
                    {statsConfirmed ? <CountUp target={stat.value} /> : <span className="inline-block w-12 h-10 bg-neutral-100 animate-pulse rounded" />}
                  </div>
                  <div className="text-sm text-neutral-400 mt-3 uppercase tracking-[0.2em]">{stat.label}</div>
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
                <h2 className="text-3xl md:text-4xl font-light text-black mb-2 section-heading">{t("home.contestArchive")}</h2>
                <p className="text-base text-neutral-400">{t("home.contestArchiveDesc")}</p>
              </div>
              <Link href="/contests" className="text-neutral-400 hover:text-black transition-colors text-sm group flex items-center gap-2 link-hover-arrow">
                {t("home.sectionViewAll")} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {topContests.map((contest, i) => (
              <ScrollReveal key={contest.id} delay={i * 100}>
                <Link href={`/contests/${contest.id}`}>
                  <div className="border border-neutral-200 p-6 bg-white group h-full flex flex-col contest-card">
                    <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-widest mb-2 group-hover:text-blue-500 transition-colors duration-300">{contest.short_name}</span>
                    <h3 className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors mb-2 flex-1">{contest.name}</h3>
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-3 border-t border-neutral-100 group-hover:border-neutral-300 transition-colors">
                      <span>{contest.years.length > 0 ? `${contest.years[contest.years.length - 1]}–${contest.years[0]}` : ""}</span>
                      <span className="font-medium text-neutral-500 group-hover:text-black transition-colors">{t("home.problemsCountSuffix", { count: problemCounts[contest.id] || 0 })}</span>
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
                <h2 className="text-3xl md:text-4xl font-light text-black mb-2">{t("home.recentProblems")}</h2>
                <p className="text-base text-neutral-400">{t("home.recentProblemsDesc")}</p>
              </div>
              <Link href="/problems" className="text-neutral-400 hover:text-black transition-colors text-sm group flex items-center gap-2">
                {t("home.sectionViewAll")} <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
              </Link>
            </div>
          </ScrollReveal>
          <div className="space-y-2">
            {recentProblems.map((problem, i) => (
              <ScrollReveal key={problem.id} delay={i * 80}>
                <div className="problem-card-hover">
                  <ProblemCard problem={problem} />
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 bg-black text-white relative overflow-hidden">
        <div className="features-glow-1 absolute top-0 left-1/4 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl" />
        <div className="features-glow-2 absolute bottom-0 right-1/4 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-light text-center mb-5">{t("home.featuresTitle")}</h2>
            <p className="text-neutral-500 text-base md:text-lg text-center mb-16">{t("home.featuresSubtitle")}</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: "\u221E", title: t("home.featureBoundlessTitle"), desc: t("home.featureBoundlessDesc") },
              { icon: "\u21CC", title: t("home.featureDiscussionTitle"), desc: t("home.featureDiscussionDesc") },
              { icon: "\u03A3", title: t("home.featureLatexTitle"), desc: t("home.featureLatexDesc") },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 150}>
                <div className="p-8 border border-neutral-800 feature-card group h-full flex flex-col">
                  <div className="w-14 h-14 border border-neutral-700 flex items-center justify-center mb-6 group-hover:border-white transition-colors duration-300 feature-icon-box">
                    <span className="text-2xl font-light text-neutral-400 group-hover:text-white transition-colors duration-300">{feature.icon}</span>
                  </div>
                  <h3 className="font-medium text-base uppercase tracking-widest mb-4">{feature.title}</h3>
                  <p className="text-neutral-500 text-base leading-relaxed group-hover:text-neutral-400 transition-colors duration-300 flex-1">{feature.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-24 bg-neutral-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.015]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl md:text-4xl font-light text-center text-black mb-14 section-heading">{t("home.quickLinks")}</h2>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-6">
            <ScrollReveal delay={0}>
              <Link href="/problems" className="block h-full">
                <div className="border border-neutral-200 bg-white p-8 transition-all group h-full flex flex-col quick-link-card">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-white transition-colors duration-300">?</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-black transition-colors">{t("nav.problems")}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed flex-1">{t("home.quickLinksProblemsDesc")}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm text-neutral-400 group-hover:text-black transition-colors">{t("home.problemsCountSuffix", { count: statsConfirmed ? stats.problems : "—" })} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span></span>
                </div>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={100}>
              <Link href="/contests" className="block h-full">
                <div className="border border-neutral-200 bg-white p-8 transition-all group h-full flex flex-col quick-link-card">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-white transition-colors duration-300">#</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-black transition-colors">{t("nav.contests")}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed flex-1">{t("home.quickLinksContestsDesc")}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm text-neutral-400 group-hover:text-black transition-colors">{t("home.contestsCountSuffix", { count: statsConfirmed ? stats.contests : "—" })} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span></span>
                </div>
              </Link>
            </ScrollReveal>
            <ScrollReveal delay={200}>
              <Link href="/community" className="block h-full">
                <div className="border border-neutral-200 bg-white p-8 transition-all group h-full flex flex-col quick-link-card">
                  <div className="w-10 h-10 border border-neutral-200 flex items-center justify-center mb-5 group-hover:border-black group-hover:bg-black transition-all duration-300">
                    <span className="text-lg font-light text-neutral-400 group-hover:text-white transition-colors duration-300">&gt;</span>
                  </div>
                  <h3 className="text-lg font-medium mb-2 group-hover:text-black transition-colors">{t("nav.community")}</h3>
                  <p className="text-sm text-neutral-400 leading-relaxed flex-1">{t("home.quickLinksCommunityDesc")}</p>
                  <span className="inline-flex items-center gap-1 mt-4 text-sm text-neutral-400 group-hover:text-black transition-colors">{t("home.joinDiscussion")} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1.5">&rarr;</span></span>
                </div>
              </Link>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 border-t border-neutral-200 relative overflow-hidden">
        <div className="cta-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-r from-blue-100/20 via-purple-100/20 to-blue-100/20 rounded-full blur-3xl" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <ScrollReveal>
            <h2 className="text-3xl md:text-5xl font-light text-black mb-5">{t("home.ctaTitle")}</h2>
            <p className="text-neutral-400 text-base md:text-lg mb-10 max-w-lg mx-auto">{t("home.ctaSubtitle")}</p>
            <div className="flex items-center justify-center gap-4">
              <Link href="/problems" className="cta-btn-primary px-10 py-3.5 bg-black text-white text-sm font-medium tracking-widest uppercase transition-all duration-300">{t("home.ctaStart")}</Link>
              {!user && (
                <Link href="/login" className="cta-btn-outline px-10 py-3.5 border border-neutral-300 text-neutral-700 text-sm font-medium tracking-widest uppercase transition-all duration-300">{t("home.ctaSignUp")}</Link>
              )}
            </div>
          </ScrollReveal>
        </div>
      </section>
    </div>
  );
}
