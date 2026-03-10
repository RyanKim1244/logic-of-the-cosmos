import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Wraps a Supabase query with a timeout and optional external AbortSignal.
 * On timeout or abort, the promise rejects immediately so callers can clean up.
 * Callers should check signal.aborted before updating state.
 */
export async function withTimeout<T>(
  query: PromiseLike<T>,
  ms = 10000,
  signal?: AbortSignal
): Promise<T> {
  if (signal?.aborted) {
    throw new Error("요청이 취소되었습니다.");
  }

  return new Promise<T>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error("요청 시간이 초과되었습니다."));
      }
    }, ms);

    // If external signal aborts (e.g. useEffect cleanup), reject immediately
    const onAbort = () => {
      if (!settled) {
        settled = true;
        clearTimeout(timer);
        reject(new Error("요청이 취소되었습니다."));
      }
    };
    signal?.addEventListener("abort", onAbort, { once: true });

    Promise.resolve(query).then(
      (value) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener("abort", onAbort);
          resolve(value);
        }
      },
      (error) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          signal?.removeEventListener("abort", onAbort);
          reject(error);
        }
      }
    );
  });
}
