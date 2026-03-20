import { setRequestLocale } from "next-intl/server";
import StudyGroupsContent from "@/components/StudyGroupsContent";
import { routing } from "@/i18n/routing";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스터디 그룹",
  description: "함께 학습하고 문제를 풀어보세요. 스터디 그룹을 만들거나 참여하세요.",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function StudyGroupsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <StudyGroupsContent />;
}
