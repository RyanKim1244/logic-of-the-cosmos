import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder";

/**
 * Singleton browser Supabase client (cookie-based auth).
 *
 * Auth tokens are stored in cookies instead of localStorage so the
 * server (middleware + server components) can read them and maintain
 * the user's authenticated session server-side.
 *
 * The Web Locks hang issue that previously blocked this approach
 * was fixed in supabase-js >=2.86.0 (PR #2106).
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

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

/**
 * Retries a function up to `retries` times with exponential backoff.
 * Respects an optional AbortSignal to bail out early.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelay = 1000,
  signal?: AbortSignal
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (signal?.aborted) throw new Error("요청이 취소되었습니다.");
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }
  throw lastError;
}
