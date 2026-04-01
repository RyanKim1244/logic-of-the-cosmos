import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Logic of The Cosmos - 과학 올림피아드 문제 플랫폼",
    template: "%s | Logic of The Cosmos",
  },
  description:
    "다양한 과학 올림피아드 문제와 풀이를 제공하는 학습 플랫폼. IPhO, IChO, IBO, KPhO, KMO 기출문제와 대학 기출문제를 수록합니다.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Logic of The Cosmos",
    title: "Logic of The Cosmos - 과학 올림피아드 문제 플랫폼",
    description: "IPhO, IChO, IBO, KPhO, KMO 기출문제와 풀이를 제공하는 과학 학습 플랫폼",
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap" rel="stylesheet" />
        <Script id="mathjax-config" strategy="afterInteractive">{`
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$']],
              displayMath: [['$$', '$$']],
              packages: {'[+]': ['ams', 'newcommand', 'configmacros', 'boldsymbol']},
              tags: 'ams',
              macros: {
                RR: '\\\\mathbb{R}',
                NN: '\\\\mathbb{N}',
                ZZ: '\\\\mathbb{Z}',
                CC: '\\\\mathbb{C}',
                QQ: '\\\\mathbb{Q}',
                dd: ['\\\\mathrm{d}#1', 1],
                dv: ['\\\\frac{\\\\mathrm{d}#1}{\\\\mathrm{d}#2}', 2],
                pdv: ['\\\\frac{\\\\partial #1}{\\\\partial #2}', 2],
                bra: ['\\\\langle #1 |', 1],
                ket: ['| #1 \\\\rangle', 1],
                braket: ['\\\\langle #1 | #2 \\\\rangle', 2],
              },
            },
            svg: {
              fontCache: 'global'
            },
            startup: {
              ready: () => {
                MathJax.startup.defaultReady();
              }
            }
          };
        `}</Script>
        <Script
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-svg.js"
          strategy="lazyOnload"
        />
      </head>
      <body className="bg-white text-neutral-900 min-h-screen">
        <AuthProvider>
        <Navbar />
        <ErrorBoundary>
        <main>{children}</main>
        </ErrorBoundary>
        <footer className="bg-black text-neutral-500 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Top accent line */}
            <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

            {/* Main content */}
            <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12">

              {/* Brand column */}
              <div className="md:col-span-4">
                <div className="mb-5">
                  <span className="text-white text-lg font-extralight tracking-[0.3em]">
                    LoT<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">C</span>
                  </span>
                  <p className="text-[11px] text-neutral-500 tracking-widest uppercase mt-1">Logic of The Cosmos</p>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed mb-6 max-w-xs">
                  과학의 모든 영역을 탐구하는 거대한 토론의 장. 올림피아드부터 연구 수준까지, 경계 없는 탐구를 지향합니다.
                </p>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-dot-green" />
                  <span className="text-[11px] text-neutral-500">서비스 운영 중</span>
                </div>
              </div>

              {/* Spacer */}
              <div className="hidden md:block md:col-span-1" />

              {/* Navigation columns */}
              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.25em] mb-5">탐색</p>
                <ul className="space-y-3.5">
                  {[
                    { href: "/problems", label: "문제 목록" },
                    { href: "/contests", label: "기출문제" },
                    { href: "/problem-sets", label: "문제 세트" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.25em] mb-5">커뮤니티</p>
                <ul className="space-y-3.5">
                  {[
                    { href: "/community", label: "토론" },
                    { href: "/study-groups", label: "스터디 그룹" },
                    { href: "/profile", label: "내 프로필" },
                  ].map((l) => (
                    <li key={l.href}>
                      <a href={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Bottom bar */}
            <div className="border-t border-neutral-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-neutral-500 tracking-wide">
                &copy; 2026 <span className="text-neutral-400">Logic of The Cosmos</span>. All rights reserved.
              </p>
              <div className="flex items-center gap-5 text-xs text-neutral-500">
                <a href="/terms" className="hover:text-white transition-colors">이용약관</a>
                <span className="text-neutral-700">/</span>
                <a href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</a>
                <span className="text-neutral-700">/</span>
                <a href="/community" className="hover:text-white transition-colors">커뮤니티</a>
                <span className="text-neutral-700">/</span>
                <a href="/login" className="hover:text-white transition-colors">로그인</a>
              </div>
            </div>
          </div>
        </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
