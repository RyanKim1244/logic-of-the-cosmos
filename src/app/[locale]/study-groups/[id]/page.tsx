import StudyGroupDetailContent from "@/components/StudyGroupDetailContent";

export default async function StudyGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudyGroupDetailContent groupId={id} />;
}
