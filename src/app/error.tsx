"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
      <h1 className="text-6xl font-extralight text-black mb-4">오류</h1>
      <p className="text-neutral-500 text-sm mb-2">
        페이지를 불러오는 중 문제가 발생했습니다.
      </p>
      {error.digest && (
        <p className="text-neutral-400 text-xs mb-6 font-mono">
          코드: {error.digest}
        </p>
      )}
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-black text-white text-xs font-medium tracking-widest uppercase hover:bg-neutral-800 transition-colors"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="px-6 py-2.5 border border-neutral-300 text-neutral-700 text-xs font-medium tracking-widest uppercase hover:border-black hover:text-black transition-colors"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
