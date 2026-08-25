"use client";

import { useEffect, useRef, useState } from "react";
import { FiLogIn, FiLogOut, FiSettings, FiUser } from "react-icons/fi";
import { FaCrown, FaShield } from "react-icons/fa6";
import type { ThemeColors } from "../../types";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "./HeroAvatar";

/**
 * Sidebar'ning pastki-chap burchagidagi akkaunt bloki.
 *
 * Kirgan holatda: avatar + ism. Bosilsa menyu ochiladi — profil, sozlamalar
 * va CHIQISH (logout). Kirmagan holatda: "Kirish" tugmasi, u login oynasini
 * ochadi (Google yoki email + parol).
 */
export default function SidebarAccount({
  t,
  signedIn,
  name,
  role = "user",
  activeAvatar = "avatar_default",
  heroEquip,
  onOpenProfile,
  onOpenSettings,
  onLogin,
  onLogout,
}: {
  t: ThemeColors;
  signedIn: boolean;
  name: string;
  role?: string;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onLogin: () => void;
  onLogout: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilsa yoki Escape bosilsa menyu yopiladi
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ── Kirmagan holat ──
  if (!signedIn) {
    return (
      <button
        onClick={onLogin}
        className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5 mb-2"
        style={{ color: t.accent }}
        title="Kirish / Ro'yxatdan o'tish"
      >
        <FiLogIn size={16} className="flex-shrink-0" />
        <span className="hidden md:block">Kirish</span>
      </button>
    );
  }

  const av = getAvatarInfo(activeAvatar);
  const isOwner = role === "owner";
  const isAdmin = role === "admin";

  const item = "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-white/5";

  return (
    <div ref={boxRef} className="relative mb-2">
      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-44 rounded-xl overflow-hidden z-50 shadow-xl animate-fade-in"
          style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
        >
          <button
            onClick={() => {
              setOpen(false);
              onOpenProfile();
            }}
            className={`${item} text-gray-300`}
          >
            <FiUser size={14} /> Profil
          </button>
          <button
            onClick={() => {
              setOpen(false);
              onOpenSettings();
            }}
            className={`${item} text-gray-300`}
          >
            <FiSettings size={14} /> Sozlamalar
          </button>
          <div className="h-px" style={{ background: `${t.accent}22` }} />
          <button
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              try {
                await onLogout();
              } finally {
                setBusy(false);
                setOpen(false);
              }
            }}
            disabled={busy}
            className={`${item} text-red-400/80 hover:text-red-400 disabled:opacity-50`}
          >
            <FiLogOut size={14} /> {busy ? "Chiqilmoqda..." : "Chiqish"}
          </button>
        </div>
      )}

      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-1 md:px-2 py-1.5 rounded-lg text-left transition-all hover:bg-white/5"
        style={{ background: open ? t.accent + "11" : "transparent" }}
        title={`${name} — akkaunt`}
      >
        <div className="w-8 h-8 flex-shrink-0">
          <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={32} />
        </div>
        <div className="hidden md:block min-w-0">
          <div className="text-sm text-white truncate flex items-center gap-1">
            {name}
            {isOwner && <FaCrown size={9} style={{ color: "#fbbf24" }} />}
            {isAdmin && <FaShield size={9} style={{ color: "#38bdf8" }} />}
          </div>
          <div className="text-[10px] text-gray-500">Akkaunt</div>
        </div>
      </button>
    </div>
  );
}
