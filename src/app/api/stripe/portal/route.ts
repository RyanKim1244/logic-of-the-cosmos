import { NextRequest } from "next/server";
import { getCustomer } from "@lemonsqueezy/lemonsqueezy.js";
import { initLemonSqueezy } from "@/lib/lemonsqueezy";
import { createServiceSupabase } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "로그인이 필요합니다." }), { status: 401 });
    }

    initLemonSqueezy();
    const supabase = createServiceSupabase();

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", userId)
      .single();

    if (!profile?.stripe_customer_id) {
      return new Response(JSON.stringify({ error: "구독 정보를 찾을 수 없습니다." }), { status: 404 });
    }

    // Fetch customer to get the portal URL
    const { data, error } = await getCustomer(profile.stripe_customer_id);

    if (error) {
      return new Response(JSON.stringify({ error: "고객 정보를 가져올 수 없습니다." }), { status: 500 });
    }

    const portalUrl = data?.data?.attributes?.urls?.customer_portal;

    if (!portalUrl) {
      return new Response(JSON.stringify({ error: "포탈 URL을 가져올 수 없습니다." }), { status: 500 });
    }

    return new Response(JSON.stringify({ url: portalUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Portal error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "오류" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
