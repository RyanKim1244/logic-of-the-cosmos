"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  bio: string;
  solvedProblems: string[];
  bookmarkedProblems: string[];
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => { success: boolean; error?: string };
  register: (email: string, password: string, name: string) => { success: boolean; error?: string };
  logout: () => void;
  updateProfile: (updates: Partial<Pick<User, "name" | "bio">>) => void;
  toggleSolved: (problemId: string) => void;
  toggleBookmark: (problemId: string) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "lotc_users";
const SESSION_KEY = "lotc_session";

function getUsers(): Record<string, { user: User; password: string }> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveUsers(users: Record<string, { user: User; password: string }>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const sessionEmail = localStorage.getItem(SESSION_KEY);
    if (sessionEmail) {
      const users = getUsers();
      if (users[sessionEmail]) {
        setUser(users[sessionEmail].user);
      }
    }
  }, []);

  const login = (email: string, password: string) => {
    const users = getUsers();
    const entry = users[email];
    if (!entry) return { success: false, error: "등록되지 않은 이메일입니다." };
    if (entry.password !== password) return { success: false, error: "비밀번호가 일치하지 않습니다." };
    setUser(entry.user);
    localStorage.setItem(SESSION_KEY, email);
    return { success: true };
  };

  const register = (email: string, password: string, name: string) => {
    const users = getUsers();
    if (users[email]) return { success: false, error: "이미 등록된 이메일입니다." };
    if (password.length < 6) return { success: false, error: "비밀번호는 6자 이상이어야 합니다." };

    const newUser: User = {
      id: crypto.randomUUID(),
      email,
      name,
      createdAt: new Date().toISOString(),
      bio: "",
      solvedProblems: [],
      bookmarkedProblems: [],
    };

    users[email] = { user: newUser, password };
    saveUsers(users);
    setUser(newUser);
    localStorage.setItem(SESSION_KEY, email);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateProfile = (updates: Partial<Pick<User, "name" | "bio">>) => {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated);

    const users = getUsers();
    if (users[user.email]) {
      users[user.email].user = updated;
      saveUsers(users);
    }
  };

  const toggleSolved = (problemId: string) => {
    if (!user) return;
    const solved = user.solvedProblems.includes(problemId)
      ? user.solvedProblems.filter((id) => id !== problemId)
      : [...user.solvedProblems, problemId];
    const updated = { ...user, solvedProblems: solved };
    setUser(updated);

    const users = getUsers();
    if (users[user.email]) {
      users[user.email].user = updated;
      saveUsers(users);
    }
  };

  const toggleBookmark = (problemId: string) => {
    if (!user) return;
    const bookmarked = user.bookmarkedProblems.includes(problemId)
      ? user.bookmarkedProblems.filter((id) => id !== problemId)
      : [...user.bookmarkedProblems, problemId];
    const updated = { ...user, bookmarkedProblems: bookmarked };
    setUser(updated);

    const users = getUsers();
    if (users[user.email]) {
      users[user.email].user = updated;
      saveUsers(users);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile, toggleSolved, toggleBookmark }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
