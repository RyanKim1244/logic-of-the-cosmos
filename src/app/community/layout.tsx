import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "커뮤니티",
  description: "과학 문제에 대한 자유 토론과 질문을 통해 다른 학습자들과 소통하세요.",
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
