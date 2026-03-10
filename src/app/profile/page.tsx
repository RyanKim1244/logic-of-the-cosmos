"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase, withTimeout } from "@/lib/supabase";
import ContributionHeatmap from "@/components/ContributionHeatmap";

interface ProblemSummary {
  id: string;
  title: string;
  source: string;
}

interface SolveRecord {
  problem_id: string;
  created_at: string;
  title: string;
  source: string;
}

function CollapsibleSection({
  title, count, emptyText, emptyLink, emptyLinkText, items,
}: {
  title: string; count: number; emptyText: string; emptyLink: string; emptyLinkText: string;
  items: ProblemSummary[];
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <section className="mb-8">
      {items.length === 0 ? (
        <>
          <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">{title}</h2>
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">{emptyText}</p>
            <Link href={emptyLink} className="text-sm text-black hover:underline mt-2 inline-block">{emptyLinkText} &rarr;</Link>
          </div>
        </>
      ) : (
        <div className="border border-neutral-200">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-neutral-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">{title}</h2>
              <span className="text-xs text-neutral-400">{count}개</span>
            </div>
            <svg
              className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div className="px-6 pb-5 space-y-2">
              {items.map((p) => (
                <Link key={p.id} href={`/problems/${p.id}`} className="block border border-neutral-200 p-4 hover:border-black transition-colors">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{p.title}</span>
                    <span className="text-xs text-neutral-400">{p.source}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [bookmarkedProblems, setBookmarkedProblems] = useState<ProblemSummary[]>([]);
  const [solvedProblems, setSolvedProblems] = useState<ProblemSummary[]>([]);
  const [solveHistory, setSolveHistory] = useState<SolveRecord[]>([]);
  const [solvedDates, setSolvedDates] = useState<string[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function fetchProblems() {
      if (!user) return;
      const sig = controller.signal;

      try {
        // Fetch bookmarked and solved in parallel
        const [bookmarkedRes, solvedRes, solveHistoryRes] = await Promise.all([
          user.bookmarkedProblems.length > 0
            ? withTimeout(supabase.from("problems").select("id, title, source").in("id", user.bookmarkedProblems), 5000, sig)
            : Promise.resolve({ data: null, error: null }),
          user.solvedProblems.length > 0
            ? withTimeout(supabase.from("problems").select("id, title, source").in("id", user.solvedProblems), 5000, sig)
            : Promise.resolve({ data: null, error: null }),
          withTimeout(supabase.from("user_solved_problems").select("problem_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }), 5000, sig),
        ]);

        if (sig.aborted) return;

        if (bookmarkedRes.error) { setFetchError("북마크 데이터를 불러오는 데 실패했습니다."); return; }
        if (bookmarkedRes.data) setBookmarkedProblems(bookmarkedRes.data);

        if (solvedRes.error) { setFetchError("풀이 데이터를 불러오는 데 실패했습니다."); return; }
        if (solvedRes.data) setSolvedProblems(solvedRes.data);

        if (solveHistoryRes.error) { setFetchError("풀이 기록을 불러오는 데 실패했습니다."); return; }

        const solveData = solveHistoryRes.data;
        if (solveData) {
          setSolvedDates(solveData.map((s: { created_at: string }) => s.created_at));

          const problemIds = solveData.map((s: { problem_id: string }) => s.problem_id);
          if (problemIds.length > 0) {
            const { data: problemDetails } = await withTimeout(
              supabase.from("problems").select("id, title, source").in("id", problemIds), 5000, sig
            );
            if (sig.aborted) return;

            if (problemDetails) {
              const detailMap = new Map(problemDetails.map((p) => [p.id, p]));
              const history: SolveRecord[] = solveData
                .map((s: { problem_id: string; created_at: string }) => {
                  const detail = detailMap.get(s.problem_id);
                  if (!detail) return null;
                  return { problem_id: s.problem_id, created_at: s.created_at, title: detail.title, source: detail.source };
                })
                .filter((r: SolveRecord | null): r is SolveRecord => r !== null);
              setSolveHistory(history);
            }
          }
        }
      } catch {
        if (sig.aborted) return;
        setFetchError("프로필 데이터를 불러오는 데 실패했습니다.");
      }
    }
    fetchProblems();
    return () => controller.abort();
  }, [user]);

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-red-500 text-sm mb-4">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors">다시 시도</button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">로그인이 필요합니다.</p>
        <Link href="/login" className="px-6 py-2.5 bg-black text-white text-sm tracking-widest uppercase hover:bg-neutral-800 transition-colors">
          로그인
        </Link>
      </div>
    );
  }

  const joinDate = new Date(user.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSaveProfile = async () => {
    await updateProfile({ name: editName, bio: editBio });
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setIsEditing(true);
  };

  // Group solve history by date
  const groupedHistory: Record<string, SolveRecord[]> = {};
  for (const record of solveHistory) {
    const dateStr = new Date(record.created_at).toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    if (!groupedHistory[dateStr]) groupedHistory[dateStr] = [];
    groupedHistory[dateStr].push(record);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Profile Header */}
      <div className="border border-neutral-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-2xl font-light">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-3">
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="block text-xl font-light border border-neutral-200 px-3 py-1.5 focus:border-black focus:outline-none" />
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="자기소개를 입력하세요" rows={2} className="block w-full text-sm border border-neutral-200 px-3 py-1.5 focus:border-black focus:outline-none resize-none" />
                  <div className="flex gap-2">
                    <button onClick={handleSaveProfile} className="px-4 py-1.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors">저장</button>
                    <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 border border-neutral-200 text-xs tracking-widest uppercase hover:border-black transition-colors">취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-light mb-1">{user.name}</h1>
                  {user.bio && <p className="text-sm text-neutral-500 mb-2">{user.bio}</p>}
                  <p className="text-xs text-neutral-400">{user.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">가입일: {joinDate}</p>
                </>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <button onClick={startEdit} className="px-4 py-2 border border-neutral-200 text-xs tracking-widest uppercase hover:border-black transition-colors">편집</button>
              <button onClick={async () => { await logout(); router.push("/"); }} className="px-4 py-2 border border-neutral-200 text-xs text-neutral-400 tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors">로그아웃</button>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{solvedProblems.length}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">풀이 완료</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{bookmarkedProblems.length}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">북마크</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">0</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">토론 참여</div>
        </div>
      </div>

      {/* Contribution Heatmap */}
      <section className="mb-8">
        <ContributionHeatmap solvedDates={solvedDates} />
      </section>

      {/* Solve History */}
      <section className="mb-8">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">풀이 기록</h2>
        {solveHistory.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">아직 풀이 기록이 없습니다.</p>
            <Link href="/problems" className="text-sm text-black hover:underline mt-2 inline-block">문제 풀러 가기 &rarr;</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedHistory).map(([date, records]) => (
              <div key={date}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <h3 className="text-sm font-medium text-neutral-600">{date}</h3>
                  <span className="text-xs text-neutral-400">{records.length}문제</span>
                </div>
                <div className="space-y-1.5 ml-5 border-l border-neutral-200 pl-4">
                  {records.map((record, i) => (
                    <Link
                      key={`${record.problem_id}-${i}`}
                      href={`/problems/${record.problem_id}`}
                      className="block border border-neutral-200 p-3 hover:border-black transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">{record.title}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-neutral-400">{record.source}</span>
                          <span className="text-[10px] text-neutral-300">
                            {new Date(record.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Bookmarked Problems */}
      <CollapsibleSection
        title="북마크한 문제"
        count={bookmarkedProblems.length}
        emptyText="아직 북마크한 문제가 없습니다."
        emptyLink="/problems"
        emptyLinkText="문제 목록 보기"
        items={bookmarkedProblems}
      />

      {/* Solved Problems */}
      <CollapsibleSection
        title="풀이 완료"
        count={solvedProblems.length}
        emptyText="아직 풀이를 완료한 문제가 없습니다."
        emptyLink="/problems"
        emptyLinkText="문제 풀러 가기"
        items={solvedProblems}
      />
    </div>
  );
}
