"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase, withTimeout, withRetry } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface PublicProfile {
  id: string;
  name: string;
  bio: string;
  created_at: string;
}

export default function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [solvedCount, setSolvedCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`pub_stats_${id}`) || "{}").solvedCount ?? 0; } catch { return 0; }
  });
  const [solutionCount, setSolutionCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`pub_stats_${id}`) || "{}").solutionCount ?? 0; } catch { return 0; }
  });
  const [discussionCount, setDiscussionCount] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`pub_stats_${id}`) || "{}").discussionCount ?? 0; } catch { return 0; }
  });

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (user && user.id === id) {
      router.replace("/profile");
    }
  }, [user, id, router]);

  useEffect(() => {
    const controller = new AbortController();
    const sig = controller.signal;

    // Profile (required for page render — controls loading state)
    withRetry(() => withTimeout(supabase.from("profiles").select("id, name, bio, created_at").eq("id", id).single(), 6000, sig), 1, 1000, sig)
      .then((res) => { if (!sig.aborted && res.data) setProfile(res.data); })
      .catch(() => {})
      .finally(() => { if (!sig.aborted) setLoading(false); });

    // All 3 stats from pre-aggregated user_stats table (single row read — fast)
    withRetry(() => withTimeout(supabase.from("user_stats").select("solved_count, solution_count, discussion_count").eq("user_id", id).single(), 4000, sig), 1, 500, sig)
      .then((res) => {
        if (sig.aborted || !res.data) return;
        setSolvedCount(res.data.solved_count);
        setSolutionCount(res.data.solution_count);
        setDiscussionCount(res.data.discussion_count);
        try { sessionStorage.setItem(`pub_stats_${id}`, JSON.stringify({ solvedCount: res.data.solved_count, solutionCount: res.data.solution_count, discussionCount: res.data.discussion_count })); } catch {}
      })
      .catch(() => {});

    return () => controller.abort();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <p className="text-neutral-400 text-sm">로딩 중...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">사용자를 찾을 수 없습니다.</p>
        <Link href="/" className="text-sm text-black hover:underline">홈으로 돌아가기</Link>
      </div>
    );
  }

  const joinDate = new Date(profile.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="border border-neutral-200 p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-black text-white flex items-center justify-center text-2xl font-light">
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-light mb-1">{profile.name}</h1>
            {profile.bio && <p className="text-sm text-neutral-500 mb-2">{profile.bio}</p>}
            <p className="text-xs text-neutral-400">가입일: {joinDate}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
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
    </div>
  );
}
