import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-cosmos-950 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
            <span className="text-2xl">&#10038;</span>
            <span className="text-xl font-bold tracking-tight">Logic of The Cosmos</span>
          </Link>

          <div className="flex items-center space-x-6">
            <Link
              href="/problems"
              className="text-cosmos-200 hover:text-white transition-colors font-medium"
            >
              문제 목록
            </Link>
            <Link
              href="/admin"
              className="text-cosmos-200 hover:text-white transition-colors font-medium"
            >
              관리자
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
