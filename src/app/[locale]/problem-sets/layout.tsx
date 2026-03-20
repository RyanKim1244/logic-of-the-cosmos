import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "문제 세트",
  description: "나만의 문제 세트를 만들고 모의시험을 치르세요.",
};

export default function ProblemSetsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
