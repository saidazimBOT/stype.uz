"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiMessageCircle, FiSend, FiTrash2 } from "react-icons/fi";
import { FaCrown, FaShield } from "react-icons/fa6";
import type { ThemeColors } from "../../types";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "./HeroAvatar";
import { getCurrentUserId, getMyProfile } from "../../lib/db";
import {
  CHAT_COOLDOWN_MS,
  CHAT_MAX_LEN,
  deleteChatMessage,
  fetchChatAuthors,
  fetchRecentMessages,
  sendChatMessage,
  subscribeToChat,
  type ChatAuthor,
  type ChatMessage,
} from "../../lib/chat";

/** Xabar vaqti: bugungisi — soat, eskisi — sana bilan */
function formatTime(ms: number): string {
  const d = new Date(ms);
  const today = new Date();
  const sameDay =
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (sameDay) return time;
  return `${d.toLocaleDateString([], { day: "2-digit", month: "2-digit" })} ${time}`;
}

export default function Chat({ t, onClose, activeAvatar = "avatar_default", heroEquip }: {
  t: ThemeColors;
  onClose?: () => void;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [authors, setAuthors] = useState<Map<string, ChatAuthor>>(new Map());
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [myId, setMyId] = useState<string | null>(null);
  // Realtime ulanganmi? Ulanmasa so'rov bilan yangilashga o'tamiz
  const [live, setLive] = useState(false);
  const [myRole, setMyRole] = useState<ChatAuthor["role"]>("user");

  const listRef = useRef<HTMLDivElement>(null);
  const lastSentAt = useRef(0);

  const isAdmin = myRole === "admin" || myRole === "owner";
  const visible = useMemo(() => messages.filter((m) => !m.deleted), [messages]);

  // ── Kim ekanligimizni aniqlaymiz (yozish huquqi va rol nishoni uchun) ──
  useEffect(() => {
    let alive = true;
    void (async () => {
      const uid = await getCurrentUserId();
      if (!alive) return;
      setMyId(uid);
      if (!uid) return;
      const profile = await getMyProfile();
      if (alive && profile) setMyRole(profile.role);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // ── Hali bilinmagan mualliflarni yuklaymiz (Owner/Admin nishoni uchun) ──
  const loadAuthors = useCallback((msgs: ChatMessage[]) => {
    setAuthors((prev) => {
      const missing = [...new Set(msgs.map((m) => m.user_id))].filter((id) => !prev.has(id));
      if (missing.length === 0) return prev;
      void fetchChatAuthors(missing).then((fetched) => {
        if (fetched.size === 0) return;
        setAuthors((cur) => {
          const next = new Map(cur);
          for (const [id, a] of fetched) next.set(id, a);
          return next;
        });
      });
      return prev;
    });
  }, []);

  // ── Dastlabki yuklash + realtime obuna ──
  useEffect(() => {
    let alive = true;
    setLoading(true);
    fetchRecentMessages()
      .then((msgs) => {
        if (!alive) return;
        setMessages(msgs);
        loadAuthors(msgs);
      })
      .catch((e: Error) => {
        if (alive) setError(e?.message || "Chatni yuklab bo'lmadi");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    const unsubscribe = subscribeToChat(
      (msg) => {
        // O'z xabarimiz ham shu yerdan qaytadi — id bo'yicha takrorlanmaydi
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
        loadAuthors([msg]);
      },
      (msg) => {
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      },
      (connected) => {
        if (alive) setLive(connected);
      },
    );

    return () => {
      alive = false;
      unsubscribe();
    };
  }, [loadAuthors]);

  // ── Realtime ishlamasa — har 5 soniyada so'rov bilan yangilaymiz ──
  useEffect(() => {
    if (live) return;
    const iv = window.setInterval(() => {
      void fetchRecentMessages()
        .then((msgs) => {
          setMessages(msgs);
          loadAuthors(msgs);
        })
        .catch(() => {});
    }, 5000);
    return () => window.clearInterval(iv);
  }, [live, loadAuthors]);

  // ── Yangi xabar kelganda pastga suramiz ──
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible.length]);

  const send = useCallback(async () => {
    const text = draft.trim();
    if (!text || sending) return;

    const since = Date.now() - lastSentAt.current;
    if (since < CHAT_COOLDOWN_MS) {
      setError(`Biroz sekinroq — ${Math.ceil((CHAT_COOLDOWN_MS - since) / 1000)} soniya kuting`);
      return;
    }

    setSending(true);
    setError("");
    try {
      await sendChatMessage(text);
      lastSentAt.current = Date.now();
      setDraft("");
    } catch (e) {
      setError((e as Error)?.message || "Xabar yuborilmadi");
    } finally {
      setSending(false);
    }
  }, [draft, sending]);

  const remove = useCallback(async (id: number) => {
    try {
      await deleteChatMessage(id);
      // Realtime UPDATE kechiksa ham darhol yashiramiz
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, deleted: true } : m)));
    } catch (e) {
      setError((e as Error)?.message || "Xabarni o'chirib bo'lmadi");
    }
  }, []);

  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 sm:px-8 py-6 min-h-0">
      {/* Sarlavha */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiMessageCircle />
            Chat
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {loading
              ? "Yuklanmoqda..."
              : `${visible.length} ta xabar · ${live ? "jonli" : "yangilanmoqda"}`}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
            &larr; Back
          </button>
        )}
      </div>

      {/* Xabarlar ro'yxati */}
      <div
        ref={listRef}
        className="flex-1 min-h-0 overflow-y-auto rounded-2xl p-3 flex flex-col gap-2"
        style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}
      >
        {loading ? (
          <div className="m-auto text-gray-500 text-sm">Chat yuklanmoqda...</div>
        ) : visible.length === 0 ? (
          <div className="m-auto text-gray-500 text-sm text-center">
            Hali xabar yo&apos;q. Birinchi bo&apos;lib yozing!
          </div>
        ) : (
          visible.map((m) => {
            const author = authors.get(m.user_id);
            const name = author?.username || m.username;
            const role = author?.role ?? "user";
            const mine = m.user_id === myId;
            const av = getAvatarInfo(activeAvatar);
            return (
              <div key={m.id} className={`flex gap-2.5 group ${mine ? "flex-row-reverse" : ""}`}>
                <div className="w-8 h-8 flex-shrink-0">
                  {mine ? (
                    <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={32} />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: t.accent + "22", color: t.accent }}
                    >
                      {name.slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={`min-w-0 max-w-[75%] flex flex-col ${mine ? "items-end text-right" : ""}`}>
                  <div className={`flex items-center gap-1.5 text-xs mb-0.5 ${mine ? "flex-row-reverse" : ""}`}>
                    <span className="font-medium text-gray-300 truncate">{name}</span>
                    {role === "owner" && (
                      <span
                        className="px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ background: "#f59e0b22", color: "#fbbf24" }}
                      >
                        <FaCrown size={9} /> Owner
                      </span>
                    )}
                    {role === "admin" && (
                      <span
                        className="px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ background: "#38bdf822", color: "#38bdf8" }}
                      >
                        <FaShield size={9} /> Admin
                      </span>
                    )}
                    <span className="text-gray-600">{formatTime(m.created_at)}</span>
                    {(mine || isAdmin) && (
                      <button
                        onClick={() => void remove(m.id)}
                        title="O'chirish"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 hover:text-red-400"
                      >
                        <FiTrash2 size={11} />
                      </button>
                    )}
                  </div>
                  <div
                    className="px-3 py-2 rounded-2xl text-sm text-white break-words whitespace-pre-wrap"
                    style={{
                      background: mine ? t.accent + "22" : "#ffffff0d",
                      border: `1px solid ${mine ? t.accent + "33" : "#ffffff12"}`,
                    }}
                  >
                    {m.body}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <div className="mt-2 text-xs text-red-400">{error}</div>}

      {/* Yozish maydoni — faqat login qilganlar uchun */}
      {myId ? (
        <div className="mt-3 flex gap-2 items-end">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MAX_LEN))}
            onKeyDown={(e) => {
              // Enter — yuborish, Shift+Enter — yangi qator
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Xabar yozing..."
            className="flex-1 resize-none px-4 py-2.5 rounded-xl text-sm text-white outline-none"
            style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
          />
          <button
            onClick={() => void send()}
            disabled={sending || !draft.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-medium disabled:opacity-40 transition-opacity"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
            title="Yuborish"
          >
            <FiSend />
          </button>
        </div>
      ) : (
        <div className="mt-3 text-center text-sm text-gray-500 py-3 rounded-xl" style={{ background: t.surface }}>
          Chatda yozish uchun tizimga kiring.
        </div>
      )}
    </div>
  );
}
