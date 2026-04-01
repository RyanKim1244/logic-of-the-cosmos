"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import LatexRenderer from "@/components/LatexRenderer";

interface Message {
  role: "user" | "ai";
  content: string;
}

interface AttachedFile {
  name: string;
  type: string;
  base64: string;
}

interface ProblemAIProps {
  problemTitle: string;
  problemSource: string;
  problemTags?: string[];
  problemContent?: string;
}

export default function ProblemAI({
  problemTitle,
  problemSource,
  problemTags = [],
  problemContent = "",
}: ProblemAIProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "ai",
        content: "안녕하세요! LoTC 문제 튜터입니다. 문제의 파일을 첨부하면 내용을 읽고 답변할 수 있습니다.",
      }]);
    }
  }, [open, messages.length, problemSource]);

  useEffect(() => {
    if (messages.length > 1 || loading) {
      const container = chatContainerRef.current;
      if (container) {
        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
      }
    }
  }, [messages, loading]);

  const handleFile = useCallback((file: File) => {
    const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError("PDF 또는 이미지 파일만 첨부할 수 있습니다.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("파일 크기는 20MB 이하만 가능합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setAttachedFile({ name: file.name, type: file.type, base64 });
      setError(null);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const currentFile = attachedFile;
    const displayText = currentFile ? `${text}\n\n📎 ${currentFile.name}` : text;
    const userMessage: Message = { role: "user", content: displayText };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setAttachedFile(null);
    setLoading(true);
    setError(null);

    const history = nextMessages.slice(1, -1);

    try {
      const res = await fetch("/api/problem-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          problemTitle,
          problemSource,
          problemTags,
          problemContent,
          history,
          file: currentFile ? { base64: currentFile.base64, mimeType: currentFile.type } : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "서버 오류");
      }

      setMessages((prev) => [...prev, { role: "ai", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setAttachedFile(null);
    setError(null);
  };

  return (
    <div className="border border-neutral-200 rounded-xl mb-6">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 sm:px-8 py-6 hover:bg-neutral-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-black flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-black">AI 학습 도우미</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">이 문제에 특화된 AI에게 질문하세요</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest hidden sm:block">
            {open ? "닫기" : "열기"}
          </span>
          <svg
            className={`w-4 h-4 text-neutral-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[1000px]" : "max-h-0"}`}>
        <div className="border-t border-neutral-200">

          {/* Chat messages */}
          <div
            ref={chatContainerRef}
            className={`h-80 overflow-y-auto px-6 sm:px-10 py-6 space-y-5 transition-colors ${dragOver ? "bg-blue-50/50 ring-2 ring-inset ring-blue-200" : "bg-neutral-50/50"}`}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
          >
            {dragOver && (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm text-blue-400 font-medium">여기에 파일을 놓으세요</p>
              </div>
            )}

            {!dragOver && messages.map((msg, i) => {
              const isStreamingThis = loading && i === messages.length - 1 && msg.role === "ai";
              return (
                <div
                  key={i}
                  className={`flex items-end gap-2.5 animate-fade-slide-up ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "ai" && (
                    <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shrink-0 mb-0.5">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] px-4 py-3 text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-black text-white rounded-2xl rounded-br-sm"
                        : "bg-white border border-neutral-200 text-neutral-800 rounded-2xl rounded-bl-sm"
                    }`}
                  >
                    {msg.role === "ai" ? (
                      isStreamingThis ? (
                        <StreamingText content={msg.content} />
                      ) : (
                        <div className="ai-bubble">
                          <LatexRenderer content={msg.content} />
                        </div>
                      )
                    ) : (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    )}
                  </div>
                </div>
              );
            })}

            {!dragOver && loading && messages[messages.length - 1]?.role !== "ai" && (
              <div className="flex items-end gap-2.5 justify-start animate-fade-slide-up">
                <div className="w-6 h-6 bg-black rounded-full flex items-center justify-center shrink-0 mb-0.5">
                  <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div className="bg-white border border-neutral-200 px-4 py-3 rounded-2xl rounded-bl-sm">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-neutral-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            {!dragOver && error && (
              <div className="flex justify-start animate-fade-slide-up">
                <div className="bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 max-w-[82%] rounded-xl">
                  {error}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="px-6 sm:px-10 py-6 border-t border-neutral-200 bg-white">
            {/* Attached file preview */}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-3 px-3 py-2 bg-neutral-100 rounded-lg text-xs text-neutral-600">
                <svg className="w-4 h-4 text-neutral-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span className="truncate flex-1">{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="text-neutral-400 hover:text-neutral-700 transition-colors shrink-0"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            <div className="flex gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-12 self-stretch flex items-center justify-center text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors rounded-lg shrink-0"
                title="파일 첨부 (PDF, 이미지)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </button>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="이 문제에 대해 질문하세요... (Enter로 전송)"
                rows={4}
                className="flex-1 min-h-[100px] px-4 py-3 border border-neutral-200 text-sm resize-none focus:border-black focus:outline-none bg-neutral-50 focus:bg-white placeholder:text-neutral-400 leading-relaxed"
                disabled={loading}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="self-stretch w-14 bg-black text-white hover:bg-neutral-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed shrink-0 flex items-center justify-center"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between mt-2.5">
              <p className="text-[10px] text-neutral-300">Shift+Enter로 줄바꿈 · 드래그앤드롭으로 파일 첨부</p>
              {messages.length > 1 && (
                <button onClick={clearChat} className="text-[10px] text-neutral-300 hover:text-neutral-600 transition-colors">
                  대화 초기화
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 스트리밍 중 간단한 마크다운 렌더러 (LaTeX 처리 없이 빠르게)
function StreamingText({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**")
          ? <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
          : <span key={i}>{part}</span>
      )}
      <span className="inline-block w-0.5 h-3 bg-neutral-400 ml-0.5 animate-pulse align-middle" />
    </span>
  );
}
