import ProblemSetDetailContent from "@/components/ProblemSetDetailContent";

export default async function ProblemSetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProblemSetDetailContent setId={id} />;
}
