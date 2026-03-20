"use client";

import { useTranslations } from "next-intl";

const SUBJECTS = ["all", "physics", "chemistry", "biology", "earth", "math"] as const;
export type Subject = (typeof SUBJECTS)[number];

interface SubjectFilterProps {
  selected: Subject;
  onChange: (subject: Subject) => void;
  counts?: Record<string, number>;
}

export default function SubjectFilter({ selected, onChange, counts = {} }: SubjectFilterProps) {
  const t = useTranslations("subjects");

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {SUBJECTS.map((subject) => {
        const isActive = selected === subject;
        const count = subject === "all"
          ? Object.values(counts).reduce((a, b) => a + b, 0)
          : counts[subject] || 0;

        return (
          <button
            key={subject}
            onClick={() => onChange(subject)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wider transition-colors ${
              isActive
                ? "bg-black text-white"
                : "border border-neutral-200 text-neutral-500 hover:border-black hover:text-black"
            }`}
          >
            {t(subject)}
            {count > 0 && (
              <span className={`text-[10px] px-1 py-0.5 rounded-sm ${
                isActive ? "bg-white/20" : "bg-neutral-100 text-neutral-400"
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
