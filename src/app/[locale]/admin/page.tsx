import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import AdminContent from "@/components/AdminContent";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function AdminPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AdminContent />;
}
