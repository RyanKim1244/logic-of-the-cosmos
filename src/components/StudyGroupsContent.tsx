"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { StudyGroup } from "@/types";

export default function StudyGroupsContent() {
  const { user } = useAuth();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchGroups = async () => {
    const { data } = await supabase
      .from("study_groups")
      .select("id, name, description, owner_id, created_at")
      .order("created_at", { ascending: false });

    if (!data) {
      setLoading(false);
      return;
    }

    // Fetch member counts and owner names
    const ownerIds = [...new Set(data.map((g) => g.owner_id))];
    const [membersRes, profilesRes] = await Promise.allSettled([
      supabase.from("study_group_members").select("group_id"),
      ownerIds.length > 0
        ? supabase.from("profiles").select("id, name").in("id", ownerIds)
        : Promise.resolve({ data: [] }),
    ]);

    const memberCounts: Record<string, number> = {};
    if (membersRes.status === "fulfilled" && membersRes.value.data) {
      for (const m of membersRes.value.data) {
        memberCounts[m.group_id] = (memberCounts[m.group_id] || 0) + 1;
      }
    }

    const ownerMap = new Map<string, string>();
    if (profilesRes.status === "fulfilled" && profilesRes.value.data) {
      for (const p of profilesRes.value.data as { id: string; name: string }[]) {
        ownerMap.set(p.id, p.name);
      }
    }

    setGroups(
      data.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description || "",
        ownerId: g.owner_id,
        ownerName: ownerMap.get(g.owner_id) || "알 수 없음",
        memberCount: memberCounts[g.id] || 0,
        createdAt: g.created_at,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreate = async () => {
    if (!user || !newName.trim()) return;
    setCreating(true);

    const { data, error } = await supabase
      .from("study_groups")
      .insert({ name: newName.trim(), description: newDesc.trim(), owner_id: user.id })
      .select("id")
      .single();

    if (!error && data) {
      // Add owner as member
      await supabase
        .from("study_group_members")
        .insert({ group_id: data.id, user_id: user.id, role: "owner" });

      setNewName("");
      setNewDesc("");
      setShowCreate(false);
      fetchGroups();
    }
    setCreating(false);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-2xl font-light tracking-tight">스터디 그룹</h1>
          <p className="text-sm text-neutral-400 mt-1">함께 학습하고 문제를 풀어보세요</p>
        </div>
        {user && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-5 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors"
          >
            {showCreate ? "취소" : "그룹 만들기"}
          </button>
        )}
      </div>

      {/* Create Form */}
      {showCreate && (
        <div className="border border-neutral-200 p-6 mb-8 animate-fade-slide-up">
          <h3 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-4">새 스터디 그룹</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="그룹 이름"
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none"
            />
            <textarea
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="그룹 설명 (선택)"
              rows={3}
              className="w-full border border-neutral-200 px-4 py-3 text-sm focus:border-black focus:outline-none resize-none"
            />
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim()}
              className="px-6 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40"
            >
              {creating ? "생성 중..." : "생성"}
            </button>
          </div>
        </div>
      )}

      {/* Groups List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-neutral-200 p-6 animate-pulse">
              <div className="h-5 bg-neutral-100 rounded w-48 mb-3" />
              <div className="h-4 bg-neutral-50 rounded w-72" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="border border-neutral-200 p-12 text-center">
          <p className="text-neutral-400 text-sm">아직 스터디 그룹이 없습니다.</p>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="text-sm text-black hover:underline mt-3 inline-block"
            >
              첫 그룹을 만들어보세요 &rarr;
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/study-groups/${group.id}`}
              className="block border border-neutral-200 p-6 hover:border-black transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-medium group-hover:text-black transition-colors">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-neutral-500 mt-1 line-clamp-2">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-3">
                    <span className="text-xs text-neutral-400">
                      {group.ownerName}
                    </span>
                    <span className="text-xs text-neutral-300">
                      {new Date(group.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-neutral-400 shrink-0 ml-4">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-xs">{group.memberCount || 0}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
