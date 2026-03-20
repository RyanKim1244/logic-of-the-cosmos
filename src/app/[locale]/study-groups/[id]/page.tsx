import { setRequestLocale } from "next-intl/server";
import StudyGroupDetailContent from "@/components/StudyGroupDetailContent";

export default async function StudyGroupDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <StudyGroupDetailContent groupId={id} />;
}
