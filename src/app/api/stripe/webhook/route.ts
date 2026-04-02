import { NextRequest } from "next/server";
import crypto from "crypto";
import { createServiceSupabase } from "@/lib/supabase-server";

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-signature") ?? "";

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET!;

  if (!verifySignature(body, signature, secret)) {
    console.error("Webhook signature verification failed");
    return new Response("Invalid signature", { status: 400 });
  }

  const event = JSON.parse(body);
  const eventName = event.meta?.event_name;
  const customData = event.meta?.custom_data;
  const userId = customData?.supabase_user_id;

  if (!userId) {
    console.error("No supabase_user_id in webhook");
    return new Response("ok", { status: 200 });
  }

  const supabase = createServiceSupabase();
  const attrs = event.data?.attributes;

  switch (eventName) {
    case "subscription_created":
    case "subscription_updated": {
      const status = attrs?.status; // active, past_due, cancelled, expired, etc.
      const renewsAt = attrs?.renews_at;
      const subscriptionId = String(event.data?.id);
      const customerId = String(attrs?.customer_id);

      if (status === "active" || status === "past_due") {
        await supabase.from("profiles").update({
          subscription_tier: "plus",
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: customerId,
          subscription_expires_at: renewsAt,
        }).eq("id", userId);
      } else if (status === "cancelled" || status === "expired" || status === "unpaid") {
        await supabase.from("profiles").update({
          subscription_tier: "free",
          subscription_expires_at: null,
        }).eq("id", userId);
      }
      break;
    }

    case "subscription_payment_success": {
      const renewsAt = attrs?.renews_at;
      if (renewsAt) {
        await supabase.from("profiles").update({
          subscription_tier: "plus",
          subscription_expires_at: renewsAt,
        }).eq("id", userId);
      }
      break;
    }

    case "subscription_expired": {
      await supabase.from("profiles").update({
        subscription_tier: "free",
        stripe_subscription_id: null,
        subscription_expires_at: null,
      }).eq("id", userId);
      break;
    }
  }

  return new Response("ok", { status: 200 });
}
