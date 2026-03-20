"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";
import LocaleSwitcher from "@/components/LocaleSwitcher";

const SearchModal = dynamic(() => import("@/components/SearchModal"), {
  ssr: false,
});

export default function Navbar() {
  const { user, loading } = useAuth();
  const t = useTranslations();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Close menu on route change (link click)
  const closeMenu = () => setMenuOpen(false);

  const navLinks = (
    <>
      <Link href="/problems" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
        {t("nav.problems")}
      </Link>
      <Link href="/contests" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
        {t("nav.contests")}
      </Link>
      <Link href="/community" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
        {t("nav.community")}
      </Link>
      <Link href="/problem-sets" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
        {t("nav.problemSets")}
      </Link>
      <Link href="/study-groups" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
        {t("nav.studyGroups")}
      </Link>
      {user?.is_admin && (
        <Link href="/admin" onClick={closeMenu} className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
          {t("nav.admin")}
        </Link>
      )}
    </>
  );

  return (
    <>
      <nav aria-label={t("nav.mainNav")} className="bg-black text-white sticky top-0 z-50 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center space-x-2.5 hover:opacity-80 transition-opacity">
              <Logo size={28} />
              <span className="text-xl font-light tracking-[0.2em]">LoT<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-500 bg-clip-text text-transparent">C</span></span>
              <span className="hidden sm:inline text-sm text-neutral-400 font-light">Logic of The Cosmos</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center space-x-8">
              <button
                onClick={() => setSearchOpen(true)}
                className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="text-xs border border-neutral-700 px-1.5 py-0.5 rounded text-neutral-500">⌘K</span>
              </button>
              {navLinks}
              <LocaleSwitcher />
              {loading ? (
                <span className="w-7 h-7 bg-neutral-800 animate-pulse rounded" />
              ) : user ? (
                <Link href="/profile" className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide">
                  <span className="w-7 h-7 bg-white text-black flex items-center justify-center text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline">{user.name}</span>
                </Link>
              ) : (
                <Link href="/login" className="px-4 py-1.5 border border-neutral-700 text-neutral-300 hover:border-white hover:text-white transition-colors text-sm tracking-wide">
                  {t("nav.signIn")}
                </Link>
              )}
            </div>

            {/* Mobile buttons */}
            <div className="flex items-center gap-3 md:hidden">
              <LocaleSwitcher />
              <button
                onClick={() => setSearchOpen(true)}
                className="text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label={t("nav.openMenu")}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-800 px-4 py-4 flex flex-col space-y-4 animate-slide-down">
            {navLinks}
            <div className="pt-3 border-t border-neutral-800">
              {loading ? (
                <span className="w-7 h-7 bg-neutral-800 animate-pulse rounded block" />
              ) : user ? (
                <Link href="/profile" onClick={closeMenu} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm font-medium">
                  <span className="w-7 h-7 bg-white text-black flex items-center justify-center text-xs font-medium">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name}
                </Link>
              ) : (
                <Link href="/login" onClick={closeMenu} className="block px-4 py-1.5 border border-neutral-700 text-neutral-300 hover:border-white hover:text-white transition-colors text-sm tracking-wide text-center">
                  {t("nav.signIn")}
                </Link>
              )}
            </div>
          </div>
        )}
      </nav>

      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
