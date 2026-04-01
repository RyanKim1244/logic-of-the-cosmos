"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Logo from "@/components/Logo";

const SearchModal = dynamic(() => import("@/components/SearchModal"), {
  ssr: false,
});

const links = [
  { href: "/problems", label: "문제 목록" },
  { href: "/contests", label: "기출문제" },
  { href: "/community", label: "커뮤니티" },
  { href: "/problem-sets", label: "문제 세트" },
  { href: "/study-groups", label: "스터디" },
];

export default function Navbar() {
  const { user, loading } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <>
      <nav
        aria-label="메인 내비게이션"
        className={`sticky top-0 z-50 transition-all duration-300 border-b ${
          scrolled
            ? "bg-black backdrop-blur-md border-neutral-800/60 shadow-[0_1px_0_rgba(255,255,255,0.04)]"
            : "bg-black border-neutral-800"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group shrink-0">
              <Logo size={24} className="text-white opacity-90 group-hover:opacity-60 transition-opacity" />
              <span className="text-[15px] font-light tracking-[0.22em] text-white">
                LoT<span className="bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 bg-clip-text text-transparent">C</span>
              </span>
              <span className="hidden lg:flex items-center gap-2.5 text-xs text-neutral-400 font-normal tracking-wide">
                <span className="w-px h-3.5 bg-neutral-700" />
                Logic of The Cosmos
              </span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center">
              {/* Search */}
              <button
                onClick={() => setSearchOpen(true)}
                className="text-neutral-500 hover:text-neutral-200 transition-colors p-2 hover:bg-white/5 rounded-sm mr-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>

              <div className="w-px h-4 bg-neutral-800 mx-1" />

              {/* Nav links */}
              <div className="flex items-center gap-1">
                {links.map((link) => {
                  const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`relative px-4 py-2 text-sm font-medium rounded-sm transition-colors ${
                        isActive
                          ? "text-white"
                          : "text-neutral-500 hover:text-neutral-200 hover:bg-white/5"
                      }`}
                    >
                      {link.label}
                      {isActive && (
                        <span className="absolute bottom-0 inset-x-4 h-px bg-white/80" />
                      )}
                    </Link>
                  );
                })}
                {user?.is_admin && (
                  <Link
                    href="/admin"
                    className="relative px-4 py-2 text-[13px] font-medium tracking-wide text-neutral-500 hover:text-neutral-200 hover:bg-white/5 rounded-sm transition-colors"
                  >
                    관리자
                  </Link>
                )}
              </div>

              <div className="w-px h-4 bg-neutral-800 mx-2" />

              {/* Auth */}
              {loading ? (
                <span className="w-7 h-7 skeleton rounded-sm" />
              ) : user ? (
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 text-neutral-400 hover:text-white transition-colors text-sm font-medium pl-1 group"
                >
                  <span className="w-7 h-7 bg-white text-black flex items-center justify-center text-[11px] font-semibold tracking-wide shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:inline text-[13px] text-neutral-400 group-hover:text-white transition-colors">
                    {user.name}
                  </span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-4 py-1.5 border border-neutral-700 text-neutral-400 hover:border-neutral-400 hover:text-white transition-all text-[13px] tracking-wide ml-1"
                >
                  로그인
                </Link>
              )}
            </div>

            {/* Mobile buttons */}
            <div className="flex items-center gap-1 md:hidden">
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="p-2 text-neutral-400 hover:text-white transition-colors"
                aria-label="메뉴"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {menuOpen
                    ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  }
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-neutral-800 bg-black animate-slide-down">
            <div className="px-3 py-2 flex flex-col">
              {links.map((link) => {
                const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={closeMenu}
                    className={`px-3 py-2.5 text-[13px] font-medium rounded-sm transition-colors ${
                      isActive
                        ? "text-white bg-white/8"
                        : "text-neutral-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {user?.is_admin && (
                <Link
                  href="/admin"
                  onClick={closeMenu}
                  className="px-3 py-2.5 text-[13px] font-medium text-neutral-400 hover:text-white hover:bg-white/5 rounded-sm transition-colors"
                >
                  관리자
                </Link>
              )}
            </div>
            <div className="px-4 pb-4 pt-2 border-t border-neutral-800">
              {loading ? (
                <span className="w-8 h-8 skeleton rounded-sm block" />
              ) : user ? (
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className="flex items-center gap-2.5 text-neutral-400 hover:text-white transition-colors text-sm font-medium"
                >
                  <span className="w-7 h-7 bg-white text-black flex items-center justify-center text-[11px] font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name}
                </Link>
              ) : (
                <Link
                  href="/login"
                  onClick={closeMenu}
                  className="block px-4 py-2 border border-neutral-700 text-neutral-300 hover:border-neutral-400 hover:text-white transition-all text-sm tracking-wide text-center"
                >
                  로그인
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
