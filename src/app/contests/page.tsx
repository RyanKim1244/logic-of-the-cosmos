import Link from "next/link";
import { contests } from "@/data/contests";
import { problems } from "@/data/problems";

export default function ContestsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-light text-black mb-3">기출문제</h1>
      <p className="text-sm text-neutral-400 mb-10">
        대회 및 기관별 기출문제를 연도별로 정리했습니다.
      </p>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contests.map((contest) => {
          const problemCount = problems.filter((p) =>
            p.source.toLowerCase().includes(contest.shortName.toLowerCase())
          ).length;
          const yearRange =
            contest.years.length > 0
              ? `${contest.years[contest.years.length - 1]}–${contest.years[0]}`
              : "";

          return (
            <Link key={contest.id} href={`/contests/${contest.id}`}>
              <div className="border border-neutral-200 p-6 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    {contest.shortName}
                  </span>
                  {contest.website && (
                    <span className="w-1.5 h-1.5 bg-neutral-300 rounded-full" />
                  )}
                </div>

                <h2 className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors mb-2">
                  {contest.name}
                </h2>

                <p className="text-xs text-neutral-400 mb-4 line-clamp-2 flex-1">
                  {contest.description}
                </p>

                <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
                  <span className="text-xs text-neutral-400">
                    {yearRange}
                  </span>
                  <span className="text-xs text-neutral-500 font-medium">
                    {problemCount}문제
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
