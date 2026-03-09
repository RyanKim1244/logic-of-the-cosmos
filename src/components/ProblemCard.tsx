import Link from "next/link";
import { Problem } from "@/types";

export default function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link href={`/problems/${problem.id}`} className="block h-full">
      <div className="border border-neutral-200 p-6 hover:border-black transition-all duration-200 bg-white group h-full flex flex-col">
        <div className="flex-1">
          <span className="text-[10px] text-neutral-300 font-mono">#{problem.problemNumber}</span>
          <h3 className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-2 mt-1">
            {problem.title}
          </h3>
        </div>

        <p className="text-xs text-neutral-400 mt-3 tracking-wide">{problem.source} &middot; {problem.year}</p>
      </div>
    </Link>
  );
}
