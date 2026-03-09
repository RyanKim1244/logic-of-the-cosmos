import Link from "next/link";
import { Problem } from "@/types";

export default function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link href={`/problems/${problem.id}`}>
      <div className="border border-neutral-200 p-6 hover:border-black transition-all duration-200 bg-white group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-medium text-neutral-900 group-hover:text-black transition-colors line-clamp-2">
            {problem.title}
          </h3>
        </div>

        <p className="text-xs text-neutral-400 mb-4 tracking-wide">{problem.source} &middot; {problem.year}</p>

        <div className="flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 text-neutral-400 text-xs">
              #{tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span className="px-2 py-0.5 text-neutral-300 text-xs">+{problem.tags.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
