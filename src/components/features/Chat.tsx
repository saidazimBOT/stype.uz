"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { FiMessageCircle, FiSend, FiUsers } from "react-icons/fi";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "./HeroAvatar";
import type { ThemeColors } from "../../types";
import { getConvexClient } from "../../lib/battle";

const MAX_TEXT_LEN = 300;

interface ChatProps {
  t: ThemeColors;
  onClose: () => void;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
}

interface ChatMessageItem {
  _id: unknown;
  tokenIdentifier: string;
  username: string;
  avatar: string;
  text: string;
  createdAt: number;
}

export default function Chat({ t, onClose, activeAvatar = "avatar_default", heroEquip }: ChatProps) {
  const configured = useMemo(() => {
    const client = getConvexClient();
    if (!client) return false;
    // _generated/api.ts hali STUB bo'lsa (convex dev ishga tushmagan) crash qilmaymiz
    return typeof (api as any)?.chat?.listMessages === "function";
  }, []);
  if (!configured) {
    return <BackendMissing t={t} onClose={onClose} />;
  }
  return <ChatApp t={t} onClose={onClose} activeAvatar={activeAvatar} heroEquip={heroEquip} />;
}

// ── Backend sozlanmagan ───────────────────────────────────────────────
function BackendMissing({ t, onClose }: { t: ThemeColors; onClose: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <FiMessageCircle size={44} className="mx-auto mb-4" style={{ color: t.accent }} />
        <h2 className="text-xl font-bold text-white mb-2">Chat hozircha o'chirilgan</h2>
        <p className="text-sm text-gray-500 mb-6">
          Global chat uchun backend (Convex) ulanmagan. <code>.env.local</code> faylida{" "}
          <code className="text-xs" style={{ color: t.accent }}>NEXT_PUBLIC_CONVEX_URL</code> ni
          o'rnatib, saytni qayta ishga tushiring.
        </p>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>
    </div>
  );
}

// ── Real chat ─────────────────────────────────────────────────────────
function ChatApp({ t, onClose, activeAvatar = "avatar_default", heroEquip }: ChatProps) {
  const messages = useQuery(api.chat.listMessages, {});
  const online = useQuery(api.chat.onlineCount, {});
  const myToken = useQuery(api.users.myToken, {});
  const sendMsg = useMutation(api.chat.sendMessage);
  const { isAuthenticated, isLoading } = useConvexAuth();

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const list: ChatMessageItem[] = messages ?? [];

  // Yangi xabar kelganda pastga siljiymiz
  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [list.length]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !isAuthenticated) return;
    setSending(true);
    setNotice(null);
    try {
      await sendMsg({ text });
      setInput("");
      setTimeout(
        () => chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" }),
        100
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  };

  const canSend = isAuthenticated && !isLoading && !sending && input.trim().length > 0;

  return (
    <div className="flex-1 px-4 sm:px-8 py-4 sm:py-8 max-w-2xl mx-auto w-full overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiMessageCircle />
            Chat
          </h2>
          <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: "#22c55e", boxShadow: "0 0 6px #22c55e" }}
            />
            {online === undefined ? "…" : online} onlayn · hamma kirganlar gaplashadi
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Xatolik / bildirishnoma */}
      {notice && (
        <div
          className="mb-3 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between animate-pop-in"
          style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#fca5a5" }}
        >
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-3 text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Xabarlar */}
      <div
        className="flex-1 overflow-y-auto rounded-xl p-4 mb-4 min-h-0"
        style={{ background: t.surface, border: `1px solid ${t.accent}11` }}
      >
        {list.length === 0 && messages === undefined ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500 animate-pulse">
            Xabarlar yuklanmoqda...
          </div>
        ) : list.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <FiUsers size={30} className="mb-3 opacity-40" />
            <div className="text-sm">Hali xabarlar yo'q — birinchi bo'lib salom ayting! 👋</div>
          </div>
        ) : (
          list.map((msg) => {
            const isMe = myToken !== undefined && myToken !== null && msg.tokenIdentifier === myToken;
            const av = getAvatarInfo(isMe ? activeAvatar : msg.avatar);
            const AvIcon = av.icon;
            return (
              <div key={String(msg._id)} className={`flex items-start gap-2.5 mb-3 animate-pop-in ${isMe ? "flex-row-reverse" : ""}`}>
                {isMe ? (
                  <div className="w-7 h-7 flex-shrink-0 mt-0.5">
                    <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={28} />
                  </div>
                ) : (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ background: av.color + "33", color: av.color }}
                  >
                    <AvIcon size={13} />
                  </div>
                )}
                <div className={`flex-1 min-w-0 ${isMe ? "text-right" : ""}`}>
                  <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "justify-end" : ""}`}>
                    <span className="text-xs font-medium truncate max-w-[160px]" style={{ color: av.color }}>
                      {msg.username}
                      {isMe && <span className="ml-1 text-[10px] text-gray-500">(siz)</span>}
                    </span>
                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  <div
                    className={`text-sm break-words inline-block px-3 py-1.5 rounded-2xl ${
                      isMe ? "rounded-tr-sm" : "rounded-tl-sm"
                    }`}
                    style={
                      isMe
                        ? { background: t.accent + "22", color: "#fff", border: `1px solid ${t.accent}33` }
                        : { background: "#ffffff0d", color: "#d1d5db", border: "1px solid #ffffff14" }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEnd} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value.slice(0, MAX_TEXT_LEN))}
          onKeyDown={handleKeyDown}
          placeholder={
            isLoading
              ? "Ulanish..."
              : !isAuthenticated
              ? "Kirish amalga oshirilmoqda..."
              : "Xabar yozing..."
          }
          disabled={!isAuthenticated}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm outline-none disabled:opacity-50"
          style={{
            background: t.surface,
            border: `1px solid ${input ? t.accent + "44" : "transparent"}`,
            color: "#fff",
          }}
        />
        <button
          onClick={() => void sendMessage()}
          disabled={!canSend}
          className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all disabled:opacity-30 flex items-center gap-1.5"
          style={{ background: t.accent, color: "#000" }}
        >
          <FiSend size={14} />
          Send
        </button>
      </div>
      <div className="mt-1.5 text-[10px] text-gray-600 text-right">
        {input.length}/{MAX_TEXT_LEN}
      </div>
    </div>
  );
}
