import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";
import { createServiceSupabase } from "@/lib/supabase-server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const ALLOWED_MODELS: Record<string, string> = {
  flash: "gemini-3-flash-preview",
  pro: "gemini-3.1-pro-preview",
};

const FLASH_LIMITS: Record<string, number> = {
  free: 50_000,
  plus: 1_000_000,
};
const PRO_LIMITS: Record<string, number> = {
  free: 0,
  plus: 150_000,
};
const DAILY_LIMITS: Record<string, number> = {
  free: 3,
  plus: 999999,
};

export async function POST(req: NextRequest) {
  try {
    const { message, problemTitle, problemSource, problemTags, problemContent, history, file, model: requestedModel, userId } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "메시지가 없습니다." }), { status: 400 });
    }

    const supabase = createServiceSupabase();

    // Get user subscription tier and check token usage
    let tier = "free";
    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("subscription_tier, subscription_expires_at")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        const isExpired = profile.subscription_expires_at && new Date(profile.subscription_expires_at) < new Date();
        tier = (!isExpired && profile.subscription_tier === "plus") ? "plus" : "free";
      }

      // Check daily request limit
      const { data: dailyCount } = await supabase.rpc("get_daily_request_count", { p_user_id: userId });
      const dailyLimit = DAILY_LIMITS[tier];

      if ((dailyCount ?? 0) >= dailyLimit) {
        return new Response(
          JSON.stringify({
            error: "DAILY_LIMIT_REACHED",
            used: dailyCount,
            limit: dailyLimit,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }

      // Determine model first
      const wantsPro = requestedModel === "pro" && tier === "plus";

      // Check weekly token usage
      const { data: usage } = await supabase.rpc("get_weekly_token_usage", { p_user_id: userId });
      const flashUsed = usage?.[0]?.flash_tokens_used ?? 0;
      const proUsed = usage?.[0]?.pro_tokens_used ?? 0;

      const flashLimit = FLASH_LIMITS[tier];
      const proLimit = PRO_LIMITS[tier];

      if (wantsPro && proUsed >= proLimit) {
        return new Response(
          JSON.stringify({ error: "PRO_LIMIT_REACHED", tokensUsed: proUsed, limit: proLimit }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!wantsPro && flashUsed >= flashLimit) {
        return new Response(
          JSON.stringify({
            error: tier === "free" ? "FREE_LIMIT_REACHED" : "FLASH_LIMIT_REACHED",
            tokensUsed: flashUsed, limit: flashLimit,
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    const modelKey = (requestedModel === "pro" && tier === "plus") ? "pro" : "flash";
    const modelId = ALLOWED_MODELS[modelKey];

    const systemPrompt = `당신은 과학 올림피아드 전문 AI 튜터입니다.
학생이 아래 문제를 풀고 있으며, 이 문제에 대해 자유롭게 질문합니다.

[문제 정보]
- 제목: ${problemTitle}
- 출처: ${problemSource}
- 태그: ${(problemTags ?? []).join(", ") || "없음"}
${problemContent ? `\n[문제 내용]\n${problemContent}` : ""}

[답변 지침]
- 문제 내용을 충분히 이해하고 답변하세요.
- 첨부된 파일이 있으면 그 내용을 꼼꼼히 읽고 답변에 반영하세요.
- 학생이 직접 풀 수 있도록 유도하되, 명시적으로 답을 요청하면 풀이를 제공하세요.
- LaTeX 수식은 인라인은 $...$, 블록은 $$...$$ 형식으로 작성하세요.
- 불필요한 서론 없이 바로 본론으로 시작하세요.
- 한국어로 답변하세요.`;

    const model = genAI.getGenerativeModel({
      model: modelId,
      systemInstruction: systemPrompt,
    });

    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory });

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
      { text: message },
    ];

    if (file?.base64 && file?.mimeType) {
      parts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.base64,
        },
      });
    }

    const result = await chat.sendMessageStream(parts);

    let totalTokens = 0;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));

            // Capture token usage from the last chunk
            const usage = chunk.usageMetadata;
            if (usage) {
              totalTokens = (usage.promptTokenCount ?? 0) + (usage.candidatesTokenCount ?? 0);
            }
          }
        } finally {
          controller.close();

          // Record token + daily usage after stream completes
          if (userId && totalTokens > 0) {
            Promise.all([
              supabase.rpc("increment_token_usage", {
                p_user_id: userId,
                p_tokens: totalTokens,
                p_model: modelKey,
              }),
              supabase.rpc("increment_daily_request_count", {
                p_user_id: userId,
              }),
            ]).catch(() => {});
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("problem-ai error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
