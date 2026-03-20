import { Link } from '@/i18n/navigation';
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("common");

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-extralight text-black mb-4">404</h1>
      <p className="text-neutral-500 text-sm mb-8">{t("notFoundDescription")}</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
      >
        {t("goHome")}
      </Link>
    </div>
  );
}
