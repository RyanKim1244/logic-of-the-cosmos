import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "기출문제 아카이브",
  description: "국제 올림피아드부터 대학 기출까지, 연도별로 정리된 과학 기출문제를 풀어보세요.",
};

export default async function ContestsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return children;
}
