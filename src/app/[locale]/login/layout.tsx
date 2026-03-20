import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "로그인",
  description: "Logic of The Cosmos에 로그인하여 문제 풀이와 토론에 참여하세요.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
