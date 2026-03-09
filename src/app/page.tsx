"use client";

import Link from "next/link";
import { problems, discussions } from "@/data/problems";
import ProblemCard from "@/components/ProblemCard";
import HeroBackground from "@/components/HeroBackground";
import ScrollReveal from "@/components/ScrollReveal";
import CountUp from "@/components/CountUp";

export default function Home() {
  const recentProblems = problems.slice(0, 3);
  const uniqueAuthors = new Set(discussions.map((d) => d.author)).size;

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
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "총 문제 수", value: problems.length },
              { label: "토론 댓글 수", value: discussions.length },
              { label: "참여자 수", value: uniqueAuthors },
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
            <h2 className="text-2xl font-light text-center mb-4">열린 과학 토론의 장</h2>
            <p className="text-neutral-500 text-sm text-center mb-16">분야와 수준의 경계를 넘어, 함께 탐구하는 커뮤니티</p>
          </ScrollReveal>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: "\u221E",
                title: "경계 없는 탐구",
                desc: "중등 올림피아드부터 대학원 연구 문제까지, 물리·화학·생물·수학·지구과학 전 분야를 다룹니다.",
              },
              {
                icon: "\u21CC",
                title: "실시간 토론",
                desc: "각 문제마다 토론 스레드가 열립니다. 풀이를 공유하고, 다른 접근법을 제시하며 깊이 있는 대화를 나누세요.",
              },
              {
                icon: "\u03A3",
                title: "LaTeX 수식 지원",
                desc: "수학적 논증을 정확하게 표현할 수 있습니다. 토론과 풀이에서 자유롭게 LaTeX 수식을 사용하세요.",
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
