"use client";

import { useState } from "react";
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

export default function LoginForm() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, register } = useAuth();
  const router = useRouter();
  const t = useTranslations("auth");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      if (isRegister) {
        if (!name.trim()) {
          setError(t("nameRequired"));
          setSubmitting(false);
          return;
        }
        const result = await register(email, password, name);
        if (result.success) {
          router.push("/profile");
        } else {
          setError(result.error || t("registerFailed"));
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          router.push("/");
        } else {
          setError(result.error || t("loginFailed"));
        }
      }
    } finally {
      setSubmitting(false);
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

        <div className="border border-neutral-200 p-8">
          <h1 className="text-xl font-light mb-8 text-center tracking-wide">
            {isRegister ? t("signUp") : t("signIn")}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                  {t("name")}
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm"
                  placeholder={t("namePlaceholder")}
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                {t("password")}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm"
                placeholder={t("passwordPlaceholder")}
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-black text-white text-sm font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors disabled:opacity-50"
            >
              {submitting ? t("submitting") : isRegister ? t("signUp") : t("signIn")}
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
                ? `${t("hasAccount")} ${t("signIn")}`
                : `${t("noAccount")} ${t("signUp")}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
