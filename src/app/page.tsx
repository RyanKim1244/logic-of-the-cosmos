import Link from "next/link";
import { problems } from "@/data/problems";
import ProblemCard from "@/components/ProblemCard";
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
      <section className="hero-gradient text-white py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl md:text-6xl font-extralight mb-6 tracking-tight">
            Logic of The Cosmos
          </h1>
          <div className="w-16 h-px bg-neutral-500 mx-auto mb-6" />
          <p className="text-lg text-neutral-300 mb-4 max-w-2xl mx-auto font-light">
            과학 올림피아드 문제와 풀이를 제공하는 학습 플랫폼
          </p>
          <p className="text-neutral-500 mb-12 max-w-xl mx-auto text-sm font-light">
            IPhO, IChO, IBO, KPhO, KMO 기출문제부터 대학 기출문제까지
          </p>
          <Link
            href="/problems"
            className="inline-block px-8 py-3 bg-white text-black font-medium rounded-none hover:bg-neutral-200 transition-colors text-sm tracking-wide uppercase"
          >
            문제 풀러 가기
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="p-8 text-center border border-neutral-200">
              <div className="text-4xl font-extralight text-black">{problems.length}</div>
              <div className="text-xs text-neutral-500 mt-2 uppercase tracking-widest">전체 문제</div>
            </div>
            {(Object.keys(SUBJECT_LABELS) as Subject[]).slice(0, 3).map((subject) => (
              <div key={subject} className="p-8 text-center border border-neutral-200">
                <div className="text-4xl font-extralight text-black">
                  {subjectCounts[subject] || 0}
                </div>
                <div className="text-xs text-neutral-500 mt-2 uppercase tracking-widest">{SUBJECT_LABELS[subject]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Problems */}
      <section className="py-8 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-light text-black">최근 문제</h2>
            <Link
              href="/problems"
              className="text-neutral-500 hover:text-black transition-colors text-sm"
            >
              전체 보기 &rarr;
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProblems.map((problem) => (
              <div key={problem.id} className="problem-card-hover">
                <ProblemCard problem={problem} />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-neutral-50 border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-light text-black text-center mb-16">플랫폼 특징</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-300 flex items-center justify-center mx-auto mb-5">
                <span className="text-lg font-light">&sum;</span>
              </div>
              <h3 className="font-medium text-sm uppercase tracking-wide mb-3">수식 렌더링</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                LaTeX 기반의 정교한 수식 렌더링으로 복잡한 과학 문제를 명확하게 표현합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-300 flex items-center justify-center mx-auto mb-5">
                <span className="text-lg font-light">#</span>
              </div>
              <h3 className="font-medium text-sm uppercase tracking-wide mb-3">태그 기반 분류</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                과목, 난이도, 주제별 태그로 원하는 문제를 빠르게 찾을 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 border border-neutral-300 flex items-center justify-center mx-auto mb-5">
                <span className="text-lg font-light">&para;</span>
              </div>
              <h3 className="font-medium text-sm uppercase tracking-wide mb-3">커뮤니티 토론</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                각 문제별 토론 페이지에서 풀이 방법을 공유하고 질문할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
