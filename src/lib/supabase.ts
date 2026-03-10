import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Wraps a Supabase query with a timeout that actually aborts the underlying fetch.
 * Unlike Promise.race, this cancels the HTTP request on timeout via AbortController.
 * Accepts an optional external AbortSignal for useEffect cleanup.
 */
export async function withTimeout<T>(
  query: PromiseLike<T>,
  ms = 5000,
  signal?: AbortSignal
): Promise<T> {
  const controller = new AbortController();

  if (signal) {
    if (signal.aborted) {
      controller.abort();
      throw new Error("요청이 취소되었습니다.");
    }
    signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  // Attach AbortSignal to Supabase query builder to cancel the actual HTTP request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const q = query as any;
  if (typeof q.abortSignal === "function") {
    query = q.abortSignal(controller.signal);
  }

  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      controller.abort();
      reject(new Error("요청 시간이 초과되었습니다."));
    }, ms);

    Promise.resolve(query).then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error) => { clearTimeout(timer); reject(error); }
    );
  });
}
