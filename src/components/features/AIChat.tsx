"use client";

import { useState, useRef, useEffect } from "react";
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
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.text },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "❌ Xatolik yuz berdi. Iltimos, qayta urinib ko'ring yoki API keyni tekshiring.",
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "🌐 Internetga ulanib bo'lmadi. Iltimos, ulanishingizni tekshiring.",
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Chat tozalandi! 🧹 Yangi savol bering.",
      },
    ]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  };

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

        {/* Loading indicator */}
        {loading && (
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
                  style={{
                    background: "#4285f4",
                    animationDelay: "0ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "#34a853",
                    animationDelay: "150ms",
                  }}
                />
                <span
                  className="w-2 h-2 rounded-full animate-bounce"
                  style={{
                    background: "#fbbc04",
                    animationDelay: "300ms",
                  }}
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
            placeholder="Savolingizni yozing..."
            rows={1}
            disabled={loading}
            className="flex-1 bg-transparent text-white text-sm px-2 py-1.5 outline-none resize-none placeholder:text-gray-600 max-h-[120px]"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="p-2 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:scale-105 active:scale-95 flex-shrink-0"
            style={{
              background: input.trim() ? t.accent : t.accent + "33",
              color: input.trim() ? "#000" : t.accent,
            }}
          >
            <FiSend size={16} />
          </button>
        </div>
        <p className="text-[9px] text-gray-600 text-center mt-1.5">
          Powered by Google Gemini AI · Enter yuborish
        </p>
      </div>
    </div>
  );
}
