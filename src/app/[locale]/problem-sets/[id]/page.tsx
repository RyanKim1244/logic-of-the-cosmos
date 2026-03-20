import { setRequestLocale } from "next-intl/server";
import ProblemSetDetailContent from "@/components/ProblemSetDetailContent";

export default async function ProblemSetDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return <ProblemSetDetailContent setId={id} />;
}
