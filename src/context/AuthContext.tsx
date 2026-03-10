"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { invalidateCache, invalidateCacheByPrefix } from "@/lib/cache";
import type { User as SupabaseUser } from "@supabase/supabase-js";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  bio: string;
  is_admin: boolean;
  solvedProblems: string[];
  bookmarkedProblems: string[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "bio">>) => Promise<void>;
  toggleSolved: (problemId: string) => Promise<void>;
  toggleBookmark: (problemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  // Auth-critical path: no timeout wrapper to avoid false logouts
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  // Fetch solved and bookmarked in parallel — failures here are non-critical
  const [solvedResult, bookmarkedResult] = await Promise.allSettled([
    supabase.from("user_solved_problems").select("problem_id").eq("user_id", authUser.id),
    supabase.from("user_bookmarked_problems").select("problem_id").eq("user_id", authUser.id),
  ]);

  const solved = solvedResult.status === "fulfilled" ? solvedResult.value.data : null;
  const bookmarked = bookmarkedResult.status === "fulfilled" ? bookmarkedResult.value.data : null;

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    createdAt: profile.created_at,
    bio: profile.bio || "",
    is_admin: profile.is_admin,
    solvedProblems: solved?.map((s) => s.problem_id) || [],
    bookmarkedProblems: bookmarked?.map((b) => b.problem_id) || [],
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let resolved = false;
    let isMounted = true;

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 10000);

    // Try to restore session with retry on transient failures
    async function restoreSession(attempt = 0): Promise<void> {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser && isMounted) {
          const profile = await fetchProfile(authUser);
          if (profile && isMounted) setUser(profile);
        }
      } catch {
        // Retry once on transient failure (network hiccup, cold start)
        if (attempt < 1 && isMounted) {
          await new Promise((r) => setTimeout(r, 1500));
          return restoreSession(attempt + 1);
        }
        // Don't clear user on initial load failure — session may still be valid
      } finally {
        if (!resolved) {
          resolved = true;
          if (isMounted) setLoading(false);
        }
      }
    }

    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Skip INITIAL_SESSION — getUser() above handles initialization.
        if (event === "INITIAL_SESSION") return;

        // Only clear user on explicit sign-out
        if (event === "SIGNED_OUT") {
          setUser(null);
          return;
        }

        // For TOKEN_REFRESHED and SIGNED_IN, update profile but don't
        // clear user on transient errors (network timeout, etc.)
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user);
            if (profile && isMounted) setUser(profile);
            // If profile fetch fails, keep existing user state
          } catch {
            // Silently ignore — keep current user rather than logging out
          }
        }
      }
    );

    // --- Session keepalive ---
    // Supabase access tokens expire after ~1 hour by default.
    // Proactively refresh every 4 minutes so they never go stale,
    // even if the user leaves the tab open without navigating.
    const KEEPALIVE_MS = 4 * 60 * 1000;
    const keepalive = setInterval(() => {
      if (!isMounted) return;
      supabase.auth.getUser().catch(() => {});
    }, KEEPALIVE_MS);

    // When the tab becomes visible again after being idle, immediately
    // refresh the session and re-sync profile data.
    function handleVisibilityChange() {
      if (document.visibilityState !== "visible" || !isMounted) return;
      supabase.auth.getUser().then(({ data: { user: authUser } }) => {
        if (!isMounted) return;
        if (authUser) {
          fetchProfile(authUser).then((profile) => {
            if (profile && isMounted) setUser(profile);
          }).catch(() => { /* keep existing user */ });
        } else {
          // Session truly expired — clear user
          setUser(null);
        }
      }).catch(() => { /* network hiccup — keep existing user */ });
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(timeout);
      clearInterval(keepalive);
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // 15s timeout so the UI never hangs indefinitely
      const authPromise = supabase.auth.signInWithPassword({ email, password });
      const result = await Promise.race([
        authPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 15000)
        ),
      ]);
      const { data, error } = result;
      if (error) {
        const msg = error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 일치하지 않습니다."
          : error.message;
        return { success: false, error: msg };
      }
      // Eagerly fetch profile so user state is set immediately
      if (data.user) {
        try {
          const profile = await fetchProfile(data.user);
          if (profile) setUser(profile);
        } catch { /* onAuthStateChange will retry */ }
      }
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error && err.message === "LOGIN_TIMEOUT"
        ? "서버 응답이 없습니다. 잠시 후 다시 시도해주세요."
        : "로그인 중 오류가 발생했습니다.";
      return { success: false, error: msg };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (password.length < 6) {
      return { success: false, error: "비밀번호는 6자 이상이어야 합니다." };
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        return { success: false, error: "이미 등록된 이메일입니다." };
      }
      return { success: false, error: error.message };
    }
    return { success: true };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    // Clear all caches so next login gets fresh data
    invalidateCacheByPrefix("home");
    invalidateCache("problems");
    invalidateCache("solvedCounts");
  };

  const updateProfile = async (updates: Partial<Pick<User, "name" | "bio">>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (!error) {
      // Sync name change across all existing comments
      if (updates.name && updates.name !== user.name) {
        // Use allSettled so one failure doesn't block others
        await Promise.allSettled([
          supabase.from("discussions").update({ author_name: updates.name }).eq("author_id", user.id),
          supabase.from("topic_comments").update({ author_name: updates.name }).eq("author_id", user.id),
          supabase.from("topics").update({ author_name: updates.name }).eq("author_id", user.id),
        ]);
      }
      setUser({ ...user, ...updates });
    }
  };

  const toggleSolved = async (problemId: string) => {
    if (!user) return;
    const isSolved = user.solvedProblems.includes(problemId);

    if (isSolved) {
      const { error } = await supabase
        .from("user_solved_problems")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId);
      if (!error) {
        setUser({
          ...user,
          solvedProblems: user.solvedProblems.filter((id) => id !== problemId),
        });
        invalidateCache("solvedCounts");
        invalidateCache("homeStats");
      }
    } else {
      const { error } = await supabase
        .from("user_solved_problems")
        .insert({ user_id: user.id, problem_id: problemId });
      if (!error) {
        setUser({
          ...user,
          solvedProblems: [...user.solvedProblems, problemId],
        });
        invalidateCache("solvedCounts");
        invalidateCache("homeStats");
      }
    }
  };

  const toggleBookmark = async (problemId: string) => {
    if (!user) return;
    const isBookmarked = user.bookmarkedProblems.includes(problemId);

    if (isBookmarked) {
      const { error } = await supabase
        .from("user_bookmarked_problems")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId);
      if (!error) {
        setUser({
          ...user,
          bookmarkedProblems: user.bookmarkedProblems.filter((id) => id !== problemId),
        });
      }
    } else {
      const { error } = await supabase
        .from("user_bookmarked_problems")
        .insert({ user_id: user.id, problem_id: problemId });
      if (!error) {
        setUser({
          ...user,
          bookmarkedProblems: [...user.bookmarkedProblems, problemId],
        });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, toggleSolved, toggleBookmark }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
