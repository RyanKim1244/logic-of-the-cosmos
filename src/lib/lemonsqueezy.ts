import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js";

export function initLemonSqueezy() {
  lemonSqueezySetup({
    apiKey: process.env.LEMONSQUEEZY_API_KEY!,
    onError: (error) => console.error("LemonSqueezy error:", error),
  });
}

export const STORE_ID = process.env.LEMONSQUEEZY_STORE_ID!;
export const VARIANT_ID = process.env.LEMONSQUEEZY_PLUS_VARIANT_ID!;
