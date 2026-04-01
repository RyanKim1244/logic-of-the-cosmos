import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: NextRequest) {
  try {
    const { message, problemTitle, problemSource, problemTags, problemContent, history, file } = await req.json();

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: "메시지가 없습니다." }), { status: 400 });
    }

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
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt,
    });

    const chatHistory = (history ?? []).map((msg: { role: string; content: string }) => ({
      role: msg.role === "ai" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: chatHistory });

    // Build message parts: text + optional file
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

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } finally {
          controller.close();
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
