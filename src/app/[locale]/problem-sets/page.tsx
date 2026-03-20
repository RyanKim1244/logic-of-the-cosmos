import { setRequestLocale } from "next-intl/server";
import ProblemSetsContent from "@/components/ProblemSetsContent";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문제 세트",
  description: "나만의 문제 세트를 만들고 모의시험을 치르세요.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function ProblemSetsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <ProblemSetsContent />;
}
