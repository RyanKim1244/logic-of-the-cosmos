import StudyGroupsContent from "@/components/StudyGroupsContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "스터디 그룹",
  description: "함께 학습하고 문제를 풀어보세요. 스터디 그룹을 만들거나 참여하세요.",
};

export default function StudyGroupsPage() {
  return <StudyGroupsContent />;
}
