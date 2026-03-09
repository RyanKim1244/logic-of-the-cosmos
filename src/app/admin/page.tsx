"use client";

import { useState } from "react";
import { problems } from "@/data/problems";
import { contests as contestsData } from "@/data/contests";
import { Problem, Contest } from "@/types";

type Tab = "problems" | "contests";

type ProblemFormData = {
  title: string;
  source: string;
  year: number;
  tags: string;
  content: string;
  officialSolution: string;
};

type ContestFormData = {
  name: string;
  shortName: string;
  description: string;
  website: string;
  years: string;
};

const emptyProblemForm: ProblemFormData = {
  title: "",
  source: "",
  year: new Date().getFullYear(),
  tags: "",
  content: "",
  officialSolution: "",
};

const emptyContestForm: ContestFormData = {
  name: "",
  shortName: "",
  description: "",
  website: "",
  years: "",
};

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("problems");

  // Problem state
  const [problemMode, setProblemMode] = useState<"none" | "add" | "edit">("none");
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemForm, setProblemForm] = useState<ProblemFormData>(emptyProblemForm);
  const [allProblems, setAllProblems] = useState<Problem[]>(problems);

  // Contest state
  const [contestMode, setContestMode] = useState<"none" | "add" | "edit">("none");
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestForm, setContestForm] = useState<ContestFormData>(emptyContestForm);
  const [allContests, setAllContests] = useState<Contest[]>(contestsData);

  // Problem handlers
  const openAddProblem = () => {
    setProblemForm(emptyProblemForm);
    setEditingProblemId(null);
    setProblemMode("add");
  };

  const openEditProblem = (problem: Problem) => {
    setProblemForm({
      title: problem.title,
      source: problem.source,
      year: problem.year,
      tags: problem.tags.join(", "),
      content: problem.content,
      officialSolution: problem.officialSolution,
    });
    setEditingProblemId(problem.id);
    setProblemMode("edit");
  };

  const closeProblemForm = () => {
    setProblemMode("none");
    setEditingProblemId(null);
    setProblemForm(emptyProblemForm);
  };

  const handleProblemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const tags = problemForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString().split("T")[0];

    if (problemMode === "edit" && editingProblemId) {
      setAllProblems(
        allProblems.map((p) =>
          p.id === editingProblemId
            ? { ...p, title: problemForm.title, source: problemForm.source, year: problemForm.year, tags, content: problemForm.content, officialSolution: problemForm.officialSolution, updatedAt: now }
            : p
        )
      );
    } else {
      const maxNumber = allProblems.reduce((max, p) => Math.max(max, p.problemNumber), 999);
      const newProblem: Problem = {
        id: `custom-${Date.now()}`,
        problemNumber: maxNumber + 1,
        title: problemForm.title,
        source: problemForm.source,
        year: problemForm.year,
        tags,
        content: problemForm.content,
        officialSolution: problemForm.officialSolution,
        createdAt: now,
        updatedAt: now,
      };
      setAllProblems([newProblem, ...allProblems]);
    }
    closeProblemForm();
  };

  const handleDeleteProblem = (id: string) => {
    if (confirm("정말 이 문제를 삭제하시겠습니까?")) {
      setAllProblems(allProblems.filter((p) => p.id !== id));
    }
  };

  // Contest handlers
  const openAddContest = () => {
    setContestForm(emptyContestForm);
    setEditingContestId(null);
    setContestMode("add");
  };

  const openEditContest = (contest: Contest) => {
    setContestForm({
      name: contest.name,
      shortName: contest.shortName,
      description: contest.description,
      website: contest.website || "",
      years: contest.years.join(", "),
    });
    setEditingContestId(contest.id);
    setContestMode("edit");
  };

  const closeContestForm = () => {
    setContestMode("none");
    setEditingContestId(null);
    setContestForm(emptyContestForm);
  };

  const handleContestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const years = contestForm.years
      .split(",")
      .map((y) => parseInt(y.trim()))
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);

    if (contestMode === "edit" && editingContestId) {
      setAllContests(
        allContests.map((c) =>
          c.id === editingContestId
            ? { ...c, name: contestForm.name, shortName: contestForm.shortName, description: contestForm.description, website: contestForm.website || undefined, years }
            : c
        )
      );
    } else {
      const newContest: Contest = {
        id: contestForm.shortName.toLowerCase().replace(/\s+/g, "-"),
        name: contestForm.name,
        shortName: contestForm.shortName,
        description: contestForm.description,
        website: contestForm.website || undefined,
        years,
      };
      setAllContests([...allContests, newContest]);
    }
    closeContestForm();
  };

  const handleDeleteContest = (id: string) => {
    if (confirm("정말 이 대회를 삭제하시겠습니까?")) {
      setAllContests(allContests.filter((c) => c.id !== id));
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-light text-black mb-8">관리자 패널</h1>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-neutral-200">
        <button
          onClick={() => { setTab("problems"); closeContestForm(); }}
          className={`px-6 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            tab === "problems" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          문제 관리
        </button>
        <button
          onClick={() => { setTab("contests"); closeProblemForm(); }}
          className={`px-6 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
            tab === "contests" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"
          }`}
        >
          대회 관리
        </button>
      </div>

      {/* ===== Problems Tab ===== */}
      {tab === "problems" && (
        <>
          <div className="flex justify-end mb-6">
            <button
              onClick={problemMode === "none" ? openAddProblem : closeProblemForm}
              className="px-5 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider"
            >
              {problemMode !== "none" ? "취소" : "+ 새 문제 추가"}
            </button>
          </div>

          {problemMode !== "none" && (
            <div className="border border-neutral-200 p-8 mb-8">
              <h2 className="text-lg font-light text-black mb-6">
                {problemMode === "edit" ? "문제 수정" : "새 문제 추가"}
              </h2>
              <form onSubmit={handleProblemSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>제목</label>
                    <input type="text" required value={problemForm.title} onChange={(e) => setProblemForm({ ...problemForm, title: e.target.value })} className={inputClass} placeholder="문제 제목" />
                  </div>
                  <div>
                    <label className={labelClass}>출처</label>
                    <input type="text" required value={problemForm.source} onChange={(e) => setProblemForm({ ...problemForm, source: e.target.value })} className={inputClass} placeholder="예: IPhO 2023, KPhO 2022" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>연도</label>
                    <input type="number" required value={problemForm.year} onChange={(e) => setProblemForm({ ...problemForm, year: parseInt(e.target.value) })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>태그 (쉼표로 구분)</label>
                    <input type="text" value={problemForm.tags} onChange={(e) => setProblemForm({ ...problemForm, tags: e.target.value })} className={inputClass} placeholder="예: electromagnetism, special-relativity" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>문제 내용 (LaTeX 지원)</label>
                  <textarea required value={problemForm.content} onChange={(e) => setProblemForm({ ...problemForm, content: e.target.value })} className={`${inputClass} font-mono resize-none`} rows={10} placeholder={"LaTeX 수식을 포함한 문제 내용을 입력하세요.\n인라인 수식: $E = mc^2$\n블록 수식: $$\\int_0^\\infty e^{-x} dx = 1$$\n이미지 삽입: ![설명](/images/파일명.svg \"캡션\")"} />
                </div>
                <div>
                  <label className={labelClass}>공식 풀이 (LaTeX 지원)</label>
                  <textarea required value={problemForm.officialSolution} onChange={(e) => setProblemForm({ ...problemForm, officialSolution: e.target.value })} className={`${inputClass} font-mono resize-none`} rows={10} placeholder="공식 풀이를 입력하세요..." />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">
                    {problemMode === "edit" ? "수정 완료" : "문제 등록"}
                  </button>
                  <button type="button" onClick={closeProblemForm} className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium hover:border-black hover:text-black transition-colors uppercase tracking-wider">
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">등록된 문제 ({allProblems.length})</h2>
            </div>
            <div className="divide-y divide-neutral-200">
              {allProblems.map((problem) => (
                <div key={problem.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-black text-sm truncate">{problem.title}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{problem.source} ({problem.year})</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {problem.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="text-xs text-neutral-400">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => openEditProblem(problem)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors uppercase tracking-wider">
                      수정
                    </button>
                    <button onClick={() => handleDeleteProblem(problem.id)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider">
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ===== Contests Tab ===== */}
      {tab === "contests" && (
        <>
          <div className="flex justify-end mb-6">
            <button
              onClick={contestMode === "none" ? openAddContest : closeContestForm}
              className="px-5 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider"
            >
              {contestMode !== "none" ? "취소" : "+ 새 대회 추가"}
            </button>
          </div>

          {contestMode !== "none" && (
            <div className="border border-neutral-200 p-8 mb-8">
              <h2 className="text-lg font-light text-black mb-6">
                {contestMode === "edit" ? "대회 수정" : "새 대회 추가"}
              </h2>
              <form onSubmit={handleContestSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>대회명</label>
                    <input type="text" required value={contestForm.name} onChange={(e) => setContestForm({ ...contestForm, name: e.target.value })} className={inputClass} placeholder="예: International Physics Olympiad" />
                  </div>
                  <div>
                    <label className={labelClass}>약칭</label>
                    <input type="text" required value={contestForm.shortName} onChange={(e) => setContestForm({ ...contestForm, shortName: e.target.value })} className={inputClass} placeholder="예: IPhO" />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>설명</label>
                  <textarea value={contestForm.description} onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="대회에 대한 간략한 설명" />
                </div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className={labelClass}>공식 웹사이트 (선택)</label>
                    <input type="text" value={contestForm.website} onChange={(e) => setContestForm({ ...contestForm, website: e.target.value })} className={inputClass} placeholder="https://..." />
                  </div>
                  <div>
                    <label className={labelClass}>연도 (쉼표로 구분)</label>
                    <input type="text" required value={contestForm.years} onChange={(e) => setContestForm({ ...contestForm, years: e.target.value })} className={inputClass} placeholder="예: 2023, 2022, 2021, 2020" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">
                    {contestMode === "edit" ? "수정 완료" : "대회 등록"}
                  </button>
                  <button type="button" onClick={closeContestForm} className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium hover:border-black hover:text-black transition-colors uppercase tracking-wider">
                    취소
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">등록된 대회 ({allContests.length})</h2>
            </div>
            <div className="divide-y divide-neutral-200">
              {allContests.map((contest) => {
                const count = allProblems.filter((p) =>
                  p.source.toLowerCase().includes(contest.shortName.toLowerCase())
                ).length;
                return (
                  <div key={contest.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-black text-sm">{contest.name}</h3>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5">{contest.shortName}</span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{contest.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                        <span>{contest.years.length}개 연도</span>
                        <span>{count}문제</span>
                        {contest.website && <span>웹사이트 있음</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => openEditContest(contest)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors uppercase tracking-wider">
                        수정
                      </button>
                      <button onClick={() => handleDeleteContest(contest.id)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider">
                        삭제
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
