import { NextRequest } from "next/server";
import { createCheckout } from "@lemonsqueezy/lemonsqueezy.js";
import { initLemonSqueezy, STORE_ID, VARIANT_ID } from "@/lib/lemonsqueezy";
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
      .select("email, name")
      .eq("id", userId)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "프로필을 찾을 수 없습니다." }), { status: 404 });
    }

    const origin = req.headers.get("origin") || "";

    const { data, error } = await createCheckout(STORE_ID, VARIANT_ID, {
      checkoutData: {
        email: profile.email,
        name: profile.name,
        custom: {
          supabase_user_id: userId,
        },
      },
      productOptions: {
        redirectUrl: `${origin}/profile?upgraded=true`,
      },
    });

    if (error) {
      console.error("LemonSqueezy checkout error:", error);
      return new Response(JSON.stringify({ error: "결제 페이지를 생성할 수 없습니다." }), { status: 500 });
    }

    const checkoutUrl = data?.data?.attributes?.url;

    return new Response(JSON.stringify({ url: checkoutUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "결제 오류" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
