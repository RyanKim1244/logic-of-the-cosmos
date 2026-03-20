import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import TopicDetailContent from "@/components/TopicDetailContent";

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const supabase = createServerSupabase();

  const [topicRes, commentsRes] = await Promise.allSettled([
    supabase.from("topics").select("*").eq("id", id).single(),
    supabase.from("topic_comments").select("*").eq("topic_id", id).order("created_at", { ascending: true }),
  ]);

  const topic =
    topicRes.status === "fulfilled" && topicRes.value.data
      ? topicRes.value.data
      : null;

  if (!topic) {
    notFound();
  }

  const comments =
    commentsRes.status === "fulfilled" && commentsRes.value.data
      ? commentsRes.value.data
      : [];

  return (
    <TopicDetailContent
      initialTopic={topic}
      initialComments={comments}
    />
  );
}
