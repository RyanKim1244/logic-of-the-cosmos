import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import TopicDetailContent from "@/components/TopicDetailContent";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("topics")
    .select("title, author_name")
    .eq("id", id)
    .single();

  if (!data) return { title: "글을 찾을 수 없습니다" };

  return {
    title: data.title,
    description: `${data.author_name}님의 글 — ${data.title}`,
    openGraph: { title: data.title },
  };
}

export default async function TopicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
