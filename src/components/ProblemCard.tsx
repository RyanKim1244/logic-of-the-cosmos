import Link from "next/link";
import { Problem, DIFFICULTY_LABELS, DIFFICULTY_COLORS, SUBJECT_LABELS, SUBJECT_COLORS } from "@/types";

export default function ProblemCard({ problem }: { problem: Problem }) {
  return (
    <Link href={`/problems/${problem.id}`}>
      <div className="border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-cosmos-300 transition-all duration-200 bg-white group">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-cosmos-700 transition-colors line-clamp-2">
            {problem.title}
          </h3>
        </div>

        <p className="text-sm text-gray-500 mb-4">{problem.source} ({problem.year})</p>

        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${SUBJECT_COLORS[problem.subject]}`}>
            {SUBJECT_LABELS[problem.subject]}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${DIFFICULTY_COLORS[problem.difficulty]}`}>
            {DIFFICULTY_LABELS[problem.difficulty]}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {problem.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
              #{tag}
            </span>
          ))}
          {problem.tags.length > 3 && (
            <span className="px-2 py-0.5 text-gray-400 text-xs">+{problem.tags.length - 3}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
