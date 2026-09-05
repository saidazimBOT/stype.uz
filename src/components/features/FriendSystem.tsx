"use client";

import { useState, useEffect, useCallback } from "react";
import { FiUsers, FiX } from "react-icons/fi";
import { FaGamepad } from "react-icons/fa6";
import { sendChallengeInvite } from "../../lib/challengeBridge";
import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import HeroAvatar from "./HeroAvatar";
import type { ThemeColors, FriendUser } from "../../types";
import { isSupabaseConfigured } from "../../lib/supabase";
import { listAllProfiles, getCurrentUserId } from "../../lib/db";
import type { ProfileRow } from "../../lib/db";

interface FriendSystemProps {
  t: ThemeColors;
  onClose: () => void;
  activeAvatar?: string;
  heroEquip?: HeroEquip;
  onChallengeSent?: (inviteId: string) => void;
}

function profileToFriend(u: ProfileRow): FriendUser {
  return {
    id: u.id,
    name: u.username || u.first_name || "User",
    country: "🌍",
    status: "offline",
    wpm: u.best_wpm || 0,
    avatar: (u.username || u.first_name || "U").slice(0, 2).toUpperCase(),
    color: "#6b7280",
  };
}

export default function FriendSystem({ t, onClose, activeAvatar = "avatar_default", heroEquip, onChallengeSent }: FriendSystemProps) {
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<FriendUser[]>([]);
  const [challengeBusy, setChallengeBusy] = useState<string | null>(null);

  // Supabase'dan foydalanuvchilarni olish
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    (async () => {
      try {
        const uid = await getCurrentUserId();
        const profiles = await listAllProfiles();
        const users = profiles
          .filter((p) => p.id !== uid)
          .map(profileToFriend);
        setAllUsers(users);
      } catch {}
    })();
  }, []);

  const filteredUsers = allUsers.filter(
    (u) => u.name.toLowerCase().includes(search.toLowerCase()) && !friends.find((f) => f.name === u.name)
  );

  const addFriend = (user: FriendUser) => {
    setFriends((prev) => [...prev, { ...user, addedAt: Date.now() }]);
  };

  const removeFriend = (name: string) => {
    setFriends((prev) => prev.filter((f) => f.name !== name));
  };

  const statusColor = (status: "online" | "idle" | "offline"): string => {
    switch (status) {
      case "online": return "#22c55e";
      case "idle": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiUsers /> Friends
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">{friends.length} friends</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">← Back</button>
      </div>

      {/* Your Avatar Card */}
      {(() => {
        const av = getAvatarInfo(activeAvatar);
        return (
          <div className="flex items-center gap-4 p-4 rounded-xl mb-6" style={{ background: t.surface, border: `1px solid ${av.color}33` }}>
            <div className="w-12 h-12 flex-shrink-0">
              <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...heroEquip }} color={av.color} size={48} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-white">You</div>
              <div className="text-xs" style={{ color: av.color }}>{av.name}</div>
            </div>
            <div className="w-3 h-3 rounded-full" style={{ background: "#22c55e" }} />
          </div>
        );
      })()}

      {/* Search */}
      <div className="relative mb-6">
        <input type="text" placeholder="Search users..." value={search} onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{ background: t.surface, border: `1px solid ${search ? t.accent + "44" : "transparent"}`, color: "#fff" }} />
      </div>

      {/* Friends */}
      {friends.length > 0 && (
        <div className="mb-6">
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">My Friends ({friends.length})</div>
          <div className="flex flex-col gap-2">
            {friends.map((f) => (
              <div key={f.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: f.color + "33", color: f.color }}>{f.avatar}</div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2" style={{ background: statusColor(f.status), borderColor: t.surface }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{f.name}</div>
                  <div className="text-xs text-gray-500">{f.country} · {f.wpm} WPM</div>
                </div>
                <button
                  onClick={async () => {
                    if (!f.id) return;
                    setChallengeBusy(f.name);
                    const id = await sendChallengeInvite({
                      toUserId: f.id,
                      toUsername: f.name,
                      lang: "en",
                      duration: 15,
                    });
                    if (id && onChallengeSent) onChallengeSent(id);
                    setChallengeBusy(null);
                  }}
                  disabled={challengeBusy === f.name || !f.id}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all hover:scale-105 disabled:opacity-50"
                  style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
                  title={`${f.name} ni challenge ga taklif qilish`}
                >
                  <FaGamepad size={10} /> {challengeBusy === f.name ? "..." : "Challenge"}
                </button>
                <button onClick={() => removeFriend(f.name)} className="text-xs px-3 py-1 rounded-lg hover:bg-white/5 text-gray-500"><FiX size={13} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search results */}
      {search && filteredUsers.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Add Friends</div>
          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div key={u.name} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: u.color + "33", color: u.color }}>{u.avatar}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.wpm} WPM</div>
                </div>
                <button onClick={() => addFriend(u)} className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105" style={{ background: t.accent + "22", color: t.accent }}>+ Add</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {friends.length === 0 && !search && (
        <div className="text-center text-gray-600 py-12">
          <FiUsers size={36} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Search for users to add as friends!</p>
        </div>
      )}
    </div>
  );
}
