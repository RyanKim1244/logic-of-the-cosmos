import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-extralight text-black mb-4">404</h1>
      <p className="text-neutral-500 text-sm mb-8">요청하신 페이지를 찾을 수 없습니다.</p>
      <Link
        href="/"
        className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
