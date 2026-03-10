import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase-server";
import PublicProfileContent from "@/components/PublicProfileContent";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServerSupabase();

  const [profileRes, statsRes] = await Promise.allSettled([
    supabase.from("profiles").select("id, name, bio, created_at").eq("id", id).single(),
    supabase.from("user_stats").select("solved_count, solution_count, discussion_count").eq("user_id", id).single(),
  ]);

  const profile =
    profileRes.status === "fulfilled" && profileRes.value.data
      ? profileRes.value.data
      : null;

  if (!profile) {
    notFound();
  }

  const statsData =
    statsRes.status === "fulfilled" && statsRes.value.data
      ? statsRes.value.data
      : null;

  return (
    <PublicProfileContent
      profile={profile}
      solvedCount={statsData?.solved_count ?? 0}
      solutionCount={statsData?.solution_count ?? 0}
      discussionCount={statsData?.discussion_count ?? 0}
    />
  );
}
