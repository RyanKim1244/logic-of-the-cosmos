import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Logic of The Cosmos - 과학 올림피아드 문제 플랫폼",
  description:
    "다양한 과학 올림피아드 문제와 풀이를 제공하는 학습 플랫폼. IPhO, IChO, IBO, KPhO, KMO 기출문제와 대학 기출문제를 수록합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <Script id="mathjax-config" strategy="beforeInteractive">{`
          window.MathJax = {
            tex: {
              inlineMath: [['$', '$']],
              displayMath: [['$$', '$$']],
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
          strategy="beforeInteractive"
        />
      </head>
      <body className="bg-white text-neutral-900 min-h-screen">
        <Navbar />
        <main>{children}</main>
        <footer className="bg-black text-neutral-500 py-10 mt-20 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-light tracking-wide">
              &copy; 2024 Logic of The Cosmos
            </p>
            <p className="text-xs mt-2 text-neutral-600">
              과학 올림피아드 문제 학습 플랫폼
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
