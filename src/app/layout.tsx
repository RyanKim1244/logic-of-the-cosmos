import type { Metadata } from "next";
import Script from "next/script";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { LanguageProvider } from "@/context/LanguageContext";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Logic of The Cosmos",
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
        <LanguageProvider>
        <Navbar />
        <ErrorBoundary>
        <main>{children}</main>
        </ErrorBoundary>
        <Footer />
        </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
