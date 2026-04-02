"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register, loginWithOAuth } = useAuth();
  const { t, locale } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError(locale === "ko" ? "이름을 입력해주세요." : "Please enter your name.");
          setSubmitting(false);
          return;
        }
        const result = await register(email, password, name);
        if (result.success) {
          router.push(redirectTo);
        } else {
          setError(result.error || (locale === "ko" ? "회원가입에 실패했습니다." : "Registration failed."));
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          router.push(redirectTo);
        } else {
          setError(result.error || (locale === "ko" ? "로그인에 실패했습니다." : "Login failed."));
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleOAuth = async (provider: "google" | "github") => {
    setError("");
    try {
      await loginWithOAuth(provider);
    } catch {
      setError(locale === "ko" ? "소셜 로그인에 실패했습니다." : "Social login failed.");
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex flex-col items-center gap-2">
            <Logo size={48} className="text-black" />
            <span className="text-2xl font-light tracking-[0.2em] text-black">LoT<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">C</span></span>
          </Link>
          <p className="text-neutral-400 text-sm mt-2">Logic of The Cosmos</p>
        </div>

        <div className="border border-neutral-200 rounded-xl p-8">
          <h1 className="text-xl font-light mb-8 text-center tracking-wide">
            {isRegister
              ? (locale === "ko" ? "회원가입" : "Sign Up")
              : t.common.login}
          </h1>

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <button
              onClick={() => handleOAuth("google")}
              className="w-full flex items-center justify-center gap-3 py-3 border border-neutral-200 rounded-lg hover:border-neutral-400 hover:bg-neutral-50 transition-all text-sm font-medium text-neutral-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {locale === "ko" ? "Google로 계속하기" : "Continue with Google"}
            </button>

          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1 h-px bg-neutral-200" />
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              {locale === "ko" ? "또는" : "or"}
            </span>
            <div className="flex-1 h-px bg-neutral-200" />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                  {locale === "ko" ? "이름" : "Name"}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                  placeholder={locale === "ko" ? "이름을 입력하세요" : "Enter your name"}
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                {locale === "ko" ? "이메일" : "Email"}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                {locale === "ko" ? "비밀번호" : "Password"}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors text-sm"
                placeholder={locale === "ko" ? "6자 이상 입력하세요" : "At least 6 characters"}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-black text-white text-sm font-medium tracking-widest uppercase rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {submitting
                ? (locale === "ko" ? "처리 중..." : "Processing...")
                : isRegister
                  ? (locale === "ko" ? "가입하기" : "Sign Up")
                  : t.common.login}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError("");
              }}
              className="text-sm text-neutral-400 hover:text-black transition-colors"
            >
              {isRegister
                ? (locale === "ko" ? "이미 계정이 있으신가요? 로그인" : "Already have an account? Login")
                : (locale === "ko" ? "계정이 없으신가요? 회원가입" : "Don't have an account? Sign Up")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
