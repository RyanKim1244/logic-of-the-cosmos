"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

type SectionNode = { name: string; children: SectionNode[] };

interface Contest {
  id: string;
  name: string;
  short_name: string;
  description: string;
  website: string | null;
  years: number[];
  sections: string[];
  sections_tree: SectionNode[];
}

interface Problem {
  id: string;
  problem_number: number;
  title: string;
  source: string;
  year: number;
  section: string | null;
}

function YearAccordion({ problemsByYear }: { problemsByYear: { year: number; problems: Problem[] }[] }) {
  const { t } = useLanguage();
  const [openYears, setOpenYears] = useState<Set<number>>(new Set());

  const toggle = useCallback((year: number) => {
    setOpenYears((prev) => {
      const next = new Set(prev);
      if (next.has(year)) next.delete(year);
      else next.add(year);
      return next;
    });
  }, []);

  return (
    <div className="space-y-3">
      {problemsByYear.map(({ year, problems: yearProblems }) => {
        const isOpen = openYears.has(year);
        return (
          <div key={year} className="border border-neutral-200 rounded-xl overflow-hidden">
            <button
              onClick={() => toggle(year)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-light text-black">{year}</h2>
                <span className="text-xs text-neutral-400">{yearProblems.length} {t.contestsPage.problems}</span>
              </div>
              <svg
                className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className="grid transition-[grid-template-rows] duration-300 ease-in-out"
              style={{ gridTemplateRows: isOpen ? "1fr" : "0fr" }}
            >
              <div className="overflow-hidden">
                <div className="px-6 pb-5 pt-1 space-y-2">
                  {yearProblems.map((problem) => (
                    <Link key={problem.id} href={`/problems/${problem.id}`} className="block">
                      <div className="border border-neutral-200 rounded-xl px-6 py-6 hover:border-black hover:shadow-sm transition-all duration-200 bg-white group flex items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{problem.problem_number}</span>
                            <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors truncate">
                              {problem.title}
                            </h3>
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-400 shrink-0">{problem.source}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Contest Header (shared) ──
function ContestHeader({ contest, totalProblems, backHref, backLabel }: {
  contest: Contest;
  totalProblems: number;
  backHref: string;
  backLabel: string;
}) {
  const { t } = useLanguage();
  return (
    <>
      <nav className="mb-8">
        <Link href={backHref} className="text-neutral-400 hover:text-black text-xs uppercase tracking-wider transition-colors">
          &larr; {backLabel}
        </Link>
      </nav>

      <div className="border border-neutral-200 rounded-xl p-8 mb-8">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{contest.short_name}</span>
        <h1 className="text-2xl font-light text-black mt-2 mb-3">{contest.name}</h1>
        <p className="text-sm text-neutral-500 mb-4">{contest.description}</p>
        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span>{totalProblems} {t.contestsPage.problems}</span>
          <span>{contest.years.length} {t.contestsPage.years}</span>
          {contest.website && (
            <a href={contest.website} target="_blank" rel="noopener noreferrer" className="hover:text-black transition-colors">
              {t.contestsPage.officialSite} &#x2197;
            </a>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main: shows section cards or year accordion ──
interface ContestDetailContentProps {
  contest: Contest;
  contestProblems: Problem[];
}

export default function ContestDetailContent({ contest, contestProblems }: ContestDetailContentProps) {
  const { t } = useLanguage();
  const tree = contest.sections_tree || [];
  const hasSections = tree.length > 0;

  const problemsByYear = contest.years
    .map((year) => ({
      year,
      problems: contestProblems.filter((p) => p.year === year),
    }))
    .filter((group) => group.problems.length > 0);

  // Count problems matching a section path prefix
  const countProblems = (path: string) =>
    contestProblems.filter((p) => p.section === path || p.section?.startsWith(path + "/")).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <ContestHeader
        contest={contest}
        totalProblems={contestProblems.length}
        backHref="/contests"
        backLabel={t.common.contests}
      />

      {hasSections ? (
        <div className="space-y-3">
          {tree.map((node) => {
            const path = node.name;
            const count = countProblems(path);
            return (
              <Link
                key={path}
                href={`/contests/${contest.id}/${encodeURIComponent(path)}`}
                className="block border border-neutral-200 rounded-xl p-5 hover:border-black hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-black">{node.name}</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-xs text-neutral-400">{count} {t.contestsPage.problems}</span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-neutral-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        /* No sections or single section — direct year accordion */
        <>
          {problemsByYear.length === 0 ? (
            <div className="text-center py-20 text-neutral-400">
              <p className="text-base">{t.contestsPage.noProblems}</p>
              <p className="text-sm mt-2">{t.contestsPage.addProblems}</p>
            </div>
          ) : (
            <YearAccordion problemsByYear={problemsByYear} />
          )}

          {contest.years.filter((y) => !problemsByYear.some((g) => g.year === y)).length > 0 && (
            <div className="mt-8 border-t border-neutral-100 pt-6">
              <p className="text-xs text-neutral-400 mb-3">{t.contestsPage.unregisteredYears}</p>
              <div className="flex flex-wrap gap-2">
                {contest.years
                  .filter((y) => !problemsByYear.some((g) => g.year === y))
                  .map((y) => (
                    <span key={y} className="px-3 py-1 border border-neutral-200 rounded-md text-xs text-neutral-400">{y}</span>
                  ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Find node in tree by path ──
function findNode(tree: SectionNode[], path: string): SectionNode | null {
  const parts = path.split("/");
  let nodes = tree;
  let node: SectionNode | null = null;
  for (const part of parts) {
    node = nodes.find((n) => n.name === part) || null;
    if (!node) return null;
    nodes = node.children;
  }
  return node;
}

// ── Section Detail: shows subsection cards or year accordion ──
export function ContestSectionContent({ contest, contestProblems, sectionPath }: {
  contest: Contest;
  contestProblems: Problem[];
  sectionPath: string;
}) {
  const { t } = useLanguage();

  const node = findNode(contest.sections_tree || [], sectionPath);
  const hasChildren = node && node.children.length > 0;

  // Problems directly in this section OR nested under it
  const sectionProblems = contestProblems.filter(
    (p) => p.section === sectionPath || p.section?.startsWith(sectionPath + "/")
  );
  // Problems exactly at this level (not in sub-sections)
  const directProblems = contestProblems.filter((p) => p.section === sectionPath);

  const problemsByYear = contest.years
    .map((year) => ({
      year,
      problems: directProblems.filter((p) => p.year === year),
    }))
    .filter((group) => group.problems.length > 0);

  const pathParts = sectionPath.split("/");
  const breadcrumbs = pathParts.map((_, i) => ({
    name: pathParts[i],
    path: pathParts.slice(0, i + 1).join("/"),
  }));

  const countForPath = (path: string) =>
    contestProblems.filter((p) => p.section === path || p.section?.startsWith(path + "/")).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center gap-2 text-xs text-neutral-400 flex-wrap">
        <Link href="/contests" className="hover:text-black transition-colors uppercase tracking-wider">
          {t.common.contests}
        </Link>
        <span>/</span>
        <Link href={`/contests/${contest.id}`} className="hover:text-black transition-colors uppercase tracking-wider">
          {contest.short_name}
        </Link>
        {breadcrumbs.map((bc, i) => (
          <span key={bc.path} className="flex items-center gap-2">
            <span>/</span>
            {i < breadcrumbs.length - 1 ? (
              <Link href={`/contests/${contest.id}/${encodeURIComponent(bc.path)}`} className="hover:text-black transition-colors uppercase tracking-wider">
                {bc.name}
              </Link>
            ) : (
              <span className="text-neutral-600 uppercase tracking-wider">{bc.name}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Header */}
      <div className="border border-neutral-200 rounded-xl p-8 mb-8">
        <div className="flex items-center gap-2 mb-2 text-xs font-medium text-neutral-400 uppercase tracking-wider">
          <span>{contest.short_name}</span>
          {pathParts.map((part, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-neutral-300">›</span>
              <span className={i === pathParts.length - 1 ? "text-black" : ""}>{part}</span>
            </span>
          ))}
        </div>
        <h1 className="text-2xl font-light text-black mb-3">{contest.name}</h1>
        <div className="flex items-center gap-6 text-xs text-neutral-400">
          <span>{sectionProblems.length} {t.contestsPage.problems}</span>
        </div>
      </div>

      {/* Sub-section cards if children exist */}
      {hasChildren && (
        <div className="space-y-3 mb-8">
          {node!.children.map((child) => {
            const childPath = sectionPath + "/" + child.name;
            const count = countForPath(childPath);
            return (
              <Link
                key={childPath}
                href={`/contests/${contest.id}/${encodeURIComponent(childPath)}`}
                className="block border border-neutral-200 rounded-xl p-5 hover:border-black hover:shadow-sm transition-all group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-medium text-black">{child.name}</h3>
                    <span className="text-xs text-neutral-400 mt-1">{count} {t.contestsPage.problems}</span>
                  </div>
                  <svg className="w-5 h-5 text-neutral-300 group-hover:text-black group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Leaf section: flat problem list. Non-leaf: year accordion */}
      {hasChildren ? (
        problemsByYear.length > 0 && (
          <>
            <h2 className="text-xs text-neutral-400 uppercase tracking-[0.2em] mb-4">{t.contestsPage.problems}</h2>
            <YearAccordion problemsByYear={problemsByYear} />
          </>
        )
      ) : directProblems.length > 0 ? (
        <div className="space-y-2">
          {directProblems.map((problem) => (
            <Link key={problem.id} href={`/problems/${problem.id}`} className="block">
              <div className="border border-neutral-200 rounded-xl px-6 py-6 hover:border-black hover:shadow-sm transition-all duration-200 bg-white group flex items-center gap-4">
                <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{problem.problem_number}</span>
                <h3 className="text-sm font-medium text-neutral-900 group-hover:text-black transition-colors truncate flex-1">
                  {problem.title}
                </h3>
                <span className="text-[11px] text-neutral-400 shrink-0">{problem.year}</span>
                <svg className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-neutral-400">
          <p className="text-base">{t.contestsPage.noProblems}</p>
          <p className="text-sm mt-2">{t.contestsPage.addProblems}</p>
        </div>
      )}
    </div>
  );
}
