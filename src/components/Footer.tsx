"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-black text-neutral-500 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-px bg-gradient-to-r from-transparent via-neutral-700 to-transparent" />

        <div className="py-16 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-4">
            <div className="mb-5">
              <span className="text-white text-lg font-extralight tracking-[0.3em]">
                LoT<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">C</span>
              </span>
              <p className="text-[11px] text-neutral-500 tracking-widest uppercase mt-1">Logic of The Cosmos</p>
            </div>
            <p className="text-sm text-neutral-400 leading-relaxed mb-6 max-w-xs">
              {t.footer.brand}
            </p>
            <div className="flex items-center gap-2">
              <span className="status-dot status-dot-green" />
              <span className="text-[11px] text-neutral-500">{t.nav.serviceRunning}</span>
            </div>
          </div>

          <div className="hidden md:block md:col-span-1" />

          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.25em] mb-5">{t.footer.explore}</p>
            <ul className="space-y-3.5">
              {[
                { href: "/problems", label: t.common.problems },
                { href: "/contests", label: t.common.contests },
                { href: "/problem-sets", label: t.common.problemSets },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <p className="text-xs font-semibold text-neutral-300 uppercase tracking-[0.25em] mb-5">{t.footer.communitySection}</p>
            <ul className="space-y-3.5">
              {[
                { href: "/community", label: t.common.community },
                { href: "/study-groups", label: t.common.studyGroups },
                { href: "/pricing", label: "Plus" },
                { href: "/profile", label: t.common.profile },
              ].map((l) => (
                <li key={l.href}>
                  <a href={l.href} className="text-sm text-neutral-400 hover:text-white transition-colors">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-neutral-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-neutral-500 tracking-wide">
            &copy; 2026 <span className="text-neutral-400">Logic of The Cosmos</span>. {t.footer.allRights}
          </p>
          <div className="flex items-center gap-5 text-xs text-neutral-500">
            <a href="/terms" className="hover:text-white transition-colors">{t.common.terms}</a>
            <span className="text-neutral-700">/</span>
            <a href="/privacy" className="hover:text-white transition-colors">{t.common.privacy}</a>
            <span className="text-neutral-700">/</span>
            <a href="/community" className="hover:text-white transition-colors">{t.common.community}</a>
            <span className="text-neutral-700">/</span>
            <a href="/login" className="hover:text-white transition-colors">{t.common.login}</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
