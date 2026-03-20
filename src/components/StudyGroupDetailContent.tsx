"use client";

import { useState, useEffect } from "react";
import { Link, useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import type { StudyGroupMember, ProblemSet } from "@/types";

interface GroupDetail {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  ownerName: string;
  createdAt: string;
}

export default function StudyGroupDetailContent({ groupId }: { groupId: string }) {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [members, setMembers] = useState<StudyGroupMember[]>([]);
  const [linkedSets, setLinkedSets] = useState<ProblemSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(false);
  const [joining, setJoining] = useState(false);
  const [availableSets, setAvailableSets] = useState<ProblemSet[]>([]);
  const [showAddSet, setShowAddSet] = useState(false);

  const isOwner = user?.id === group?.ownerId;

  const fetchData = async () => {
    const [groupRes, membersRes, setsRes] = await Promise.allSettled([
      supabase.from("study_groups").select("*").eq("id", groupId).single(),
      supabase.from("study_group_members").select("group_id, user_id, role, joined_at").eq("group_id", groupId),
      supabase.from("study_group_sets").select("set_id").eq("group_id", groupId),
    ]);

    if (groupRes.status !== "fulfilled" || !groupRes.value.data) {
      setLoading(false);
      return;
    }

    const g = groupRes.value.data;

    // Fetch owner name
    const { data: ownerProfile } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", g.owner_id)
      .single();

    setGroup({
      id: g.id,
      name: g.name,
      description: g.description || "",
      ownerId: g.owner_id,
      ownerName: ownerProfile?.name || t("common.unknown"),
      createdAt: g.created_at,
    });

    // Members
    if (membersRes.status === "fulfilled" && membersRes.value.data) {
      const memberData = membersRes.value.data;
      const userIds = memberData.map((m) => m.user_id);
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("id, name").in("id", userIds)
        : { data: [] };
      const nameMap = new Map((profiles || []).map((p: { id: string; name: string }) => [p.id, p.name]));

      const mappedMembers: StudyGroupMember[] = memberData.map((m) => ({
        groupId: m.group_id,
        userId: m.user_id,
        userName: nameMap.get(m.user_id) || t("common.unknown"),
        role: m.role as "owner" | "member",
        joinedAt: m.joined_at,
      }));
      setMembers(mappedMembers);

      if (user) {
        setIsMember(memberData.some((m) => m.user_id === user.id));
      }
    }

    // Linked problem sets
    if (setsRes.status === "fulfilled" && setsRes.value.data && setsRes.value.data.length > 0) {
      const setIds = setsRes.value.data.map((s) => s.set_id);
      const { data: sets } = await supabase
        .from("problem_sets")
        .select("id, title, description, owner_id, is_public, time_limit_minutes, created_at")
        .in("id", setIds);

      if (sets) {
        setLinkedSets(
          sets.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || "",
            ownerId: s.owner_id,
            isPublic: s.is_public,
            timeLimitMinutes: s.time_limit_minutes,
            createdAt: s.created_at,
          }))
        );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const handleJoin = async () => {
    if (!user) return;
    setJoining(true);
    const { error } = await supabase
      .from("study_group_members")
      .insert({ group_id: groupId, user_id: user.id, role: "member" });
    if (!error) {
      setIsMember(true);
      fetchData();
    }
    setJoining(false);
  };

  const handleLeave = async () => {
    if (!user || isOwner) return;
    await supabase
      .from("study_group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);
    setIsMember(false);
    fetchData();
  };

  const handleDelete = async () => {
    if (!isOwner) return;
    await supabase.from("study_groups").delete().eq("id", groupId);
    router.push("/study-groups");
  };

  const handleAddSet = async (setId: string) => {
    if (!isOwner) return;
    await supabase.from("study_group_sets").insert({ group_id: groupId, set_id: setId });
    setShowAddSet(false);
    fetchData();
  };

  const loadAvailableSets = async () => {
    const { data } = await supabase
      .from("problem_sets")
      .select("id, title, description, owner_id, is_public, time_limit_minutes, created_at")
      .eq("is_public", true);

    if (data) {
      const linkedIds = new Set(linkedSets.map((s) => s.id));
      setAvailableSets(
        data
          .filter((s) => !linkedIds.has(s.id))
          .map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description || "",
            ownerId: s.owner_id,
            isPublic: s.is_public,
            timeLimitMinutes: s.time_limit_minutes,
            createdAt: s.created_at,
          }))
      );
    }
    setShowAddSet(true);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-neutral-100 rounded w-64" />
          <div className="h-4 bg-neutral-50 rounded w-96" />
          <div className="h-40 bg-neutral-50 rounded" />
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <p className="text-neutral-400">{t("studyGroups.notFound")}</p>
        <Link href="/study-groups" className="text-sm text-black hover:underline mt-4 inline-block">
          {t("studyGroups.backToList")} &rarr;
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <div className="border border-neutral-200 p-8 mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-light mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-sm text-neutral-500 mb-3">{group.description}</p>
            )}
            <div className="flex items-center gap-4 text-xs text-neutral-400">
              <span>{t("studyGroups.creator", { name: group.ownerName })}</span>
              <span>{new Date(group.createdAt).toLocaleDateString("ko-KR")}</span>
              <span>{t("studyGroups.memberCount", { count: members.length })}</span>
            </div>
          </div>
          <div className="flex gap-2">
            {user && !isMember && (
              <button
                onClick={handleJoin}
                disabled={joining}
                className="px-5 py-2.5 bg-black text-white text-xs tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-40"
              >
                {joining ? t("studyGroups.joining") : t("studyGroups.join")}
              </button>
            )}
            {user && isMember && !isOwner && (
              <button
                onClick={handleLeave}
                className="px-5 py-2.5 border border-neutral-200 text-xs tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors"
              >
                {t("studyGroups.leave")}
              </button>
            )}
            {isOwner && (
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 border border-neutral-200 text-xs text-neutral-400 tracking-widest uppercase hover:border-red-300 hover:text-red-500 transition-colors"
              >
                {t("common.delete")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Members */}
      <section className="mb-8">
        <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em] mb-4">{t("studyGroups.members")}</h2>
        <div className="border border-neutral-200 divide-y divide-neutral-100">
          {members.map((m) => (
            <div key={m.userId} className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-medium">
                  {(m.userName || "?").charAt(0).toUpperCase()}
                </div>
                <Link href={`/profile/${m.userId}`} className="text-sm hover:underline">
                  {m.userName}
                </Link>
              </div>
              <div className="flex items-center gap-2">
                {m.role === "owner" && (
                  <span className="text-[10px] px-2 py-0.5 bg-neutral-100 text-neutral-500 uppercase tracking-widest">
                    {t("studyGroups.owner")}
                  </span>
                )}
                <span className="text-xs text-neutral-300">
                  {new Date(m.joinedAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Linked Problem Sets */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xs text-neutral-400 uppercase tracking-[0.3em]">{t("problemSets.title")}</h2>
          {isOwner && (
            <button
              onClick={loadAvailableSets}
              className="text-xs text-black hover:underline"
            >
              {t("studyGroups.addSet")}
            </button>
          )}
        </div>

        {showAddSet && (
          <div className="border border-neutral-200 p-4 mb-4 animate-fade-slide-up">
            <h4 className="text-xs text-neutral-400 uppercase tracking-widest mb-3">{t("studyGroups.selectPublicSet")}</h4>
            {availableSets.length === 0 ? (
              <p className="text-sm text-neutral-400">{t("studyGroups.noAvailableSets")}</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {availableSets.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => handleAddSet(s.id)}
                    className="w-full text-left border border-neutral-200 p-3 hover:border-black transition-colors"
                  >
                    <span className="text-sm font-medium">{s.title}</span>
                    {s.timeLimitMinutes && (
                      <span className="text-xs text-neutral-400 ml-2">{s.timeLimitMinutes}{t("problemSets.minutes")}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowAddSet(false)}
              className="text-xs text-neutral-400 hover:text-black mt-3"
            >
              {t("common.close")}
            </button>
          </div>
        )}

        {linkedSets.length === 0 ? (
          <div className="border border-neutral-200 p-8 text-center">
            <p className="text-neutral-400 text-sm">{t("studyGroups.noLinkedSets")}</p>
            {isOwner && (
              <button onClick={loadAvailableSets} className="text-sm text-black hover:underline mt-2 inline-block">
                {t("studyGroups.addProblemSet")} &rarr;
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {linkedSets.map((s) => (
              <Link
                key={s.id}
                href={`/problem-sets/${s.id}`}
                className="block border border-neutral-200 p-4 hover:border-black transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{s.title}</span>
                  <div className="flex items-center gap-3 text-xs text-neutral-400">
                    {s.timeLimitMinutes && <span>{s.timeLimitMinutes}{t("problemSets.minutes")}</span>}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
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
