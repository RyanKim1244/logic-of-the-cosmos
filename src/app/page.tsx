"use client";

import Link from "next/link";
import { problems } from "@/data/problems";
import ProblemCard from "@/components/ProblemCard";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";
import { SUBJECT_LABELS, Subject } from "@/types";

export default function Home() {
  const recentProblems = problems.slice(0, 3);
  const subjectCounts = problems.reduce(
    (acc, p) => {
      acc[p.subject] = (acc[p.subject] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

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
          <p className="text-lg md:text-xl text-neutral-300 mb-4 max-w-2xl mx-auto font-light hero-subtitle">
            과학 올림피아드 문제와 풀이를 제공하는 학습 플랫폼
          </p>
          <p className="text-neutral-500 mb-14 max-w-xl mx-auto text-sm font-light hero-subtitle-delay">
            IPhO, IChO, IBO, KPhO, KMO 기출문제부터 대학 기출문제까지
          </p>
          <Link
            href="/problems"
            className="inline-block px-10 py-3.5 bg-white text-black font-medium hover:bg-neutral-200 transition-all text-sm tracking-widest uppercase hero-cta hover:tracking-[0.2em]"
          >
            문제 풀러 가기
          </Link>
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
              { label: "전체 문제", value: problems.length },
              ...(Object.keys(SUBJECT_LABELS) as Subject[]).slice(0, 3).map((subject) => ({
                label: SUBJECT_LABELS[subject],
                value: subjectCounts[subject] || 0,
              })),
            ].map((stat, i) => (
              <ScrollReveal key={stat.label} delay={i * 100}>
                <div className="p-8 text-center border border-neutral-200 bg-white stat-card">
                  <div className="text-4xl md:text-5xl font-extralight text-black">
                    <CountUp target={stat.value} />
                  </div>
                  <div className="text-xs text-neutral-400 mt-3 uppercase tracking-[0.2em]">{stat.label}</div>
                </div>
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
              <Link
                href="/problems"
                className="text-neutral-400 hover:text-black transition-colors text-sm group flex items-center gap-2"
              >
                전체 보기
                <span className="inline-block transition-transform group-hover:translate-x-1">&rarr;</span>
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
            <h2 className="text-2xl font-light text-center mb-4">플랫폼 특징</h2>
            <p className="text-neutral-500 text-sm text-center mb-16">체계적인 학습을 위한 핵심 기능</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "\u03A3",
                title: "수식 렌더링",
                desc: "LaTeX 기반의 정교한 수식 렌더링으로 복잡한 과학 문제를 명확하게 표현합니다.",
              },
              {
                icon: "#",
                title: "태그 기반 분류",
                desc: "과목, 난이도, 주제별 태그로 원하는 문제를 빠르게 찾을 수 있습니다.",
              },
              {
                icon: "\u00B6",
                title: "커뮤니티 토론",
                desc: "각 문제별 토론 페이지에서 풀이 방법을 공유하고 질문할 수 있습니다.",
              },
            ].map((feature, i) => (
              <ScrollReveal key={feature.title} delay={i * 150}>
                <div className="p-8 border border-neutral-800 feature-card group">
                  <div className="w-12 h-12 border border-neutral-700 flex items-center justify-center mb-6 group-hover:border-white transition-colors">
                    <span className="text-xl font-light text-neutral-400 group-hover:text-white transition-colors">
                      {feature.icon}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm uppercase tracking-widest mb-4">{feature.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed group-hover:text-neutral-400 transition-colors">
                    {feature.desc}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
