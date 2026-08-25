"use client";

import { useEffect } from "react";
import type { ThemeColors } from "../../types";
import { FiBell, FiX } from "react-icons/fi";
import { heartbeat, getPublicSettings, getPublicAnnouncements, getCurrentUserId, recordTypingResult } from "../../lib/db";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getMyProfile } from "../../lib/db";
import type { PublicSettings } from "../admin/types";

// ── Yurak urishi: onlayn status ──────────────────────────────────────
function Heartbeat() {
  useEffect(() => {
    const ping = () => void heartbeat().catch(() => {});
    ping();
    const iv = window.setInterval(ping, 60_000);
    return () => window.clearInterval(iv);
  }, []);
  return null;
}

// ── Type natijalarini serverga yozish ko'prigi ────────────────────────
export function TypingRecorderBridge() {
  useEffect(() => {
    // Typing recorder function — App.tsx dan chaqiriladi
    const fn = (args: {
      wpm: number; accuracy: number; errors: number; correct: number;
      total: number; time: number; lang: string; duration: number;
      username?: string;
    }) => recordTypingResult(args);
    (window as Record<string, unknown>).__typingRecorder = fn;
    return () => { (window as Record<string, unknown>).__typingRecorder = null; };
  }, []);

  // User token'ni window ga joylashtirish
  useEffect(() => {
    const setToken = async () => {
      const uid = await getCurrentUserId();
      (window as Record<string, unknown>).__userToken = uid;
    };
    void setToken();
    const iv = window.setInterval(() => void setToken(), 30_000);
    return () => window.clearInterval(iv);
  }, []);

  return null;
}

// ── E'lonlar banneri ─────────────────────────────────────────────────
function AnnouncementBanner({ t }: { t: ThemeColors }) {
  const { data: settings } = useSupabaseQuery(() => getPublicSettings());
  const { data: announcements } = useSupabaseQuery(() => getPublicAnnouncements());
  const [dismissed, setDismissed] = useLocalStorage<string[]>(["typeuz_dismissed_ann"], []);

  const visible = (announcements ?? []).filter((a) => !dismissed.includes(String(a.id)));
  if (!settings?.announcementsEnabled || visible.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-40">
      {visible.map((a) => (
        <div
          key={a.id}
          className="flex items-center gap-3 px-4 py-2.5 animate-fade-in border-b"
          style={{
            background: `linear-gradient(90deg, ${t.accent}26, ${t.surface}ee)`,
            borderColor: `${t.accent}44`,
            backdropFilter: "blur(8px)",
          }}
        >
          <FiBell size={14} className="flex-shrink-0 animate-bounce" style={{ color: t.accent }} />
          <div className="min-w-0 flex-1">
            {a.title && (
              <span className="text-xs font-bold text-white mr-2">{a.title}</span>
            )}
            <span className="text-xs text-gray-300">{a.body}</span>
          </div>
          <button
            onClick={() => setDismissed((prev) => [...prev.slice(-9), String(a.id)])}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="E'lonni yopish"
          >
            <FiX size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Texnik xizmat rejimi ─────────────────────────────────────────────
function MaintenanceGate({ t }: { t: ThemeColors }) {
  const { data: settings } = useSupabaseQuery(() => getPublicSettings());
  const { data: me } = useSupabaseQuery(() => getMyProfile());
  const isAdmin = !!me && (me.role === "admin" || me.role === "owner");
  if (!settings?.maintenanceMode || isAdmin) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6" style={{ background: t.bg }}>
      <div className="text-center max-w-md animate-pop-in">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-5"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
        >
          <FiBell size={28} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">
          {settings.siteName || "STypeUz"}
        </h2>
        <p className="text-sm text-gray-400 leading-relaxed">
          {settings.maintenanceMessage || "Saytda texnik ishlar olib borilmoqda. Tez orada qaytamiz!"}
        </p>
        <div className="mt-6 text-xs text-gray-600 animate-pulse">⏳ Tez orada...</div>
      </div>
    </div>
  );
}

export default function SiteOverlays({ t }: { t: ThemeColors }) {
  return (
    <>
      <AnnouncementBanner t={t} />
      <MaintenanceGate t={t} />
      <Heartbeat />
      <TypingRecorderBridge />
    </>
  );
}
