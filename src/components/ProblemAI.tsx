"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import LatexRenderer from "@/components/LatexRenderer";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";

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
  const { t, locale } = useLanguage();
  const { user } = useAuth();
  const isPlus = user?.subscriptionTier === "plus";
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedModel, setSelectedModel] = useState<"flash" | "pro">("flash");
  const [showProHint, setShowProHint] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{
        role: "ai",
        content: t.ai.greeting,
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
      setError(t.ai.fileError);
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError(t.ai.fileSizeError);
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
          model: selectedModel,
          userId: user?.id,
        }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "DAILY_LIMIT_REACHED") {
          throw new Error("DAILY_LIMIT");
        }
        if (data.error === "FREE_LIMIT_REACHED" || data.error === "PLUS_LIMIT_REACHED" || data.error === "FLASH_LIMIT_REACHED" || data.error === "PRO_LIMIT_REACHED") {
          throw new Error("TOKEN_LIMIT");
        }
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
      const msg = e instanceof Error ? e.message : "오류가 발생했습니다.";
      if (msg === "TOKEN_LIMIT" || msg === "DAILY_LIMIT") {
        setError(msg);
      } else {
        setError(msg);
      }
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
            <p className="text-sm font-medium text-black">{t.ai.title}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest hidden sm:block">
            {open ? t.common.close : t.common.open}
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
                <p className="text-sm text-blue-400 font-medium">{t.ai.dropHere}</p>
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
                {error === "DAILY_LIMIT" ? (
                  <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 max-w-[82%] rounded-xl">
                    <p className="font-medium mb-1">
                      {locale === "ko" ? "오늘의 무료 AI 사용 횟수(3회)를 모두 사용했습니다." : "You've used all 3 free AI requests for today."}
                    </p>
                    <Link href="/pricing" className="underline hover:text-amber-900 font-medium">
                      {locale === "ko" ? "Plus로 무제한 사용하기 →" : "Go unlimited with Plus →"}
                    </Link>
                  </div>
                ) : error === "TOKEN_LIMIT" ? (
                  <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-700 max-w-[82%] rounded-xl">
                    <p className="font-medium mb-1">
                      {locale === "ko" ? "주간 AI 토큰을 모두 사용했습니다." : "Weekly AI token limit reached."}
                    </p>
                    <Link href="/pricing" className="underline hover:text-amber-900 font-medium">
                      {isPlus
                        ? (locale === "ko" ? "다음 주에 초기화됩니다." : "Resets next week.")
                        : (locale === "ko" ? "Plus로 업그레이드하기" : "Upgrade to Plus")}
                    </Link>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-600 max-w-[82%] rounded-xl">
                    {error}
                  </div>
                )}
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
                title={t.ai.attachFile}
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
                placeholder={t.ai.placeholder}
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
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-neutral-100 rounded-full p-0.5">
                  <button
                    type="button"
                    onClick={() => setSelectedModel("flash")}
                    className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-all ${
                      selectedModel === "flash" ? "bg-black text-white" : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    Flash
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (isPlus) {
                        setSelectedModel("pro");
                        setShowProHint(false);
                      } else {
                        setShowProHint(true);
                      }
                    }}
                    className={`px-2.5 py-0.5 text-[10px] font-medium rounded-full transition-all flex items-center gap-1 ${
                      selectedModel === "pro" ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white" : "text-neutral-400 hover:text-neutral-600"
                    }`}
                  >
                    Pro
                    {!isPlus && (
                      <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    )}
                  </button>
                </div>
                {showProHint && !isPlus ? (
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/60 rounded-full text-[10px] text-blue-600 hover:from-blue-100 hover:to-purple-100 hover:border-blue-300 transition-all font-medium"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                    {locale === "ko" ? "Plus로 Pro 모델 사용하기" : "Unlock Pro with Plus"}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : (
                  <p className="text-[10px] text-neutral-300">{t.ai.shiftEnter}</p>
                )}
              </div>
              {messages.length > 1 && (
                <button onClick={clearChat} className="text-[10px] text-neutral-300 hover:text-neutral-600 transition-colors">
                  {t.ai.clearChat}
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
