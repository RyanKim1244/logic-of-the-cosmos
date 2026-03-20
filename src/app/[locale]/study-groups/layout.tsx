import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스터디 그룹",
  description: "스터디 그룹을 만들거나 참여해서 함께 학습하세요.",
};

export default function StudyGroupsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
