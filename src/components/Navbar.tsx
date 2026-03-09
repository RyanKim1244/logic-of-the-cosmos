import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-black text-white sticky top-0 z-50 border-b border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
            <span className="text-xl font-light tracking-[0.2em] uppercase">LoTC</span>
            <span className="hidden sm:inline text-sm text-neutral-400 font-light">Logic of The Cosmos</span>
          </Link>

          <div className="flex items-center space-x-8">
            <Link
              href="/problems"
              className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide"
            >
              문제 목록
            </Link>
            <Link
              href="/admin"
              className="text-neutral-400 hover:text-white transition-colors text-sm font-medium tracking-wide"
            >
              관리자
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
