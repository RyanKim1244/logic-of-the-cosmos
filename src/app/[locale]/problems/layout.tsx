import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문제 목록",
  description: "IPhO, KPhO, IChO, KMO, IBO 등 다양한 과학 올림피아드 문제를 태그와 출처로 검색하고 풀어보세요.",
};

export default function ProblemsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
