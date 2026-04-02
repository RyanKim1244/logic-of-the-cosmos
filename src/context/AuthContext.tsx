"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
  subscriptionTier: "free" | "plus";
  subscriptionExpiresAt: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  loginWithOAuth: (provider: "google" | "github") => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<Pick<User, "name" | "bio">>) => Promise<void>;
  toggleSolved: (problemId: string) => Promise<void>;
  toggleBookmark: (problemId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PROFILE_TIMEOUT = 10000; // 10s hard ceiling
const PROFILE_CACHE_KEY = "lotc_profile_cache";

function saveProfileToCache(profile: User) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch { /* quota exceeded or private browsing — ignore */ }
}

function loadProfileFromCache(): User | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

function clearProfileCache() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch { /* ignore */ }
}

async function fetchProfile(authUser: SupabaseUser): Promise<User | null> {
  // Race against a timeout so the caller never hangs forever
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("PROFILE_TIMEOUT")), PROFILE_TIMEOUT)
  );

  return Promise.race([fetchProfileInner(authUser), timeout]);
}

async function fetchProfileInner(authUser: SupabaseUser): Promise<User | null> {
  // Run all three queries in parallel to eliminate the sequential waterfall
  const [profileResult, solvedResult, bookmarkedResult] = await Promise.allSettled([
    supabase.from("profiles").select("id, email, name, created_at, bio, is_admin, subscription_tier, subscription_expires_at").eq("id", authUser.id).single(),
    supabase.from("user_solved_problems").select("problem_id").eq("user_id", authUser.id),
    supabase.from("user_bookmarked_problems").select("problem_id").eq("user_id", authUser.id),
  ]);

  // Profile is critical — if it fails, return null
  if (profileResult.status !== "fulfilled" || !profileResult.value.data) return null;
  const profile = profileResult.value.data;

  const solved = solvedResult.status === "fulfilled" ? solvedResult.value.data : null;
  const bookmarked = bookmarkedResult.status === "fulfilled" ? bookmarkedResult.value.data : null;

  const isExpired = profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date();

  return {
    id: profile.id,
    email: profile.email,
    name: profile.name,
    createdAt: profile.created_at,
    bio: profile.bio || "",
    is_admin: profile.is_admin,
    solvedProblems: solved?.map((s) => s.problem_id) || [],
    bookmarkedProblems: bookmarked?.map((b) => b.problem_id) || [],
    subscriptionTier: (!isExpired && profile.subscription_tier === "plus") ? "plus" : "free",
    subscriptionExpiresAt: profile.subscription_expires_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserRaw] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Always keep localStorage cache in sync with user state
  const setUser = (u: User | null) => {
    setUserRaw(u);
    if (u) {
      saveProfileToCache(u);
    } else {
      clearProfileCache();
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Step 1: Instantly restore cached profile from localStorage (zero network).
    // This eliminates the skeleton flash on page refresh.
    const cached = loadProfileFromCache();
    if (cached) {
      setUserRaw(cached);
      setLoading(false);
    }

    // Step 2: Listen for auth state changes (handles INITIAL_SESSION,
    // TOKEN_REFRESHED, SIGNED_IN, SIGNED_OUT).
    // This is the authoritative source — it fires after the SDK verifies
    // the session with the server and refreshes tokens if needed.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        // Only clear user on explicit sign-out
        if (event === "SIGNED_OUT") {
          setUser(null);
          setLoading(false);
          return;
        }

        // TOKEN_REFRESHED only means a new access token was issued — the
        // user profile hasn't changed, so skip the redundant fetchProfile.
        // This prevents duplicate network requests on every token refresh.
        if (event === "TOKEN_REFRESHED") return;

        // For INITIAL_SESSION and SIGNED_IN, fetch fresh profile.
        if (session?.user) {
          try {
            const profile = await fetchProfile(session.user);
            if (profile && isMounted) {
              setUser(profile);
            }
          } catch {
            // Keep existing user on transient errors
          }
        } else if (!cached) {
          // No session and no cache — not logged in
          setUser(null);
        }

        // Mark loading done after INITIAL_SESSION is processed
        if (isMounted) setLoading(false);

        // Note: createBrowserClient sets autoRefreshToken: true internally,
        // so there's no need to call startAutoRefresh() manually.
        // Doing so causes a Web Locks collision ("Lock broken by steal").
      }
    );

    // createBrowserClient already handles auto-refresh and visibility-based
    // token renewal internally. A custom visibilitychange handler that calls
    // getSession() races with the built-in auto-refresh for the same Web Lock,
    // causing "Lock broken by another request with the 'steal' option" errors.

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        const msg = error.message === "Invalid login credentials"
          ? "이메일 또는 비밀번호가 일치하지 않습니다."
          : error.message;
        return { success: false, error: msg };
      }
      if (data.user) {
        try {
          const profile = await fetchProfile(data.user);
          if (profile) setUser(profile);
        } catch { /* onAuthStateChange will retry */ }
      }
      return { success: true };
    } catch {
      return { success: false, error: "로그인 중 오류가 발생했습니다." };
    }
  };

  const register = async (email: string, password: string, name: string) => {
    if (password.length < 6) {
      return { success: false, error: "비밀번호는 6자 이상이어야 합니다." };
    }

    // Retry once for transient database errors (e.g. trigger timeouts)
    const MAX_ATTEMPTS = 2;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });

      if (!error) return { success: true };

      console.error(`[Register] signUp error (attempt ${attempt}/${MAX_ATTEMPTS}):`, error.message, error.status);

      if (error.message.includes("already registered")) {
        return { success: false, error: "이미 등록된 이메일입니다." };
      }
      if (error.message.includes("rate") || error.status === 429) {
        return { success: false, error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." };
      }

      // Retry transient database errors once
      if (error.message.toLowerCase().includes("database") && attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }

      if (error.message.toLowerCase().includes("database")) {
        return {
          success: false,
          error: "회원가입 중 데이터베이스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
        };
      }
      return { success: false, error: error.message };
    }
    return { success: false, error: "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요." };
  };

  const loginWithOAuth = async (provider: "google" | "github") => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });
  };

  const logout = async () => {
    // createBrowserClient manages auto-refresh internally.
    // signOut() cleans up the session and cookies automatically.
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
    <AuthContext.Provider value={{ user, loading, login, register, loginWithOAuth, logout, updateProfile, toggleSolved, toggleBookmark }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
