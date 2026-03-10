"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

interface PublicProfile {
  id: string;
  name: string;
  bio: string;
  created_at: string;
}

interface PublicProfileContentProps {
  profile: PublicProfile;
  solvedCount: number;
  solutionCount: number;
  discussionCount: number;
}

export default function PublicProfileContent({
  profile,
  solvedCount,
  solutionCount,
  discussionCount,
}: PublicProfileContentProps) {
  const { user } = useAuth();
  const router = useRouter();

  // Redirect to own profile page if viewing self
  useEffect(() => {
    if (user && user.id === profile.id) {
      router.replace("/profile");
    }
  }, [user, profile.id, router]);

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
