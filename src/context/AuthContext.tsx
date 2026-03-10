"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
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
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .single();

  if (!profile) return null;

  const { data: solved } = await supabase
    .from("user_solved_problems")
    .select("problem_id")
    .eq("user_id", authUser.id);

  const { data: bookmarked } = await supabase
    .from("user_bookmarked_problems")
    .select("problem_id")
    .eq("user_id", authUser.id);

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

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    }, 3000);

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      try {
        if (session?.user) {
          const profile = await fetchProfile(session.user);
          setUser(profile);
        }
      } catch {
        setUser(null);
      } finally {
        if (!resolved) {
          resolved = true;
          setLoading(false);
        }
      }
    }).catch(() => {
      if (!resolved) {
        resolved = true;
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            const profile = await fetchProfile(session.user);
            setUser(profile);
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        }
      }
    );

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const msg = error.message === "Invalid login credentials"
        ? "이메일 또는 비밀번호가 일치하지 않습니다."
        : error.message;
      return { success: false, error: msg };
    }
    return { success: true };
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
  };

  const updateProfile = async (updates: Partial<Pick<User, "name" | "bio">>) => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);
    if (!error) {
      setUser({ ...user, ...updates });
    }
  };

  const toggleSolved = async (problemId: string) => {
    if (!user) return;
    const isSolved = user.solvedProblems.includes(problemId);

    if (isSolved) {
      await supabase
        .from("user_solved_problems")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId);
      setUser({
        ...user,
        solvedProblems: user.solvedProblems.filter((id) => id !== problemId),
      });
    } else {
      await supabase
        .from("user_solved_problems")
        .insert({ user_id: user.id, problem_id: problemId });
      setUser({
        ...user,
        solvedProblems: [...user.solvedProblems, problemId],
      });
    }
  };

  const toggleBookmark = async (problemId: string) => {
    if (!user) return;
    const isBookmarked = user.bookmarkedProblems.includes(problemId);

    if (isBookmarked) {
      await supabase
        .from("user_bookmarked_problems")
        .delete()
        .eq("user_id", user.id)
        .eq("problem_id", problemId);
      setUser({
        ...user,
        bookmarkedProblems: user.bookmarkedProblems.filter((id) => id !== problemId),
      });
    } else {
      await supabase
        .from("user_bookmarked_problems")
        .insert({ user_id: user.id, problem_id: problemId });
      setUser({
        ...user,
        bookmarkedProblems: [...user.bookmarkedProblems, problemId],
      });
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
