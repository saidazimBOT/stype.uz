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
        "Salom! 👋 Men STypeUz AI yordamchisiman. Menga har qanday savol bering — men sizga yordam beraman!",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  // Typing animation state
  const [typingText, setTypingText] = useState("");
  const [fullResponse, setFullResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, typingText]);

  // Client-side typing animation
  useEffect(() => {
    if (!fullResponse || !loading) return;

    if (typingText.length < fullResponse.length) {
      const timer = setTimeout(() => {
        // Reveal 1-3 chars at a time for natural feel
        const nextLen = Math.min(
          typingText.length + (fullResponse[typingText.length] === " " ? 2 : 1),
          fullResponse.length
        );
        setTypingText(fullResponse.slice(0, nextLen));
      }, 12); // ~80 chars per second
      return () => clearTimeout(timer);
    } else {
      // Animation done — finalize message
      setMessages((prev) => [...prev, { role: "assistant", content: fullResponse }]);
      setFullResponse("");
      setTypingText("");
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [typingText, fullResponse, loading]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setTypingText("");
    setFullResponse("");

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

      const data = await res.json();

      if (res.ok && data.text) {
        setFullResponse(data.text);
        // Typing animation will start via useEffect
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "❌ Xatolik yuz berdi. Qayta urinib ko'ring.",
          },
        ]);
        setLoading(false);
        setTimeout(() => inputRef.current?.focus(), 100);
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "🌐 Internetga ulanib bo'lmadi.",
          },
        ]);
      }
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, messages]);

  const stopAnimation = () => {
    abortRef.current?.abort();
    if (fullResponse) {
      setMessages((prev) => [...prev, { role: "assistant", content: fullResponse }]);
      setFullResponse("");
      setTypingText("");
    }
    setLoading(false);
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
    setFullResponse("");
    setTypingText("");
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (loading) {
        stopAnimation();
      } else {
        sendMessage();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

  // Blinking cursor
  const Cursor = () => (
    <span
      className="inline-block w-[2px] h-[14px] ml-[1px] animate-pulse"
      style={{ background: "#4285f4", verticalAlign: "text-bottom" }}
    />
  );

  const isAnimating = loading && fullResponse;

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
                  msg.role === "user"
                    ? t.accent + "22"
                    : t.surface || "#1a1a2e",
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

        {/* Typing animation — shows current message being typed */}
        {isAnimating && (
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
                {typingText}
                {typingText.length < fullResponse.length && <Cursor />}
              </div>
            </div>
          </div>
        )}

        {/* Loading dots — before API responds */}
        {loading && !fullResponse && (
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
            placeholder={
              loading
                ? "Javob kutilmoqda..."
                : "Savolingizni yozing..."
            }
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-white text-sm px-2 py-1.5 outline-none resize-none placeholder:text-gray-600 max-h-[120px]"
          />
          {loading ? (
            <button
              onClick={stopAnimation}
              className="p-2 rounded-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
              style={{ background: "#ef4444", color: "#fff" }}
              title="To'xtatish"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
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
          {loading
            ? "Yozilmoqda... To'xtatish uchun ⏹ bosing"
            : "Powered by Google Gemini AI · Enter yuborish"}
        </p>
      </div>
    </div>
  );
}
