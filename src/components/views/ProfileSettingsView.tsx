"use client";

import { useState, useEffect } from "react";
import {
  FiArrowLeft, FiCheck, FiCamera, FiLoader, FiUser, FiSave,
} from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { updateProfile, getMyProfile, type ProfileRow } from "../../lib/db";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";

interface ProfileSettingsViewProps {
  t: ThemeColors;
  onClose: () => void;
  onSaved?: () => void;
}

const AVATARS = [
  { id: "avatar_default", label: "User", emoji: "👤" },
  { id: "avatar_cat", label: "Cat", emoji: "🐱" },
  { id: "avatar_dog", label: "Dog", emoji: "🐶" },
  { id: "avatar_fox", label: "Fox", emoji: "🦊" },
  { id: "avatar_panda", label: "Panda", emoji: "🐼" },
  { id: "avatar_penguin", label: "Penguin", emoji: "🐧" },
  { id: "avatar_robot", label: "Robot", emoji: "🤖" },
  { id: "avatar_unicorn", label: "Unicorn", emoji: "🦄" },
];

export default function ProfileSettingsView({ t, onClose, onSaved }: ProfileSettingsViewProps) {
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  // Form state
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatar, setAvatar] = useState("avatar_default");

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await getMyProfile();
        if (!mounted) return;
        if (!p) {
          setErr("Profil topilmadi. Avval tizimga kiring.");
          setLoading(false);
          return;
        }
        setProfile(p);
        setUsername(p.username || "");
        setFirstName(p.first_name || "");
        setLastName(p.last_name || "");
        setAvatar(p.avatar || "avatar_default");
      } catch (e) {
        if (mounted) setErr((e as Error)?.message || "Xatolik");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg("");
    setErr("");
    try {
      const updates: Record<string, unknown> = {};
      if (username.trim()) updates.username = username.trim();
      updates.first_name = firstName.trim();
      updates.last_name = lastName.trim();
      updates.avatar = avatar;
      updates.avatar_id = avatar;

      if (isSupabaseConfigured()) {
        await updateProfile(updates);
      }
      // Also update localStorage for immediate UI feedback
      try {
        const stored = JSON.parse(localStorage.getItem("typeuz_profile") || "{}");
        localStorage.setItem("typeuz_profile", JSON.stringify({ ...stored, ...updates }));
      } catch {}

      setMsg("✓ Profil yangilandi!");
      onSaved?.();
      setTimeout(onClose, 1200);
    } catch (e) {
      setErr((e as Error)?.message || "Saqlashda xatolik");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-sm" style={{ color: t.accent }}>
          <FiLoader className="animate-spin" size={16} />
          Yuklanmoqda...
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-lg mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <FiUser />
          Profil sozlamalari
        </h2>
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1">
          <FiArrowLeft size={14} /> Orqaga
        </button>
      </div>

      {/* Avatar selector */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
          <FiCamera size={12} /> Avatar tanlash
        </div>
        <div className="grid grid-cols-4 gap-3">
          {AVATARS.map((a) => (
            <button
              key={a.id}
              onClick={() => setAvatar(a.id)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all hover:scale-105"
              style={{
                background: avatar === a.id ? t.accent + "22" : "rgba(255,255,255,0.03)",
                border: `2px solid ${avatar === a.id ? t.accent : "rgba(255,255,255,0.06)"}`,
              }}
            >
              <span className="text-2xl">{a.emoji}</span>
              <span className="text-[10px] text-gray-500">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Form fields */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="username"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${username ? t.accent + "44" : "rgba(255,255,255,0.06)"}`,
              color: "#fff",
            }}
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
            Ism
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Ismingiz"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${firstName ? t.accent + "44" : "rgba(255,255,255,0.06)"}`,
              color: "#fff",
            }}
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
            Familiya
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Familiyangiz"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${lastName ? t.accent + "44" : "rgba(255,255,255,0.06)"}`,
              color: "#fff",
            }}
          />
        </div>
      </div>

      {/* Email (read-only) */}
      {profile?.email && (
        <div className="mb-6">
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
            Email
          </label>
          <div
            className="px-4 py-2.5 rounded-xl text-sm"
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", color: "#9ca3af" }}
          >
            {profile.email}
          </div>
        </div>
      )}

      {/* Stats preview */}
      {profile && (
        <div className="mb-6 p-4 rounded-2xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Statistika</div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Coins", value: `🪙 ${profile.coins}`, color: "#f59e0b" },
              { label: "XP", value: `⚡ ${profile.xp}`, color: "#a78bfa" },
              { label: "Best WPM", value: profile.best_wpm || "—", color: t.accent },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      {err && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
          {err}
        </div>
      )}
      {msg && (
        <div className="mb-4 px-4 py-2.5 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
          {msg}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving || !username.trim()}
        className="w-full py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
        style={{
          background: t.accent,
          color: "#000",
          opacity: saving || !username.trim() ? 0.5 : 1,
        }}
      >
        <FiSave size={16} />
        {saving ? "Saqlanmoqda..." : "Saqlash"}
      </button>
    </div>
  );
}
