"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { problems } from "@/data/problems";
import { SUBJECT_LABELS, DIFFICULTY_LABELS } from "@/types";

export default function ProfilePage() {
  const { user, logout, updateProfile } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <p className="text-neutral-500 mb-4">로그인이 필요합니다.</p>
        <Link
          href="/login"
          className="px-6 py-2.5 bg-black text-white text-sm tracking-widest uppercase hover:bg-neutral-800 transition-colors"
        >
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

  const bookmarkedProblems = problems.filter((p) => user.bookmarkedProblems.includes(p.id));
  const solvedProblems = problems.filter((p) => user.solvedProblems.includes(p.id));

  const handleSaveProfile = () => {
    updateProfile({ name: editName, bio: editBio });
    setIsEditing(false);
  };

  const startEdit = () => {
    setEditName(user.name);
    setEditBio(user.bio);
    setIsEditing(true);
  };

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
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="block text-xl font-light border border-neutral-200 px-3 py-1.5 focus:border-black focus:outline-none"
                  />
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value)}
                    placeholder="자기소개를 입력하세요"
                    rows={2}
                    className="block w-full text-sm border border-neutral-200 px-3 py-1.5 focus:border-black focus:outline-none resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-1.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-1.5 border border-neutral-200 text-xs tracking-widest uppercase hover:border-black transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-light mb-1">{user.name}</h1>
                  {user.bio && (
                    <p className="text-sm text-neutral-500 mb-2">{user.bio}</p>
                  )}
                  <p className="text-xs text-neutral-400">{user.email}</p>
                  <p className="text-xs text-neutral-400 mt-1">가입일: {joinDate}</p>
                </>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="flex gap-2">
              <button
                onClick={startEdit}
                className="px-4 py-2 border border-neutral-200 text-xs tracking-widest uppercase hover:border-black transition-colors"
              >
                편집
              </button>
              <button
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="px-4 py-2 border border-neutral-200 text-xs text-neutral-400 tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors"
              >
                로그아웃
              </button>
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

      {/* Bookmarked Problems */}
      <section className="mb-8">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">북마크한 문제</h2>
        {bookmarkedProblems.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">아직 북마크한 문제가 없습니다.</p>
            <Link href="/problems" className="text-sm text-black hover:underline mt-2 inline-block">
              문제 목록 보기 &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {bookmarkedProblems.map((p) => (
              <Link key={p.id} href={`/problems/${p.id}`} className="block border border-neutral-200 p-4 hover:border-black transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{p.title}</span>
                  <div className="flex gap-2 text-xs text-neutral-400">
                    <span>{SUBJECT_LABELS[p.subject]}</span>
                    <span>&middot;</span>
                    <span>{DIFFICULTY_LABELS[p.difficulty]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Solved Problems */}
      <section>
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-6">풀이 완료</h2>
        {solvedProblems.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">아직 풀이를 완료한 문제가 없습니다.</p>
            <Link href="/problems" className="text-sm text-black hover:underline mt-2 inline-block">
              문제 풀러 가기 &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {solvedProblems.map((p) => (
              <Link key={p.id} href={`/problems/${p.id}`} className="block border border-neutral-200 p-4 hover:border-black transition-colors">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{p.title}</span>
                  <div className="flex gap-2 text-xs text-neutral-400">
                    <span>{SUBJECT_LABELS[p.subject]}</span>
                    <span>&middot;</span>
                    <span>{DIFFICULTY_LABELS[p.difficulty]}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
