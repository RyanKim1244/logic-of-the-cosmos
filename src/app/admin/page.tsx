"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { getCached, setCache, isCacheStale } from "@/lib/cache";
import { parseMultiLang, serializeMultiLang, getDisplayText, type MultiLangContent } from "@/lib/multilang";
import MultiLangEditor from "@/components/MultiLangEditor";

type Tab = "problems" | "contests";

type ProblemRow = {
  id: string;
  problem_number: number;
  title: string;
  source: string;
  year: number;
  tags: string[];
  created_at: string;
  updated_at: string;
};

type ContestRow = {
  id: string;
  name: string;
  short_name: string;
  description: string;
  website: string | null;
  years: number[];
};

type ProblemFormData = {
  problemType: "lotc" | "external";
  title: MultiLangContent;
  source: string;
  year: number;
  tags: string;
  problemUrl: string;
  content: MultiLangContent;
  officialSolution: MultiLangContent;
};

type ContestFormData = {
  name: string;
  shortName: string;
  description: string;
  website: string;
  years: string;
};

const emptyProblemForm: ProblemFormData = {
  problemType: "external",
  title: { ko: "" },
  source: "",
  year: new Date().getFullYear(),
  tags: "",
  problemUrl: "",
  content: { ko: "" },
  officialSolution: { ko: "" },
};

const emptyContestForm: ContestFormData = {
  name: "",
  shortName: "",
  description: "",
  website: "",
  years: "",
};

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>("problems");

  const [problemMode, setProblemMode] = useState<"none" | "add" | "edit">("none");
  const [editingProblemId, setEditingProblemId] = useState<string | null>(null);
  const [problemForm, setProblemForm] = useState<ProblemFormData>(emptyProblemForm);
  const [allProblems, setAllProblems] = useState<ProblemRow[]>([]);

  const [contestMode, setContestMode] = useState<"none" | "add" | "edit">("none");
  const [editingContestId, setEditingContestId] = useState<string | null>(null);
  const [contestForm, setContestForm] = useState<ContestFormData>(emptyContestForm);
  const [allContests, setAllContests] = useState<ContestRow[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchData = useCallback(async (sig?: AbortSignal) => {
    // Restore from cache immediately
    const cachedProblems = getCached<ProblemRow[]>("admin_problems", true);
    const cachedContests = getCached<ContestRow[]>("admin_contests", true);
    if (cachedProblems) setAllProblems(cachedProblems);
    if (cachedContests) setAllContests(cachedContests);
    if (cachedProblems && cachedContests && !isCacheStale("admin_problems") && !isCacheStale("admin_contests")) return;

    setFetchError(null);
    try {
      const [pRes, cRes] = await Promise.allSettled([
        withRetry(async () => withTimeout(supabase.from("problems").select("id, problem_number, title, source, year, tags, created_at, updated_at").order("problem_number"), 10000, sig)),
        withRetry(async () => withTimeout(supabase.from("contests").select("*"), 8000, sig)),
      ]);

      if (sig?.aborted) return;

      if (pRes.status === "fulfilled" && !pRes.value.error && pRes.value.data) {
        setAllProblems(pRes.value.data);
        setCache("admin_problems", pRes.value.data);
      } else {
        setFetchError("문제 데이터를 불러오는 데 실패했습니다.");
      }

      if (cRes.status === "fulfilled" && !cRes.value.error && cRes.value.data) {
        setAllContests(cRes.value.data);
        setCache("admin_contests", cRes.value.data);
      } else if (!fetchError) {
        setFetchError("대회 데이터를 불러오는 데 실패했습니다.");
      }
    } catch {
      if (sig?.aborted) return;
      setFetchError("데이터를 불러오는 데 실패했습니다.");
    }
  }, []);

  useEffect(() => {
    if (!user?.is_admin) return;
    let controller = new AbortController();
    fetchData(controller.signal);

    function handleVisibility() {
      if (document.visibilityState === "visible") {
        controller.abort();
        controller = new AbortController();
        fetchData(controller.signal);
      }
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      controller.abort();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [user, fetchData]);

  // Pre-compute problem counts per contest (O(n) instead of O(n×m) per render)
  const contestProblemCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const contest of allContests) {
      const shortLower = contest.short_name.toLowerCase();
      counts[contest.id] = allProblems.filter((p) => p.source.toLowerCase().includes(shortLower)).length;
    }
    return counts;
  }, [allProblems, allContests]);

  // Problem handlers
  const openAddProblem = () => { setProblemForm(emptyProblemForm); setEditingProblemId(null); setProblemMode("add"); };
  const openEditProblem = async (p: ProblemRow) => {
    // Fetch content & official_solution on demand (not loaded in list query)
    const { data } = await supabase.from("problems").select("title, content, official_solution, problem_url").eq("id", p.id).single();
    const isLoTC = p.source.trim().toLowerCase() === "lotc";
    setProblemForm({
      problemType: isLoTC ? "lotc" : "external",
      title: parseMultiLang(data?.title ?? p.title), source: p.source, year: p.year, tags: p.tags.join(", "),
      problemUrl: data?.problem_url ?? "",
      content: parseMultiLang(data?.content ?? ""),
      officialSolution: parseMultiLang(data?.official_solution ?? ""),
    });
    setEditingProblemId(p.id); setProblemMode("edit");
  };
  const closeProblemForm = () => { setProblemMode("none"); setEditingProblemId(null); setProblemForm(emptyProblemForm); };

  const handleProblemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const tags = problemForm.tags.split(",").map((t) => t.trim()).filter(Boolean);
    const now = new Date().toISOString();

    const titleStr = serializeMultiLang(problemForm.title);
    const contentStr = serializeMultiLang(problemForm.content);
    const solutionStr = serializeMultiLang(problemForm.officialSolution);

    const finalSource = problemForm.problemType === "lotc" ? "LoTC" : problemForm.source;
    const finalYear = problemForm.problemType === "lotc"
      ? problemForm.year
      : (parseInt(problemForm.source.match(/\d{4}/)?.[0] ?? "") || new Date().getFullYear());

    if (problemMode === "edit" && editingProblemId) {
      const { error } = await supabase.from("problems").update({
        title: titleStr, source: finalSource, year: finalYear,
        tags, content: contentStr, official_solution: solutionStr,
        problem_url: problemForm.problemType === "external" ? (problemForm.problemUrl || null) : null,
        updated_at: now,
      }).eq("id", editingProblemId);

      if (error) {
        setSubmitError(`문제 수정 실패: ${error.message}`);
        return;
      }
      setAllProblems(allProblems.map((p) =>
        p.id === editingProblemId ? { ...p, title: titleStr, source: finalSource, year: finalYear, tags, updated_at: now } : p
      ));
    } else {
      const id = `custom-${Date.now()}`;
      const maxNum = allProblems.length > 0
        ? Math.max(...allProblems.map((p) => p.problem_number || 0))
        : 999;
      const nextNumber = Math.max(maxNum + 1, 1000);
      const { data, error } = await supabase.from("problems").insert({
        id, problem_number: nextNumber, title: titleStr, source: finalSource, year: finalYear,
        tags, content: contentStr, official_solution: solutionStr,
        problem_url: problemForm.problemType === "external" ? (problemForm.problemUrl || null) : null,
      }).select("id, problem_number, title, source, year, tags, created_at, updated_at").single();

      if (error) {
        setSubmitError(`문제 등록 실패: ${error.message}`);
        return;
      }
      if (data) {
        setAllProblems([data, ...allProblems]);
      }
    }
    closeProblemForm();
  };

  const handleDeleteProblem = async (id: string) => {
    if (confirm("정말 이 문제를 삭제하시겠습니까?")) {
      const { error } = await supabase.from("problems").delete().eq("id", id);
      if (!error) setAllProblems(allProblems.filter((p) => p.id !== id));
    }
  };

  // Contest handlers
  const openAddContest = () => { setContestForm(emptyContestForm); setEditingContestId(null); setContestMode("add"); };
  const openEditContest = (c: ContestRow) => {
    setContestForm({ name: c.name, shortName: c.short_name, description: c.description, website: c.website || "", years: c.years.join(", ") });
    setEditingContestId(c.id); setContestMode("edit");
  };
  const closeContestForm = () => { setContestMode("none"); setEditingContestId(null); setContestForm(emptyContestForm); };

  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    const years = contestForm.years.split(",").map((y) => parseInt(y.trim())).filter((y) => !isNaN(y)).sort((a, b) => b - a);

    if (contestMode === "edit" && editingContestId) {
      const { error } = await supabase.from("contests").update({
        name: contestForm.name, short_name: contestForm.shortName, description: contestForm.description,
        website: contestForm.website || null, years,
      }).eq("id", editingContestId);

      if (error) {
        setSubmitError(`대회 수정 실패: ${error.message}`);
        return;
      }
      setAllContests(allContests.map((c) =>
        c.id === editingContestId ? { ...c, name: contestForm.name, short_name: contestForm.shortName, description: contestForm.description, website: contestForm.website || null, years } : c
      ));
    } else {
      const id = contestForm.shortName.toLowerCase().replace(/\s+/g, "-");
      const { data, error } = await supabase.from("contests").insert({
        id, name: contestForm.name, short_name: contestForm.shortName,
        description: contestForm.description, website: contestForm.website || null, years,
      }).select().single();

      if (error) {
        setSubmitError(`대회 등록 실패: ${error.message}`);
        return;
      }
      if (data) {
        setAllContests([...allContests, data]);
      }
    }
    closeContestForm();
  };

  const handleDeleteContest = async (id: string) => {
    if (confirm("정말 이 대회를 삭제하시겠습니까?")) {
      const { error } = await supabase.from("contests").delete().eq("id", id);
      if (!error) setAllContests(allContests.filter((c) => c.id !== id));
    }
  };

  const inputClass = "w-full px-4 py-2.5 border border-neutral-300 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none transition-colors";
  const labelClass = "block text-xs font-medium text-neutral-500 mb-1.5 uppercase tracking-wider";

  if (authLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-neutral-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (fetchError && allProblems.length === 0 && allContests.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <p className="text-red-500 text-sm mb-4">{fetchError}</p>
        <button onClick={() => fetchData()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
      </div>
    );
  }

  if (!user || !user.is_admin) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <h1 className="text-xl font-light text-black mb-4">접근 권한이 없습니다</h1>
        <p className="text-sm text-neutral-400 mb-6">
          {!user ? "관리자 계정으로 로그인해주세요." : "관리자 전용 페이지입니다."}
        </p>
        <Link href={!user ? "/login" : "/"} className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">
          {!user ? "로그인" : "홈으로"}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-light text-black mb-8">관리자 패널</h1>

      {/* Tabs */}
      <div className="flex gap-0 mb-8 border-b border-neutral-200">
        <button onClick={() => { setTab("problems"); closeContestForm(); }} className={`px-6 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === "problems" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}>문제 관리</button>
        <button onClick={() => { setTab("contests"); closeProblemForm(); }} className={`px-6 py-3 text-xs font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${tab === "contests" ? "border-black text-black" : "border-transparent text-neutral-400 hover:text-neutral-600"}`}>대회 관리</button>
      </div>

      {/* Problems Tab */}
      {tab === "problems" && (
        <>
          <div className="flex justify-end mb-6">
            <button onClick={problemMode === "none" ? openAddProblem : closeProblemForm} className="px-5 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">
              {problemMode !== "none" ? "취소" : "+ 새 문제 추가"}
            </button>
          </div>

          {submitError && (
            <div className="border border-red-200 bg-red-50 p-4 mb-6">
              <p className="text-red-600 text-sm">{submitError}</p>
            </div>
          )}

          {problemMode !== "none" && (
            <div className="border border-neutral-200 p-8 mb-8">
              <h2 className="text-lg font-light text-black mb-6">{problemMode === "edit" ? "문제 수정" : "새 문제 추가"}</h2>
              <form onSubmit={handleProblemSubmit} className="space-y-5">

                {/* Problem type selector */}
                <div>
                  <label className={labelClass}>문제 유형</label>
                  <div className="flex gap-0">
                    {(["lotc", "external"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setProblemForm({ ...problemForm, problemType: t, source: t === "lotc" ? "LoTC" : "" })}
                        className={`px-5 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors border ${
                          problemForm.problemType === t
                            ? "bg-black text-white border-black"
                            : "bg-white text-neutral-500 border-neutral-300 hover:border-neutral-500 hover:text-black"
                        }`}
                      >
                        {t === "lotc" ? "LoTC 고유 문제" : "외부 문제"}
                      </button>
                    ))}
                  </div>
                  {problemForm.problemType === "lotc" && (
                    <p className="text-[11px] text-neutral-400 mt-1.5">문제 지문과 공식 풀이를 직접 입력합니다. 출처는 자동으로 &quot;LoTC&quot;로 설정됩니다.</p>
                  )}
                  {problemForm.problemType === "external" && (
                    <p className="text-[11px] text-neutral-400 mt-1.5">출처 기관의 공식 링크를 연결합니다.</p>
                  )}
                </div>

                <MultiLangEditor label="제목" value={problemForm.title} onChange={(title) => setProblemForm({ ...problemForm, title })} rows={1} placeholder="문제 제목" required />

                <div className="grid md:grid-cols-2 gap-5">
                  {problemForm.problemType === "external" && (
                    <div><label className={labelClass}>출처 (연도 포함)</label><input type="text" required maxLength={100} value={problemForm.source} onChange={(e) => setProblemForm({ ...problemForm, source: e.target.value })} className={inputClass} placeholder="예: IPhO 2025, KPhO 2024" /></div>
                  )}
                  {problemForm.problemType === "lotc" && (
                    <div><label className={labelClass}>연도</label><input type="number" required min={1900} max={2100} value={problemForm.year} onChange={(e) => { const v = e.target.valueAsNumber; if (!isNaN(v)) setProblemForm({ ...problemForm, year: v }); }} onWheel={(e) => e.currentTarget.blur()} className={inputClass} /></div>
                  )}
                  <div><label className={labelClass}>태그 (쉼표로 구분)</label><input type="text" value={problemForm.tags} onChange={(e) => setProblemForm({ ...problemForm, tags: e.target.value })} className={inputClass} placeholder="예: electromagnetism, special-relativity" /></div>
                </div>

                {problemForm.problemType === "external" && (
                  <div><label className={labelClass}>공식 문제 링크 (선택)</label><input type="url" value={problemForm.problemUrl} onChange={(e) => setProblemForm({ ...problemForm, problemUrl: e.target.value })} className={inputClass} placeholder="https://..." /></div>
                )}

                {problemForm.problemType === "lotc" && (
                  <>
                    <MultiLangEditor label="문제 내용 (LaTeX 지원)" value={problemForm.content} onChange={(content) => setProblemForm({ ...problemForm, content })} rows={10} placeholder="LaTeX 수식을 포함한 문제 내용을 입력하세요." required />
                    <MultiLangEditor label="공식 풀이 (LaTeX 지원)" value={problemForm.officialSolution} onChange={(officialSolution) => setProblemForm({ ...problemForm, officialSolution })} rows={10} placeholder="공식 풀이를 입력하세요..." required />
                  </>
                )}

                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">{problemMode === "edit" ? "수정 완료" : "문제 등록"}</button>
                  <button type="button" onClick={closeProblemForm} className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium hover:border-black hover:text-black transition-colors uppercase tracking-wider">취소</button>
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
                    <h3 className="font-medium text-black text-sm truncate">{getDisplayText(problem.title)}</h3>
                    <p className="text-xs text-neutral-400 mt-1">{problem.source.toLowerCase() === "lotc" ? "LoTC" : problem.source}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {problem.tags.slice(0, 4).map((tag) => (<span key={tag} className="text-xs text-neutral-400">#{tag}</span>))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button onClick={() => openEditProblem(problem)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors uppercase tracking-wider">수정</button>
                    <button onClick={() => handleDeleteProblem(problem.id)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Contests Tab */}
      {tab === "contests" && (
        <>
          <div className="flex justify-end mb-6">
            <button onClick={contestMode === "none" ? openAddContest : closeContestForm} className="px-5 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">
              {contestMode !== "none" ? "취소" : "+ 새 대회 추가"}
            </button>
          </div>

          {contestMode !== "none" && (
            <div className="border border-neutral-200 p-8 mb-8">
              <h2 className="text-lg font-light text-black mb-6">{contestMode === "edit" ? "대회 수정" : "새 대회 추가"}</h2>
              <form onSubmit={handleContestSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>대회명</label><input type="text" required maxLength={200} value={contestForm.name} onChange={(e) => setContestForm({ ...contestForm, name: e.target.value })} className={inputClass} placeholder="예: International Physics Olympiad" /></div>
                  <div><label className={labelClass}>약칭</label><input type="text" required maxLength={20} value={contestForm.shortName} onChange={(e) => setContestForm({ ...contestForm, shortName: e.target.value })} className={inputClass} placeholder="예: IPhO" /></div>
                </div>
                <div><label className={labelClass}>설명</label><textarea value={contestForm.description} onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })} className={`${inputClass} resize-none`} rows={3} placeholder="대회에 대한 간략한 설명" /></div>
                <div className="grid md:grid-cols-2 gap-5">
                  <div><label className={labelClass}>공식 웹사이트 (선택)</label><input type="url" value={contestForm.website} onChange={(e) => setContestForm({ ...contestForm, website: e.target.value })} className={inputClass} placeholder="https://..." /></div>
                  <div><label className={labelClass}>연도 (쉼표로 구분)</label><input type="text" required value={contestForm.years} onChange={(e) => setContestForm({ ...contestForm, years: e.target.value })} className={inputClass} placeholder="예: 2023, 2022, 2021, 2020" /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" className="px-6 py-2.5 bg-black text-white text-xs font-medium hover:bg-neutral-800 transition-colors uppercase tracking-wider">{contestMode === "edit" ? "수정 완료" : "대회 등록"}</button>
                  <button type="button" onClick={closeContestForm} className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium hover:border-black hover:text-black transition-colors uppercase tracking-wider">취소</button>
                </div>
              </form>
            </div>
          )}

          <div className="border border-neutral-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-200 bg-neutral-50">
              <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider">등록된 대회 ({allContests.length})</h2>
            </div>
            <div className="divide-y divide-neutral-200">
              {allContests.map((contest) => (
                  <div key={contest.id} className="px-6 py-4 flex items-center justify-between hover:bg-neutral-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-black text-sm">{contest.name}</h3>
                        <span className="text-xs text-neutral-400 bg-neutral-100 px-2 py-0.5">{contest.short_name}</span>
                      </div>
                      <p className="text-xs text-neutral-400 truncate">{contest.description}</p>
                      <div className="flex items-center gap-4 mt-1 text-xs text-neutral-400">
                        <span>{contest.years.length}개 연도</span>
                        <span>{contestProblemCounts[contest.id] ?? 0}문제</span>
                        {contest.website && <span>웹사이트 있음</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button onClick={() => openEditContest(contest)} className="px-3 py-1.5 text-xs text-neutral-500 hover:text-black hover:bg-neutral-100 transition-colors uppercase tracking-wider">수정</button>
                      <button onClick={() => handleDeleteContest(contest.id)} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors uppercase tracking-wider">삭제</button>
                    </div>
                  </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
