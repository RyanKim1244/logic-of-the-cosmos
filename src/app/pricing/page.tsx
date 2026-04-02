"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";

export default function PricingPage() {
  const { user } = useAuth();
  const { locale } = useLanguage();

  const isPlus = user?.subscriptionTier === "plus";
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "오류가 발생했습니다.");
      }
    } catch {
      alert(locale === "ko" ? "결제 페이지를 열 수 없습니다." : "Could not open checkout.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: locale === "ko" ? "영구 무료" : "Free forever",
      features: locale === "ko"
        ? [
            "하루 AI 3회",
            "주간 Flash 토큰 50,000",
            "Flash 모델",
            "파일 첨부 (PDF/이미지)",
            "전체 문제 열람",
            "커뮤니티 참여",
          ]
        : [
            "3 AI requests per day",
            "50,000 weekly Flash tokens",
            "Flash model",
            "File attachments (PDF/Image)",
            "Full problem access",
            "Community access",
          ],
      current: !isPlus,
      cta: locale === "ko" ? "현재 플랜" : "Current Plan",
    },
    {
      name: "Plus",
      price: "$5.99",
      period: locale === "ko" ? "/ 월" : "/ month",
      features: locale === "ko"
        ? [
            "무제한 AI 사용",
            "주간 Flash 토큰 1,000,000 (20배)",
            "주간 Pro 토큰 150,000",
            "프로필 Plus Supporter 배지",
            "우선 지원",
            "향후 추가 기능 우선 제공",
          ]
        : [
            "Unlimited AI requests",
            "1,000,000 weekly Flash tokens (20x)",
            "150,000 weekly Pro tokens",
            "Plus Supporter profile badge",
            "Priority support",
            "Early access to new features",
          ],
      current: isPlus,
      cta: isPlus
        ? (locale === "ko" ? "현재 플랜" : "Current Plan")
        : (locale === "ko" ? "Plus 시작하기" : "Get Plus"),
      highlight: true,
    },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-light text-black mb-3">
          {locale === "ko" ? "플랜 선택" : "Choose Your Plan"}
        </h1>
        <p className="text-sm text-neutral-400">
          {locale === "ko"
            ? "AI 튜터를 더 많이 사용하고, 고급 모델로 학습하세요."
            : "Use the AI tutor more and learn with advanced models."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`border rounded-xl p-8 relative flex flex-col ${
              plan.highlight
                ? "border-black shadow-lg"
                : "border-neutral-200"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-black text-white text-[10px] font-semibold uppercase tracking-widest rounded-full">
                {locale === "ko" ? "추천" : "Recommended"}
              </div>
            )}

            <h2 className="text-xl font-medium mb-1">{plan.name}</h2>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-light">{plan.price}</span>
              <span className="text-sm text-neutral-400">{plan.period}</span>
            </div>

            <ul className="space-y-3 flex-1">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-neutral-600">
                  <svg className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <div className="w-full py-3 text-center text-sm font-medium text-neutral-400 bg-neutral-100 rounded-lg mt-8">
                {plan.cta}
              </div>
            ) : user ? (
              <button
                className="w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors mt-8 disabled:opacity-50"
                onClick={handleCheckout}
                disabled={checkoutLoading}
              >
                {checkoutLoading ? (locale === "ko" ? "이동 중..." : "Redirecting...") : plan.cta}
              </button>
            ) : (
              <Link
                href="/login?redirect=/pricing"
                className="block w-full py-3 bg-black text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors text-center mt-8"
              >
                {locale === "ko" ? "로그인 후 시작" : "Login to Start"}
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <p className="text-xs text-neutral-400">
          {locale === "ko"
            ? "토큰은 매주 월요일에 초기화됩니다. 언제든지 해지할 수 있습니다."
            : "Tokens reset every Monday. Cancel anytime."}
        </p>
      </div>
    </div>
  );
}
