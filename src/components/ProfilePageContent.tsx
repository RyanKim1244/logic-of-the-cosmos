"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { getDisplayText } from "@/lib/multilang";

const ContributionHeatmap = dynamic(() => import("@/components/ContributionHeatmap"), {
  ssr: false,
  loading: () => <div className="border border-neutral-200 p-6 h-48 animate-pulse bg-neutral-50" />,
});

interface ProblemSummary {
  id: string;
  problem_number: number;
  title: string;
  source: string;
}

interface SolveRecord {
  problem_id: string;
  created_at: string;
  problem_number: number;
  title: string;
  source: string;
}

interface UserProfile {
  name: string;
  email: string;
  bio: string;
  createdAt: string;
}

export interface ProfileData {
  userProfile: UserProfile;
  solvedCount: number;
  solutionCount: number;
  discussionCount: number;
  solvedDates: string[];
  solveHistory: SolveRecord[];
  bookmarkedProblems: ProblemSummary[];
  solvedProblems: ProblemSummary[];
}

function CollapsibleSection({
  title, count, emptyText, emptyLink, emptyLinkText, items, solvedIds, bookmarkedIds,
}: {
  title: string; count: number; emptyText: string; emptyLink: string; emptyLinkText: string;
  items: ProblemSummary[];
  solvedIds?: Set<string>;
  bookmarkedIds?: Set<string>;
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
              className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {isOpen && (
            <div className="px-6 pb-5 space-y-2 animate-fade-slide-up">
              {items.map((p) => {
                const isSolved = solvedIds?.has(p.id) ?? false;
                const isBookmarked = bookmarkedIds?.has(p.id) ?? false;
                return (
                  <Link key={p.id} href={`/problems/${p.id}`} className={`block border p-4 hover:border-black transition-colors ${isSolved ? "border-emerald-300" : "border-neutral-200"}`}>
                    <div className="flex items-center gap-3">
                      {(isSolved || isBookmarked) && (
                        <div className="flex items-center gap-1 shrink-0">
                          {isSolved && (
                            <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title="풀이 완료">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                          )}
                          {isBookmarked && (
                            <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center" title="북마크">
                              <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          {p.problem_number > 0 && <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{p.problem_number}</span>}
                          <span className="text-sm font-medium truncate">{getDisplayText(p.title)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-neutral-400 shrink-0">{p.source}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default function ProfilePageContent({ initialData }: { initialData: ProfileData | null }) {
  const { user, loading: authLoading, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  // Client-side fallback: when server data is unavailable but user is authenticated,
  // fetch profile stats/history directly from the browser.
  const [clientData, setClientData] = useState<ProfileData | null>(null);
  const fetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch client-side if server didn't provide data and user is logged in
    if (initialData || !user?.id) return;
    // Prevent duplicate fetches across remounts (React Strict Mode / RSC streaming)
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    let cancelled = false;
    (async () => {
      const userId = user.id;

      const [statsRes, heatmapRes, historyRes, bookmarkedRes] = await Promise.allSettled([
        supabase
          .from("user_stats")
          .select("solved_count, solution_count, discussion_count")
          .eq("user_id", userId)
          .single(),
        supabase.rpc("get_solve_heatmap", { p_user_id: userId, p_days: 183 }),
        supabase
          .from("user_solved_problems")
          .select("problem_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabase
          .from("user_bookmarked_problems")
          .select("problem_id")
          .eq("user_id", userId),
      ]);

      if (cancelled) return;

      // Log errors for debugging (visible in browser console)
      const queryNames = ["user_stats", "get_solve_heatmap", "user_solved_problems", "user_bookmarked_problems"];
      [statsRes, heatmapRes, historyRes, bookmarkedRes].forEach((res, i) => {
        if (res.status === "rejected") {
          console.error(`[Profile] ${queryNames[i]} rejected:`, res.reason);
        } else if (res.value.error) {
          console.error(`[Profile] ${queryNames[i]} error:`, res.value.error.message);
        }
      });

      // Extract solved data — check for Supabase errors explicitly
      const historyData =
        historyRes.status === "fulfilled" && historyRes.value.data && !historyRes.value.error
          ? (historyRes.value.data as { problem_id: string; created_at: string }[])
          : [];

      const solvedIds = historyData.map((s) => s.problem_id);
      const bookmarkedIds =
        bookmarkedRes.status === "fulfilled" && bookmarkedRes.value.data && !bookmarkedRes.value.error
          ? bookmarkedRes.value.data.map((b: { problem_id: string }) => b.problem_id)
          : [];
      const allIds = [...new Set([...solvedIds, ...bookmarkedIds])];

      const detailsData =
        allIds.length > 0
          ? (await supabase.from("problems").select("id, problem_number, title, source").in("id", allIds)).data ?? []
          : [];

      if (cancelled) return;

      const detailMap = new Map(
        detailsData.map((p: { id: string; problem_number: number; title: string; source: string }) => [p.id, p])
      );

      // Heatmap: try RPC first, fall back to raw timestamps
      let dates: string[] = [];
      if (heatmapRes.status === "fulfilled" && heatmapRes.value.data && !heatmapRes.value.error) {
        for (const row of heatmapRes.value.data as { solve_date: string; solve_count: number }[]) {
          for (let i = 0; i < row.solve_count; i++) dates.push(row.solve_date);
        }
      }
      if (dates.length === 0 && historyData.length > 0) {
        dates = historyData.map((s) => s.created_at);
      }

      // Solve history — show records even if problem detail is missing
      const history: SolveRecord[] = historyData.map((s) => {
        const detail = detailMap.get(s.problem_id);
        return {
          problem_id: s.problem_id,
          created_at: s.created_at,
          title: detail?.title ?? "(삭제된 문제)",
          source: detail?.source ?? "",
          problem_number: detail?.problem_number ?? 0,
        };
      });

      const statsData =
        statsRes.status === "fulfilled" && statsRes.value.data && !statsRes.value.error
          ? statsRes.value.data
          : null;

      setClientData({
        userProfile: { name: user.name, email: user.email, bio: user.bio, createdAt: user.createdAt },
        solvedCount: statsData?.solved_count ?? historyData.length,
        solutionCount: statsData?.solution_count ?? 0,
        discussionCount: statsData?.discussion_count ?? 0,
        solvedDates: dates,
        solveHistory: history,
        bookmarkedProblems: bookmarkedIds.map((id: string) => detailMap.get(id)).filter((p): p is ProblemSummary => !!p),
        solvedProblems: solvedIds.map((id: string) => {
          const detail = detailMap.get(id);
          return detail ?? { id, problem_number: 0, title: "(삭제된 문제)", source: "" };
        }),
      });
    })();

    return () => { cancelled = true; };
  }, [initialData, user?.id]);

  // Use server data first, then client-fetched fallback
  const data = initialData ?? clientData;

  const solvedCount = data?.solvedCount ?? 0;
  const solutionCount = data?.solutionCount ?? 0;
  const discussionCount = data?.discussionCount ?? 0;
  const solvedDates = data?.solvedDates ?? [];
  const solveHistory = data?.solveHistory ?? [];
  const bookmarkedProblems = data?.bookmarkedProblems ?? [];
  const solvedProblems = data?.solvedProblems ?? [];
  const solvedIdSet = new Set(solvedProblems.map((p) => p.id));
  const bookmarkedIdSet = new Set(bookmarkedProblems.map((p) => p.id));

  // Only show loading/login states when there's no data at all to display.
  // When initialData or clientData exists, render immediately.
  if (!data) {
    if (authLoading) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center">
          <p className="text-neutral-400 text-sm">로딩 중...</p>
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
  }

  // Prefer live AuthContext user, fall back to server-fetched profile
  const profile = user ?? (data?.userProfile ? {
    id: "",
    email: data.userProfile.email,
    name: data.userProfile.name,
    createdAt: data.userProfile.createdAt,
    bio: data.userProfile.bio,
    is_admin: false,
    solvedProblems: solvedProblems.map(p => p.id),
    bookmarkedProblems: bookmarkedProblems.map(p => p.id),
  } : null);

  // If we have neither server data nor auth user, redirect to login
  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">로그인이 필요합니다.</p>
        <Link href="/login" className="px-6 py-2.5 bg-black text-white text-sm tracking-widest uppercase hover:bg-neutral-800 transition-colors">
          로그인
        </Link>
      </div>
    );
  }

  const joinDate = new Date(profile.createdAt).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const handleSaveProfile = async () => {
    await updateProfile({ name: editName, bio: editBio });
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditName(profile.name);
    setEditBio(profile.bio);
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
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              {isEditing && user ? (
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
                  <h1 className="text-2xl font-light mb-1">{profile.name}</h1>
                  {profile.bio && <p className="text-sm text-neutral-500 mb-2">{profile.bio}</p>}
                  <p className="text-xs text-neutral-400">{profile.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">가입일: {joinDate}</p>
                </>
              )}
            </div>
          </div>

          {!isEditing && user && (
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
          <div className="text-3xl font-extralight">{solvedCount}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">해결한 문제</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{solutionCount}</div>
          <div className="text-xs text-neutral-400 mt-2 uppercase tracking-widest">작성한 풀이</div>
        </div>
        <div className="border border-neutral-200 p-6 text-center">
          <div className="text-3xl font-extralight">{discussionCount}</div>
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
                  {records.map((record, i) => {
                    const isBookmarked = profile?.bookmarkedProblems?.includes(record.problem_id) ?? false;
                    return (
                      <Link
                        key={`${record.problem_id}-${i}`}
                        href={`/problems/${record.problem_id}`}
                        className="block border border-emerald-300 p-3 hover:border-black transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 shrink-0">
                            <span className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center" title="풀이 완료">
                              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </span>
                            {isBookmarked && (
                              <span className="w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center" title="북마크">
                                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              {record.problem_number > 0 && <span className="text-[10px] text-neutral-300 font-mono shrink-0">#{record.problem_number}</span>}
                              <span className="text-sm font-medium truncate">{getDisplayText(record.title)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs text-neutral-400">{record.source}</span>
                            <span className="text-[10px] text-neutral-300">
                              {new Date(record.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
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
        solvedIds={solvedIdSet}
        bookmarkedIds={bookmarkedIdSet}
      />

      {/* Solved Problems */}
      <CollapsibleSection
        title="풀이 완료"
        count={solvedProblems.length}
        emptyText="아직 풀이를 완료한 문제가 없습니다."
        emptyLink="/problems"
        emptyLinkText="문제 풀러 가기"
        items={solvedProblems}
        solvedIds={solvedIdSet}
        bookmarkedIds={bookmarkedIdSet}
      />
    </div>
  );
}
