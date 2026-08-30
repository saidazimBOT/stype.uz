"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { FiCpu, FiSend, FiTrash2, FiArrowLeft } from "react-icons/fi";
import type { ThemeColors } from "../../types";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIChatProps {
  t: ThemeColors;
  onClose: () => void;
}

export default function AIChat({ t, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Salom! 👋 Men STypeUz AI yordamchisiman. Menga har qanday savol bering — men sizga yordam beraman! Qaysi tilda yozsangiz, o'sha tilda javob beraman.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [displayText, setDisplayText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const charIndexRef = useRef(0);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming, displayText]);

  // Typing effect: reveal characters one by one from streamText
  useEffect(() => {
    if (!streaming || !streamText) return;

    const interval = setInterval(() => {
      charIndexRef.current += 1;
      const idx = charIndexRef.current;

      if (idx >= streamText.length) {
        clearInterval(interval);
        return;
      }

      // Reveal characters in chunks for speed (2-4 chars at a time)
      const chunkSize = streamText[idx] === " " ? 3 : 2;
      setDisplayText(streamText.slice(0, Math.min(idx + chunkSize, streamText.length)));
    }, 18);

    return () => clearInterval(interval);
  }, [streaming, streamText]);

  // When streaming ends, finalize the message
  useEffect(() => {
    if (!streaming && streamText && charIndexRef.current >= streamText.length) {
      setMessages((prev) => [...prev, { role: "assistant", content: streamText }]);
      setStreamText("");
      setDisplayText("");
      charIndexRef.current = 0;
      setTimeout(() => {
        setStreaming(false);
        inputRef.current?.focus();
      }, 100);
    }
  }, [streaming, streamText]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);
    setStreamText("");
    setDisplayText("");
    charIndexRef.current = 0;

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    try {
      abortRef.current = new AbortController();
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki API keyni tekshiring.",
          },
        ]);
        setStreaming(false);
        return;
      }

      // Read SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = "";
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamText(fullText);
              }
            } catch {
              // skip invalid JSON
            }
          }
        }
      }

      // Streaming complete
      if (fullText) {
        // Trigger finalization
        charIndexRef.current = fullText.length;
        setDisplayText(fullText);
      }
      setStreaming(false);
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "🌐 Internetga ulanib bo'lmadi. Iltimos, ulanishingizni tekshiring.",
          },
        ]);
      }
      setStreaming(false);
    }
  }, [input, streaming, messages]);

  const stopStreaming = () => {
    abortRef.current?.abort();
    if (streamText) {
      setMessages((prev) => [...prev, { role: "assistant", content: streamText }]);
      setStreamText("");
      setDisplayText("");
      charIndexRef.current = 0;
    }
    setStreaming(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([
      {
        role: "assistant",
        content: "Chat tozalandi! 🧹 Yangi savol bering.",
      },
    ]);
    setStreamText("");
    setDisplayText("");
    setStreaming(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (streaming) {
        stopStreaming();
      } else {
        sendMessage();
      }
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // Blinking cursor component
  const Cursor = () => (
    <span className="inline-block w-[2px] h-[14px] ml-[1px] animate-pulse" style={{ background: "#4285f4", verticalAlign: "text-bottom" }} />
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 border-b flex-shrink-0"
        style={{ borderColor: t.accent + "22" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all md:hidden"
          >
            <FiArrowLeft size={18} />
          </button>
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #4285f4, #34a853)",
              boxShadow: "0 0 20px #4285f433",
            }}
          >
            <FiCpu size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-1.5">
              AI Chat
              <span
                className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                style={{ background: "#34a85333", color: "#34a853" }}
              >
                GEMINI
              </span>
            </h2>
            <p className="text-[10px] text-gray-500">Haqiqiy AI robot</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={clearChat}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-red-400 transition-all"
            title="Chatni tozalash"
          >
            <FiTrash2 size={15} />
          </button>
          <button
            onClick={onClose}
            className="hidden md:flex px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white/5 text-gray-400 transition-all"
          >
            ← Orqaga
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user" ? "rounded-br-md" : "rounded-bl-md"
              }`}
              style={{
                background:
                  msg.role === "user" ? t.accent + "22" : t.surface || "#1a1a2e",
                color: msg.role === "user" ? "#e5e7eb" : "#d1d5db",
                border:
                  msg.role === "user"
                    ? `1px solid ${t.accent}44`
                    : "1px solid #ffffff0a",
              }}
            >
              {msg.role === "assistant" && (
                <div className="flex items-center gap-1.5 mb-1.5">
                  <FiCpu size={12} style={{ color: "#4285f4" }} />
                  <span
                    className="text-[10px] font-bold"
                    style={{ color: "#4285f4" }}
                  >
                    Gemini AI
                  </span>
                </div>
              )}
              <div className="whitespace-pre-wrap break-words">
                {msg.content}
              </div>
            </div>
          </div>
        ))}

        {/* Streaming message — types out character by character */}
        {streaming && streamText && (
          <div className="flex justify-start">
            <div
              className="max-w-[80%] sm:max-w-[70%] px-4 py-2.5 rounded-2xl rounded-bl-md text-sm leading-relaxed"
              style={{
                background: t.surface || "#1a1a2e",
                color: "#d1d5db",
                border: "1px solid #ffffff0a",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <FiCpu size={12} style={{ color: "#4285f4" }} />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "#4285f4" }}
                >
                  Gemini AI
                </span>
              </div>
              <div className="whitespace-pre-wrap break-words">
                {displayText}
                {displayText.length < streamText.length && <Cursor />}
              </div>
            </div>
          </div>
        )}

        {/* Loading dots before first token arrives */}
        {streaming && !streamText && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl rounded-bl-md text-sm"
              style={{
                background: t.surface || "#1a1a2e",
                border: "1px solid #ffffff0a",
              }}
            >
              <div className="flex items-center gap-1.5">
                <FiCpu size={12} style={{ color: "#4285f4" }} />
                <span
                  className="text-[10px] font-bold"
                  style={{ color: "#4285f4" }}
                >
                  Gemini AI
                </span>
              </div>
              <div className="flex gap-1.5 mt-1.5">
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#4285f4", animationDelay: "0ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#34a853", animationDelay: "150ms" }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{ background: "#fbbc04", animationDelay: "300ms" }}
                />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div
        className="px-4 sm:px-6 py-3 border-t flex-shrink-0"
        style={{ borderColor: t.accent + "15" }}
      >
        <div
          className="flex items-end gap-2 p-2 rounded-xl"
          style={{
            background: t.surface || "#1a1a2e",
            border: `1px solid ${input ? t.accent + "44" : "#ffffff0a"}`,
            transition: "border-color 0.2s",
          }}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder={streaming ? "Javob kutilmoqda..." : "Savolingizni yozing..."}
            rows={1}
            disabled={streaming}
            className="flex-1 bg-transparent text-white text-sm px-2 py-1.5 outline-none resize-none placeholder:text-gray-600 max-h-[120px]"
          />
          {streaming ? (
            <button
              onClick={stopStreaming}
              className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: "#ef4444", color: "#fff" }}
              title="Javobni to'xtatish"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="3" width="10" height="10" rx="1" />
              </svg>
            </button>
          ) : (
            <button
              onClick={sendMessage}
              disabled={!input.trim()}
              className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0"
              style={{
                background: input.trim() ? t.accent : t.accent + "33",
                color: input.trim() ? "#000" : t.accent,
              }}
            >
              <FiSend size={16} />
            </button>
          )}
        </div>
        <p className="text-[9px] text-gray-600 text-center mt-1.5">
          {streaming
            ? "Yozilmoqda... To'xtatish uchun ⏹ bosing"
            : "Powered by Google Gemini AI · Enter yuborish"}
        </p>
      </div>
    </div>
  );
}
