import { createServerSupabase } from "@/lib/supabase-server";
import CommunityContent from "@/components/CommunityContent";

export default async function CommunityPage() {
  const supabase = createServerSupabase();

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("created_at", { ascending: false });

  const safeTopics = topics ?? [];

  // Fetch comment counts for all topics
  const commentCounts: Record<string, number> = {};
  if (safeTopics.length > 0) {
    const topicIds = safeTopics.map((t) => t.id);
    const { data: comments } = await supabase
      .from("topic_comments")
      .select("topic_id")
      .in("topic_id", topicIds);
    if (comments) {
      for (const c of comments) {
        commentCounts[c.topic_id] = (commentCounts[c.topic_id] || 0) + 1;
      }
    }
  }

  return (
    <CommunityContent
      initialTopics={safeTopics}
      initialCommentCounts={commentCounts}
    />
  );
}
