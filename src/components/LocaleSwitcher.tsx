"use client";

import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { useTransition } from "react";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const toggle = () => {
    const next = locale === "ko" ? "en" : "ko";
    startTransition(() => {
      router.replace(pathname, { locale: next });
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className="flex items-center gap-1 px-2 py-1 border border-neutral-700 text-neutral-400 hover:text-white hover:border-white transition-colors text-xs tracking-wider disabled:opacity-50"
      aria-label="Toggle language"
    >
      <span className={locale === "en" ? "text-white font-medium" : ""}>EN</span>
      <span className="text-neutral-600">/</span>
      <span className={locale === "ko" ? "text-white font-medium" : ""}>KO</span>
    </button>
  );
}
