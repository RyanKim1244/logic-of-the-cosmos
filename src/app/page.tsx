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
      <section className="hero-gradient text-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-bold mb-6 tracking-tight">
            Logic of The Cosmos
          </h1>
          <p className="text-xl text-cosmos-200 mb-4 max-w-2xl mx-auto">
            과학 올림피아드 문제와 풀이를 제공하는 학습 플랫폼
          </p>
          <p className="text-cosmos-300 mb-10 max-w-xl mx-auto">
            IPhO, IChO, IBO, KPhO, KMO 기출문제부터 대학 기출문제까지 — 체계적으로 학습하세요.
          </p>
          <Link
            href="/problems"
            className="inline-block px-8 py-3 bg-white text-cosmos-900 font-semibold rounded-lg hover:bg-cosmos-100 transition-colors shadow-lg"
          >
            문제 풀러 가기
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl p-6 text-center border border-gray-200">
              <div className="text-3xl font-bold text-cosmos-700">{problems.length}</div>
              <div className="text-sm text-gray-500 mt-1">전체 문제</div>
            </div>
            {(Object.keys(SUBJECT_LABELS) as Subject[]).slice(0, 3).map((subject) => (
              <div key={subject} className="bg-white rounded-xl p-6 text-center border border-gray-200">
                <div className="text-3xl font-bold text-cosmos-700">
                  {subjectCounts[subject] || 0}
                </div>
                <div className="text-sm text-gray-500 mt-1">{SUBJECT_LABELS[subject]}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent Problems */}
      <section className="py-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-900">최근 문제</h2>
            <Link
              href="/problems"
              className="text-cosmos-600 hover:text-cosmos-800 font-medium text-sm"
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
      <section className="py-16 bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">플랫폼 특징</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 bg-cosmos-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#8721;</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">수식 렌더링</h3>
              <p className="text-gray-500 text-sm">
                LaTeX 기반의 정교한 수식 렌더링으로 복잡한 과학 문제를 명확하게 표현합니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-cosmos-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#128278;</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">태그 기반 분류</h3>
              <p className="text-gray-500 text-sm">
                과목, 난이도, 주제별 태그로 원하는 문제를 빠르게 찾을 수 있습니다.
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 bg-cosmos-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#128172;</span>
              </div>
              <h3 className="font-semibold text-lg mb-2">커뮤니티 토론</h3>
              <p className="text-gray-500 text-sm">
                각 문제별 토론 페이지에서 풀이 방법을 공유하고 질문할 수 있습니다.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
