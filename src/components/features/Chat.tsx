"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { FiMessageCircle, FiSend } from "react-icons/fi";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "./HeroAvatar";
import type { ThemeColors, ChatUser, ChatMessage } from "../../types";

const CHAT_USERS: ChatUser[] = [
  { name: "SpeedKing_99", color: "#a78bfa", avatar: "SK" },
  { name: "NightTyper", color: "#22c55e", avatar: "NT" },
  { name: "UzbekEagle", color: "#ec4899", avatar: "UE" },
];

const GREETINGS = [
  "Hey everyone!",
  "gg!",
  "nice typing!",
  "let's race!",
  "anyone up for a challenge?",
];

interface ChatProps {
  t: ThemeColors;
  onClose: () => void;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
}

export default function Chat({ t, onClose, activeAvatar = "avatar_default", heroEquip }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      user: CHAT_USERS[0],
      text: "Welcome to the chat!",
      time: new Date().toLocaleTimeString(),
    },
    {
      id: 2,
      user: CHAT_USERS[1],
      text: "Hey! Ready for some typing?",
      time: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState<{ name: string; color: string } | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate bot messages
  useEffect(() => {
    const interval = setInterval(() => {
      const randomUser = CHAT_USERS[Math.floor(Math.random() * CHAT_USERS.length)];
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          user: randomUser,
          text: randomGreeting,
          time: new Date().toLocaleTimeString(),
        },
      ]);
    }, 30000 + Math.random() * 30000);
    return () => clearInterval(interval);
  }, []);

  // Typing indicator
  useEffect(() => {
    if (input) {
      setTyping({ name: "You", color: t.accent });
      const timeout = setTimeout(() => setTyping(null), 2000);
      return () => clearTimeout(timeout);
    } else {
      setTyping(null);
    }
  }, [input, t.accent]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const av = getAvatarInfo(activeAvatar);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        user: { name: "You", color: av.color, avatar: "YO" },
        text: input.trim(),
        time: new Date().toLocaleTimeString(),
      },
    ]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex-1 px-8 py-8 max-w-2xl mx-auto w-full overflow-hidden flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiMessageCircle />
            Chat
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{CHAT_USERS.length + 1} online</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto rounded-xl p-4 mb-4"
        style={{ background: t.surface, border: `1px solid ${t.accent}11` }}
      >
        {messages.map((msg) => {
          const isMe = msg.user.name === "You";
          const av = isMe ? getAvatarInfo(activeAvatar) : null;
          return (
          <div key={msg.id} className="flex items-start gap-2.5 mb-3 animate-pop-in">
            {isMe && av ? (
              <div className="w-7 h-7 flex-shrink-0 mt-0.5">
                <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={28} />
              </div>
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                style={{ background: msg.user.color + "33", color: msg.user.color }}
              >
                {msg.user.avatar}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-medium" style={{ color: msg.user.color }}>
                  {msg.user.name}
                </span>
                <span className="text-[10px] text-gray-600">{msg.time}</span>
              </div>
              <div className="text-sm text-gray-300 break-words">{msg.text}</div>
            </div>
          </div>
          );
        })}
        {typing && (
          <div className="text-xs text-gray-500 italic animate-pulse">
            {typing.name} is typing...
          </div>
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none"
          style={{
            background: t.surface,
            border: `1px solid ${input ? t.accent + "44" : "transparent"}`,
            color: "#fff",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 flex items-center gap-1.5"
          style={{ background: t.accent, color: "#000" }}
        >
          <FiSend size={14} />
          Send
        </button>
      </div>
    </div>
  );
}
