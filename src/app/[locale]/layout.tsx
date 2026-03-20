import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import ErrorBoundary from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";
import { routing } from "@/i18n/routing";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: {
      default: t("title"),
      template: "%s | Logic of The Cosmos",
    },
    description: t("description"),
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      siteName: "Logic of The Cosmos",
      title: t("title"),
      description: t("description"),
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
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as never)) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();
  const t = await getTranslations({ locale, namespace: "meta" });

  return (
    <html lang={locale}>
      <head>
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
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
        <NextIntlClientProvider messages={messages}>
        <Navbar />
        <ErrorBoundary>
        <main>{children}</main>
        </ErrorBoundary>
        <footer className="bg-black text-neutral-500 py-10 mt-20 border-t border-neutral-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-sm font-light tracking-wide">
              {t("footer")}
            </p>
            <p className="text-xs mt-2 text-neutral-600">
              {t("footerSub")}
            </p>
          </div>
        </footer>
        </NextIntlClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
