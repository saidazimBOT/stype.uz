"use client";

import { useState } from "react";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { ThemeColors, FriendUser, FriendRequest } from "../../types";

const MOCK_USERS: FriendUser[] = [
  { name: "SpeedKing_99", country: "🇺🇸", status: "online", wpm: 247, avatar: "SK", color: "#a78bfa" },
  { name: "NightTyper", country: "🇩🇪", status: "online", wpm: 231, avatar: "NT", color: "#22c55e" },
  { name: "FingerBlitz", country: "🇰🇷", status: "idle", wpm: 219, avatar: "FB", color: "#f59e0b" },
  { name: "UzbekEagle", country: "🇺🇿", status: "online", wpm: 196, avatar: "UE", color: "#ec4899" },
  { name: "TastyKeys", country: "🇯🇵", status: "offline", wpm: 189, avatar: "TK", color: "#f59e0b" },
  { name: "TypeMaestro", country: "🇬🇧", status: "idle", wpm: 168, avatar: "TM", color: "#38bdf8" },
];

interface FriendSystemProps {
  t: ThemeColors;
  onClose: () => void;
}

export default function FriendSystem({ t, onClose }: FriendSystemProps) {
  const [friends, setFriends] = useLocalStorage<FriendUser[]>("typeuz_friends", []);
  const [search, setSearch] = useState("");
  const [requests, setRequests] = useLocalStorage<FriendRequest[]>("typeuz_requests", []);

  const filteredUsers = MOCK_USERS.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) &&
      !friends.find((f) => f.name === u.name)
  );

  const addFriend = (user: FriendUser) => {
    setFriends((prev) => [...prev, { ...user, addedAt: Date.now() }]);
  };

  const removeFriend = (name: string) => {
    setFriends((prev) => prev.filter((f) => f.name !== name));
  };

  const sendRequest = (name: string) => {
    setRequests((prev) => [...prev, { name, sent: Date.now() }]);
  };

  const statusColor = (status: "online" | "idle" | "offline"): string => {
    switch (status) {
      case "online":
        return "#22c55e";
      case "idle":
        return "#f59e0b";
      default:
        return "#6b7280";
    }
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">👥 Friends</h2>
          <p className="text-sm text-gray-500 mt-0.5">{friends.length} friends</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all"
          style={{
            background: t.surface,
            border: `1px solid ${search ? t.accent + "44" : "transparent"}`,
            color: "#fff",
          }}
        />
      </div>

      {/* Online friends */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Online Friends</div>
        {friends.filter((f) => f.status === "online").length === 0 ? (
          <div className="text-sm text-gray-600 text-center py-6">
            No friends online. Add some friends!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends
              .filter((f) => f.status === "online")
              .map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
                >
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: f.color + "33", color: f.color }}
                    >
                      {f.avatar}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{
                        background: statusColor(f.status),
                        borderColor: t.surface,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{f.name}</div>
                    <div className="text-xs text-gray-500">
                      {f.country} · {f.wpm} WPM
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(f.name)}
                    className="text-xs px-3 py-1 rounded-lg hover:bg-white/5 text-gray-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* All friends */}
      <div className="mb-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">All Friends</div>
        {friends.length === 0 ? (
          <div className="text-sm text-gray-600 text-center py-6">
            No friends yet. Search and add friends above!
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {friends
              .filter((f) => f.status !== "online")
              .map((f) => (
                <div
                  key={f.name}
                  className="flex items-center gap-3 p-3 rounded-xl opacity-60"
                  style={{ background: t.surface }}
                >
                  <div className="relative">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: f.color + "33", color: f.color }}
                    >
                      {f.avatar}
                    </div>
                    <div
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{
                        background: statusColor(f.status),
                        borderColor: t.surface,
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{f.name}</div>
                    <div className="text-xs text-gray-500">
                      {f.country} · {f.status}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFriend(f.name)}
                    className="text-xs px-3 py-1 rounded-lg hover:bg-white/5 text-gray-500"
                  >
                    ✕
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Search results */}
      {search && filteredUsers.length > 0 && (
        <div>
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Add Friends</div>
          <div className="flex flex-col gap-2">
            {filteredUsers.map((u) => (
              <div
                key={u.name}
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: u.color + "33", color: u.color }}>
                  {u.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-white">{u.name}</div>
                  <div className="text-xs text-gray-500">{u.country} · {u.wpm} WPM</div>
                </div>
                <button
                  onClick={() => {
                    addFriend(u);
                    sendRequest(u.name);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                  style={{ background: t.accent + "22", color: t.accent }}
                >
                  + Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
