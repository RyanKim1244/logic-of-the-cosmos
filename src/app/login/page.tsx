"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!name.trim()) {
        setError("이름을 입력해주세요.");
        return;
      }
      const result = register(email, password, name);
      if (result.success) {
        router.push("/profile");
      } else {
        setError(result.error || "회원가입에 실패했습니다.");
      }
    } else {
      const result = login(email, password);
      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "로그인에 실패했습니다.");
      }
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-2xl font-light tracking-[0.2em] uppercase text-black">
            LoTC
          </Link>
          <p className="text-neutral-400 text-sm mt-2">Logic of The Cosmos</p>
        </div>

        <div className="border border-neutral-200 p-8">
          <h1 className="text-xl font-light mb-8 text-center tracking-wide">
            {isRegister ? "회원가입" : "로그인"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-5">
            {isRegister && (
              <div>
                <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm"
                  placeholder="이름을 입력하세요"
                />
              </div>
            )}

            <div>
              <label className="block text-xs text-neutral-500 uppercase tracking-widest mb-2">
                이메일
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
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-neutral-200 focus:border-black focus:outline-none transition-colors text-sm"
                placeholder="6자 이상 입력하세요"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-black text-white text-sm font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
            >
              {isRegister ? "가입하기" : "로그인"}
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
              {isRegister ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
