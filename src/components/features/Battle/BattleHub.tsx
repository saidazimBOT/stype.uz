"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import type { Doc } from "../../../../convex/_generated/dataModel";
import type { HeroEquip } from "../../../data/shop";
import {
  FiCheck,
  FiCopy,
  FiFlag,
  FiGlobe,
  FiLock,
  FiLogOut,
  FiRefreshCw,
  FiSend,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { FaMedal, FaTrophy } from "react-icons/fa6";
import type { ThemeColors } from "../../../types";
import { getConvexClient, getStoredUsername, storeUsername } from "../../../lib/battle";
import { useBattleProfile } from "../../../hooks/useBattleProfile";
import { AvatarChip, BATTLE_REWARDS, progressPct, type BattleOutcome } from "./battleUtils";
import TypingArena from "./TypingArena";
import CoinIcon from "../../CoinIcon";

type Room = Doc<"rooms">;
type RoomPlayer = Room["players"][number];

const CONFETTI_COLORS = ["#fbbf24", "#38bdf8", "#a78bfa", "#34d399", "#f472b6", "#f87171"];

// ══════════════════════════════════════════════════════════════════════
// BattleHub — kirish nuqtasi
// ══════════════════════════════════════════════════════════════════════
interface BattleHubProps {
  t: ThemeColors;
  onClose: () => void;
  coinsStore: {
    coins: number;
    setCoins: React.Dispatch<React.SetStateAction<number>>;
    addCoins: (n: number) => void;
    activeAvatar: string;
  };
  heroEquip?: HeroEquip;
  addXp: (n: number) => void;
}

export default function BattleHub({ t, onClose, coinsStore, heroEquip, addXp }: BattleHubProps) {
  const configured = useMemo(() => getConvexClient() !== null, []);
  if (!configured) {
    return <BackendMissing t={t} onClose={onClose} />;
  }
  return <BattleApp t={t} onClose={onClose} coinsStore={coinsStore} heroEquip={heroEquip} addXp={addXp} />;
}

// ══════════════════════════════════════════════════════════════════════
function BattleApp({ t, onClose, coinsStore, heroEquip, addXp }: BattleHubProps) {
  const { authLoading, isAuthenticated, me, setUsername } = useBattleProfile();
  const [screen, setScreen] = useState<"hub" | "1v1" | "team">("hub");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Server profildan coins/xp ni local hook'larga sinxronlash (faqat o'sish tomonga)
  const prevXpRef = useRef<number | null>(null);
  useEffect(() => {
    if (!me) return;
    coinsStore.setCoins((prev) => Math.max(prev, me.coins));
    if (prevXpRef.current === null) {
      prevXpRef.current = me.xp;
      return;
    }
    const d = me.xp - prevXpRef.current;
    if (d > 0) addXp(d);
    prevXpRef.current = me.xp;
  }, [me, coinsStore.setCoins, addXp]);

  if (authLoading || !isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-2">⚔️ Battle</div>
          <div className="text-sm text-gray-500 animate-pulse">Ulanish...</div>
          <button onClick={onClose} className="mt-6 px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
            ← Back
          </button>
        </div>
      </div>
    );
  }

  if (!me || !me.username) {
    return <UsernameSetup t={t} onClose={onClose} setUsername={setUsername} coinsStore={coinsStore} />;
  }

  const backToHub = () => {
    setRoomCode(null);
    setNotice(null);
    setScreen("hub");
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            ⚔️ Multiplayer Battle
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {me.username} ·{" "}
            <span className="inline-flex items-center gap-1" style={{ color: t.accent }}>
              <CoinIcon size={13} /> {coinsStore.coins.toLocaleString()}
            </span>{" "}
            · {me.xp.toLocaleString()} XP
          </p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {notice && (
        <div
          className="mb-4 px-4 py-2.5 rounded-xl text-sm flex items-center justify-between animate-pop-in"
          style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#fca5a5" }}
        >
          <span>{notice}</span>
          <button onClick={() => setNotice(null)} className="ml-3 text-xs opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {roomCode ? (
        <RoomScreen
          t={t}
          code={roomCode}
          onLeave={backToHub}
          onError={setNotice}
          myAvatar={coinsStore.activeAvatar}
          heroEquip={heroEquip}
        />
      ) : screen === "hub" ? (
        <ModeSelect t={t} onPick={setScreen} onEnterCode={setRoomCode} onError={setNotice} />
      ) : (
        <SetupScreen t={t} mode={screen} onBack={() => setScreen("hub")} onJoined={setRoomCode} onError={setNotice} />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Backend sozlanmagan
// ══════════════════════════════════════════════════════════════════════
function BackendMissing({ t, onClose }: { t: ThemeColors; onClose: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <FiZap size={44} className="mx-auto mb-4" style={{ color: t.accent }} />
        <h2 className="text-xl font-bold text-white mb-2">Multiplayer sozlanmagan</h2>
        <p className="text-sm text-gray-500 mb-6">
          Realtime battle uchun backend (Convex) ulanmagan. <code>.env.local</code> faylida{" "}
          <code className="text-xs" style={{ color: t.accent }}>NEXT_PUBLIC_CONVEX_URL</code> ni
          o'rnatib, serverni qayta ishga tushiring.
        </p>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Username o'rnatish
// ══════════════════════════════════════════════════════════════════════
function UsernameSetup({
  t,
  onClose,
  setUsername,
  coinsStore,
}: {
  t: ThemeColors;
  onClose: () => void;
  setUsername: (args: {
    username: string;
    avatar?: string;
    coins?: number;
    xp?: number;
    bestWpm?: number;
  }) => Promise<unknown>;
  coinsStore: BattleHubProps["coinsStore"];
}) {
  const [name, setName] = useState(getStoredUsername());
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 20) {
      setError("Username 2-20 ta belgidan iborat bo'lishi kerak");
      return;
    }
    if (!/^[a-zA-Z0-9_\u0400-\u04FF]+$/.test(trimmed)) {
      setError("Faqat harflar, raqamlar va _ ishlatish mumkin");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setUsername({
        username: trimmed,
        avatar: coinsStore.activeAvatar,
        coins: coinsStore.coins,
        xp: 0,
      });
      storeUsername(trimmed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Xatolik yuz berdi");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-3 animate-bounce-in">⚔️</div>
        <h2 className="text-xl font-bold text-white mb-1">Username tanlang</h2>
        <p className="text-sm text-gray-500 mb-6">Boshqa o'yinchilar sizni shu nom bilan ko'radi</p>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="masalan: TypingHero_77"
          maxLength={20}
          autoFocus
          className="w-full px-4 py-3 rounded-xl text-sm text-center outline-none mb-3"
          style={{
            background: t.surface,
            border: `1px solid ${error ? "#ef444466" : t.accent + "44"}`,
            color: "#fff",
          }}
        />
        {error && <div className="text-xs text-red-400 mb-3 animate-pop-in">{error}</div>}
        <button
          onClick={save}
          disabled={saving || name.trim().length < 2}
          className="w-full px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: t.accent, color: "#000" }}
        >
          {saving ? "..." : <><FiCheck size={15} /> Boshlash</>}
        </button>
        <button onClick={onClose} className="mt-4 px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Mode tanlash (hub)
// ══════════════════════════════════════════════════════════════════════
function ModeSelect({
  t,
  onPick,
  onEnterCode,
  onError,
}: {
  t: ThemeColors;
  onPick: (m: "1v1" | "team") => void;
  onEnterCode: (code: string) => void;
  onError: (msg: string) => void;
}) {
  const publicRooms = useQuery(api.rooms.publicRooms);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [joinCode, setJoinCode] = useState("");

  const tryJoin = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      onError("Xona kodini kiriting");
      return;
    }
    try {
      await joinRoom({ code });
      onEnterCode(code);
      setJoinCode("");
    } catch (e) {
      onError(e instanceof Error ? e.message : "Xonaga kirib bo'lmadi");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {/* 1v1 */}
      <button
        onClick={() => onPick("1v1")}
        className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] group"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
          style={{ background: t.accent + "22", color: t.accent }}
        >
          <FiZap size={22} />
        </div>
        <div className="font-bold text-white">1v1 Battle</div>
        <div className="text-xs text-gray-500 mt-1">Kod orqali raqib bilan yuzma-yuz jang</div>
        <div className="mt-3 text-xs font-bold" style={{ color: t.accent }}>
          Xona yaratish →
        </div>
      </button>

      {/* Team */}
      <button
        onClick={() => onPick("team")}
        className="p-5 rounded-2xl text-left transition-all hover:scale-[1.02] group"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-3 transition-all group-hover:scale-110"
          style={{ background: "#a78bfa22", color: "#a78bfa" }}
        >
          <FiUsers size={22} />
        </div>
        <div className="font-bold text-white">Team Battle</div>
        <div className="text-xs text-gray-500 mt-1">Jamoa A vs Jamoa B — birgalikda tez yozing</div>
        <div className="mt-3 text-xs font-bold" style={{ color: "#a78bfa" }}>
          Jamoa yaratish →
        </div>
      </button>

      {/* Join by code */}
      <div
        className="md:col-span-2 p-5 rounded-2xl"
        style={{ background: t.surface, border: "1px solid #ffffff14" }}
      >
        <div className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FiSend size={14} /> Kod bilan qo'shilish
        </div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && tryJoin()}
            placeholder="5 HARFLI KOD"
            maxLength={6}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm uppercase tracking-widest outline-none"
            style={{ background: "#ffffff0d", border: "1px solid #ffffff14", color: "#fff" }}
          />
          <button
            onClick={tryJoin}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: t.accent, color: "#000" }}
          >
            <FiLogOut size={13} className="rotate-180" /> Qo'shilish
          </button>
        </div>
      </div>

      {/* Public team rooms */}
      <div className="md:col-span-2" style={{ display: publicRooms?.length ? undefined : "none" }}>
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Ochiq xonalar</div>
        <div className="space-y-2">
          {publicRooms?.map((r) => (
            <div
              key={r.code}
              className="flex items-center justify-between px-4 py-3 rounded-xl"
              style={{ background: t.surface, border: "1px solid #ffffff14" }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <FiGlobe size={14} className="text-gray-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-sm font-bold text-white tracking-widest">{r.code}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {r.mode === "team" ? "Team" : "1v1"} · {r.host}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="text-xs text-gray-500">
                  {r.players}/{r.maxPlayers}
                </span>
                <button
                  onClick={() =>
                    joinRoom({ code: r.code })
                      .then(() => onEnterCode(r.code))
                      .catch((e) => onError(e instanceof Error ? e.message : "Xatolik"))
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
                  style={{ background: t.accent, color: "#000" }}
                >
                  Kirish
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Rejim bo'yicha xona yaratish / qo'shilish
// ══════════════════════════════════════════════════════════════════════
function SetupScreen({
  t,
  mode,
  onBack,
  onJoined,
  onError,
}: {
  t: ThemeColors;
  mode: "1v1" | "team";
  onBack: () => void;
  onJoined: (code: string) => void;
  onError: (msg: string) => void;
}) {
  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const [visibility, setVisibility] = useState<"public" | "private">(mode === "team" ? "public" : "private");
  const [joinCode, setJoinCode] = useState("");
  const [busy, setBusy] = useState(false);

  const create = async () => {
    setBusy(true);
    try {
      const { code } = await createRoom({ mode, visibility });
      onJoined(code);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Xona yaratilmadi");
    } finally {
      setBusy(false);
    }
  };

  const join = async () => {
    const code = joinCode.trim().toUpperCase();
    if (code.length < 4) {
      onError("Xona kodini kiriting");
      return;
    }
    setBusy(true);
    try {
      await joinRoom({ code, team: undefined });
      onJoined(code);
    } catch (e) {
      onError(e instanceof Error ? e.message : "Xonaga kirib bo'lmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-4">
      <button onClick={onBack} className="text-sm text-gray-400 hover:text-white transition-colors">
        ← Ortga
      </button>

      <div
        className="p-6 rounded-2xl"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
      >
        <div className="text-lg font-bold text-white mb-1">
          {mode === "1v1" ? "1v1 xona yaratish" : "Jamoa xonasi yaratish"}
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {mode === "1v1"
            ? "Kod yaratiladi — uni raqibingizga yuboring"
            : "Jamoa xonasi yaratiladi — boshqalar kod yoki ro'yxat orqali kiradi"}
        </p>

        {mode === "team" && (
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setVisibility("public")}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: visibility === "public" ? "#22c55e22" : "#ffffff0d",
                color: visibility === "public" ? "#4ade80" : "#9ca3af",
                border: `1px solid ${visibility === "public" ? "#22c55e55" : "#ffffff14"}`,
              }}
            >
              <FiGlobe size={12} /> Ochiq
            </button>
            <button
              onClick={() => setVisibility("private")}
              className="flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              style={{
                background: visibility === "private" ? "#a78bfa22" : "#ffffff0d",
                color: visibility === "private" ? "#a78bfa" : "#9ca3af",
                border: `1px solid ${visibility === "private" ? "#a78bfa55" : "#ffffff14"}`,
              }}
            >
              <FiLock size={12} /> Yopiq
            </button>
          </div>
        )}

        <button
          onClick={create}
          disabled={busy}
          className="w-full px-5 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: t.accent, color: "#000" }}
        >
          {busy ? "..." : <><FiFlag size={14} /> Xona yaratish</>}
        </button>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-600">
        <div className="flex-1 h-px bg-white/5" /> yoki <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="p-6 rounded-2xl" style={{ background: t.surface, border: "1px solid #ffffff14" }}>
        <div className="text-sm font-bold text-white mb-3">Mavjud xonaga qo'shilish</div>
        <div className="flex gap-2">
          <input
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && join()}
            placeholder="KOD"
            maxLength={6}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm uppercase tracking-widest outline-none"
            style={{ background: "#ffffff0d", border: "1px solid #ffffff14", color: "#fff" }}
          />
          <button
            onClick={join}
            disabled={busy}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: t.accent, color: "#000" }}
          >
            Kirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Xona ichida (lobby / countdown / racing / finished)
// ══════════════════════════════════════════════════════════════════════
function RoomScreen({
  t,
  code,
  onLeave,
  onError,
  myAvatar,
  heroEquip,
}: {
  t: ThemeColors;
  code: string;
  onLeave: () => void;
  onError: (msg: string) => void;
  myAvatar: string;
  heroEquip?: HeroEquip;
}) {
  const room = useQuery(api.rooms.getRoom, { code });
  const myToken = useQuery(api.users.myToken);
  const startRoom = useMutation(api.rooms.startRoom);
  const syncClock = useMutation(api.rooms.syncClock);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const rematch = useMutation(api.rooms.rematch);
  const switchTeam = useMutation(api.rooms.switchTeam);

  const myPlayer = room?.players.find((p) => p.tokenIdentifier === myToken) ?? null;
  const isHost = room?.createdBy === myToken;

  // Xonani tark etishda tozalash
  useEffect(() => {
    return () => {
      leaveRoom({ code }).catch(() => {});
    };
  }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  // Soatni sinxronlash: countdown → racing va muddat tugashini tekshirish
  useEffect(() => {
    if (!room || !myToken) return;
    if (room.status === "countdown" || room.status === "racing") {
      const iv = setInterval(() => {
        syncClock({ code }).catch(() => {});
      }, 1000);
      return () => clearInterval(iv);
    }
  }, [room?.status, code, myToken, syncClock]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLeave = () => {
    leaveRoom({ code })
      .catch(() => {})
      .finally(onLeave);
  };

  if (!room) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-500 animate-pulse mb-4">Xona yuklanmoqda...</div>
        <button onClick={onLeave} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Ortga
        </button>
      </div>
    );
  }

  if (room.status === "lobby") {
    return (
      <LobbyView
        t={t}
        room={room}
        isHost={isHost}
        myToken={myToken ?? ""}
        myAvatar={myAvatar}
        heroEquip={heroEquip}
        onStart={async () => {
          try {
            await startRoom({ code });
          } catch (e) {
            onError(e instanceof Error ? e.message : "Boshlab bo'lmadi");
          }
        }}
        onSwitchTeam={async (team) => {
          try {
            await switchTeam({ code, team });
          } catch (e) {
            onError(e instanceof Error ? e.message : "Almashib bo'lmadi");
          }
        }}
        onLeave={handleLeave}
      />
    );
  }

  if (room.status === "countdown") {
    return <CountdownView t={t} room={room} onLeave={handleLeave} />;
  }

  if (room.status === "racing") {
    return (
      <RaceView
        t={t}
        room={room}
        code={code}
        myToken={myToken ?? ""}
        myAvatar={myAvatar}
        heroEquip={heroEquip}
        onLeave={handleLeave}
      />
    );
  }

  return (
    <ResultsView
      t={t}
      room={room}
      code={code}
      myToken={myToken ?? ""}
      myAvatar={myAvatar}
      heroEquip={heroEquip}
      onRematch={async () => {
        try {
          await rematch({ code });
        } catch {
          onLeave();
        }
      }}
      onLeave={handleLeave}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════
// Lobby
// ══════════════════════════════════════════════════════════════════════
function CodeChip({ code, t }: { code: string; t: ThemeColors }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard
      ?.writeText(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {});
  };
  return (
    <button
      onClick={copy}
      title="Kodni nusxalash"
      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold tracking-[0.3em] transition-all hover:scale-105"
      style={{ background: t.accent + "22", border: `1px solid ${t.accent}55`, color: t.accent }}
    >
      {code}
      {copied ? <FiCheck size={14} className="text-green-400" /> : <FiCopy size={14} />}
    </button>
  );
}

function LobbyView({
  t,
  room,
  isHost,
  myToken,
  myAvatar,
  heroEquip,
  onStart,
  onSwitchTeam,
  onLeave,
}: {
  t: ThemeColors;
  room: Room;
  isHost: boolean;
  myToken: string;
  myAvatar: string;
  heroEquip?: HeroEquip;
  onStart: () => void;
  onSwitchTeam: (team: "A" | "B") => void;
  onLeave: () => void;
}) {
  const isTeam = room.mode === "team";
  const enoughPlayers =
    room.mode === "1v1"
      ? room.players.length >= 2
      : room.players.length >= 2 &&
        room.players.some((p) => p.team === "A") &&
        room.players.some((p) => p.team === "B");

  return (
    <div className="space-y-4">
      {/* Room info */}
      <div
        className="p-5 rounded-2xl"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
      >
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-widest mb-1">
              {isTeam ? "Team Battle" : "1v1 Battle"} · {room.visibility === "public" ? "Ochiq" : "Yopiq"}
            </div>
            <div className="text-white font-bold">
              Xona kodi: <CodeChip code={room.code} t={t} />
            </div>
          </div>
          <button
            onClick={onLeave}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5"
            style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#fca5a5" }}
          >
            <FiLogOut size={13} /> Chiqish
          </button>
        </div>
        <div className="mt-3 text-xs text-gray-500">
          O'yinchilar: <span className="text-white">{room.players.length}</span> / {room.maxPlayers}
        </div>
      </div>

      {/* Players */}
      {isTeam ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {(["A", "B"] as const).map((team) => {
            const members = room.players.filter((p) => p.team === team);
            return (
              <div
                key={team}
                className="p-4 rounded-2xl"
                style={{
                  background: team === "A" ? "#38bdf81a" : "#f472b61a",
                  border: `1px solid ${team === "A" ? "#38bdf844" : "#f472b644"}`,
                }}
              >
                <div className="text-xs font-bold mb-3 flex items-center justify-between">
                  <span style={{ color: team === "A" ? "#38bdf8" : "#f472b6" }}>
                    {team === "A" ? "⚔️ Jamoa A" : "🛡️ Jamoa B"}
                  </span>
                  <span className="text-gray-500">{members.length}</span>
                </div>
                <div className="space-y-2">
                  {members.map((p) => (
                    <div key={p.tokenIdentifier} className="flex items-center gap-2">
                      <AvatarChip avatar={p.avatar} size={26} heroEquip={p.tokenIdentifier === myToken ? heroEquip : undefined} />
                      <span className="text-sm text-gray-200 truncate">
                        {p.username}
                        {p.tokenIdentifier === myToken && (
                          <span className="ml-1 text-[10px]" style={{ color: t.accent }}>
                            (siz)
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                  {members.length === 0 && <div className="text-xs text-gray-600">Bo'sh...</div>}
                </div>
              </div>
            );
          })}
          {room.players.find((p) => p.tokenIdentifier === myToken) && (
            <div className="sm:col-span-2 flex justify-center">
              <button
                onClick={() => onSwitchTeam(room.players.find((p) => p.tokenIdentifier === myToken)?.team === "A" ? "B" : "A")}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                style={{ background: "#a78bfa22", border: "1px solid #a78bfa55", color: "#a78bfa" }}
              >
                ⇄ Jamoa almashtirish
              </button>
            </div>
          )}
        </div>
      ) : (
        <div
          className="p-4 rounded-2xl"
          style={{ background: t.surface, border: "1px solid #ffffff14" }}
        >
          <div className="grid gap-2">
            {room.players.map((p) => (
              <div key={p.tokenIdentifier} className="flex items-center gap-3">
                <AvatarChip avatar={p.avatar} size={30} heroEquip={p.tokenIdentifier === myToken ? heroEquip : undefined} />
                <span className="text-sm text-gray-200">
                  {p.username}
                  {p.tokenIdentifier === myToken && (
                    <span className="ml-1 text-[10px]" style={{ color: t.accent }}>
                      (siz)
                    </span>
                  )}
                </span>
                {p.tokenIdentifier === room.createdBy && (
                  <span className="ml-auto text-[10px] font-bold text-yellow-400">HOST</span>
                )}
              </div>
            ))}
            {room.players.length === 1 && (
              <div className="text-xs text-gray-600 animate-pulse py-2">
                Raqib kutilmoqda — kodni yuboring: {room.code}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Start */}
      <div
        className="p-5 rounded-2xl text-center"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
      >
        {isHost ? (
          <>
            <button
              onClick={onStart}
              disabled={!enoughPlayers}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 disabled:opacity-40 flex items-center gap-2 mx-auto"
              style={{ background: t.accent, color: "#000" }}
            >
              <FiFlag size={15} /> Jangni boshlash
            </button>
            {!enoughPlayers && (
              <div className="mt-2 text-xs text-gray-500">
                {room.mode === "1v1"
                  ? "Boshlash uchun 2 ta o'yinchi kerak"
                  : "Har ikkala jamoada ham o'yinchi kerak"}
              </div>
            )}
          </>
        ) : (
          <div className="text-sm text-gray-500 animate-pulse">
            Xona egasi jangni boshlashini kuting...
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Countdown
// ══════════════════════════════════════════════════════════════════════
function CountdownView({ t, room, onLeave }: { t: ThemeColors; room: Room; onLeave: () => void }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(iv);
  }, []);
  const left = Math.max(0, Math.ceil(((room.countdownEndsAt ?? 0) - now) / 1000));

  return (
    <div className="text-center py-16 relative">
      <button
        onClick={onLeave}
        className="absolute top-0 right-0 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5"
        style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#fca5a5" }}
      >
        <FiLogOut size={13} /> Chiqish
      </button>
      <div className="text-8xl font-bold animate-bounce" style={{ color: t.accent }} key={left}>
        {left}
      </div>
      <div className="text-gray-400 mt-4">Tayyorlaning!</div>
      <div
        className="mt-6 p-4 rounded-xl text-sm text-gray-500 text-center max-w-xl mx-auto"
        style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
      >
        {room.text}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Racing
// ══════════════════════════════════════════════════════════════════════
function RaceRow({ t, p, isMe, textLen, showTeam, heroEquip }: {
  t: ThemeColors;
  p: RoomPlayer;
  isMe: boolean;
  textLen: number;
  showTeam: boolean;
  heroEquip?: HeroEquip;
}) {
  const pct = progressPct(p.correct, textLen);
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        <AvatarChip avatar={p.avatar} size={24} heroEquip={isMe ? heroEquip : undefined} />
        <span className={`text-xs truncate ${isMe ? "font-bold" : "text-gray-400"}`} style={isMe ? { color: t.accent } : undefined}>
          {p.username}
          {isMe && " (siz)"}
        </span>
        {showTeam && (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: p.team === "A" ? "#38bdf822" : "#f472b622", color: p.team === "A" ? "#38bdf8" : "#f472b6" }}
          >
            {p.team === "A" ? "A" : "B"}
          </span>
        )}
        <span className="ml-auto text-xs font-bold" style={{ color: p.color }}>
          {p.wpm} wpm
        </span>
        <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
        {p.finished && <span className="text-[10px]">🏁</span>}
      </div>
      <div className="h-2.5 rounded-full bg-white/10 relative overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${p.color}, ${p.color}88)`,
            boxShadow: `0 0 10px ${p.color}44`,
          }}
        />
        {isMe && pct > 0 && pct < 100 && (
          <div className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px]">⚡</div>
        )}
      </div>
      {p.typedPreview ? (
        <div
          className="mt-1 text-[10px] text-gray-600 truncate font-mono"
          style={{ fontFamily: "'JetBrains Mono',monospace" }}
        >
          {p.username}: “{p.typedPreview.trimEnd()}...”
        </div>
      ) : (
        <div className="mt-1 text-[10px] text-gray-700 truncate font-mono">…</div>
      )}
    </div>
  );
}

function RaceView({
  t,
  room,
  code,
  myToken,
  myAvatar,
  heroEquip,
  onLeave,
}: {
  t: ThemeColors;
  room: Room;
  code: string;
  myToken: string;
  myAvatar: string;
  heroEquip?: HeroEquip;
  onLeave: () => void;
}) {
  const textLen = room.text.length;
  const sorted = [...room.players].sort((a, b) => b.correct - a.correct);
  const isTeam = room.mode === "team";

  const teamStats = (team: "A" | "B") => {
    const members = room.players.filter((p) => p.team === team);
    const totalCorrect = members.reduce((s, p) => s + p.correct, 0);
    const avgWpm = members.length ? Math.round(members.reduce((s, p) => s + p.wpm, 0) / members.length) : 0;
    const pct = members.length ? progressPct(totalCorrect, textLen * members.length) : 0;
    return { members, totalCorrect, avgWpm, pct };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500 uppercase tracking-widest">Jonli poyga</div>
        <button
          onClick={onLeave}
          className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 flex items-center gap-1.5"
          style={{ background: "#ef444422", border: "1px solid #ef444466", color: "#fca5a5" }}
        >
          <FiLogOut size={13} /> Chiqish
        </button>
      </div>

      {isTeam && (
        <div className="grid sm:grid-cols-2 gap-3">
          {(["A", "B"] as const).map((team) => {
            const s = teamStats(team);
            return (
              <div
                key={team}
                className="p-3 rounded-2xl"
                style={{
                  background: team === "A" ? "#38bdf81a" : "#f472b61a",
                  border: `1px solid ${team === "A" ? "#38bdf844" : "#f472b644"}`,
                }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold" style={{ color: team === "A" ? "#38bdf8" : "#f472b6" }}>
                    {team === "A" ? "⚔️ Jamoa A" : "🛡️ Jamoa B"}
                  </span>
                  <span className="text-xs text-gray-400">{s.avgWpm} wpm</span>
                </div>
                <div className="h-3 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${s.pct}%`,
                      background: team === "A" ? "linear-gradient(90deg,#38bdf8,#38bdf888)" : "linear-gradient(90deg,#f472b6,#f472b688)",
                      boxShadow: `0 0 10px ${team === "A" ? "#38bdf855" : "#f472b655"}`,
                    }}
                  />
                </div>
                <div className="text-right text-xs text-gray-500 mt-1">{s.pct}%</div>
              </div>
            );
          })}
        </div>
      )}

      <TypingArena t={t} text={room.text} code={code} running={room.status === "racing"} />

      {/* Live progress */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
      >
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          {isTeam ? "O'yinchilar" : "Raqib"} progressi
        </div>
        {sorted.map((p) => (
          <RaceRow
            key={p.tokenIdentifier}
            t={t}
            p={p}
            isMe={p.tokenIdentifier === myToken}
            textLen={textLen}
            showTeam={isTeam}
            heroEquip={heroEquip}
          />
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// Natijalar
// ══════════════════════════════════════════════════════════════════════
function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {Array.from({ length: 24 }).map((_, i) => (
        <div
          key={i}
          className="confetti-piece"
          style={{
            left: `${(i * 37) % 100}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDuration: `${1.4 + (i % 5) * 0.35}s`,
            animationDelay: `${(i % 8) * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

function ResultsView({
  t,
  room,
  code,
  myToken,
  heroEquip,
  onRematch,
  onLeave,
}: {
  t: ThemeColors;
  room: Room;
  code: string;
  myToken: string;
  myAvatar: string;
  heroEquip?: HeroEquip;
  onRematch: () => void;
  onLeave: () => void;
}) {
  const [reportTarget, setReportTarget] = useState<RoomPlayer | null>(null);
  const myPlayer = room.players.find((p) => p.tokenIdentifier === myToken);
  const myTeam = myPlayer?.team;
  let outcome: BattleOutcome = "draw";
  if (room.winner === "draw") outcome = "draw";
  else if (room.winner === myTeam) outcome = "win";
  else outcome = "lose";

  const reward = BATTLE_REWARDS[room.mode === "team" ? "team" : "1v1"][outcome];
  const isTeam = room.mode === "team";
  const sorted = [...room.players].sort((a, b) => b.correct - a.correct || b.wpm - a.wpm);

  const teamTotal = (team: "A" | "B") =>
    room.players.filter((p) => p.team === team).reduce((s, p) => s + p.correct, 0);

  return (
    <div className="space-y-4">
      {/* Result card */}
      <div
        className="p-6 rounded-2xl text-center relative overflow-hidden"
        style={{
          background: t.surface,
          border: `2px solid ${
            outcome === "win" ? "#fbbf24" : outcome === "lose" ? "#ef4444" : "#94a3b8"
          }`,
          boxShadow: `0 0 40px ${
            outcome === "win" ? "#fbbf2444" : outcome === "lose" ? "#ef444422" : "transparent"
          }`,
        }}
      >
        {outcome === "win" && <Confetti />}
        <div className="relative">
          <div
            className="text-6xl mb-2 animate-bounce-in"
            style={{ color: outcome === "win" ? "#fbbf24" : outcome === "lose" ? "#ef4444" : "#94a3b8" }}
          >
            {outcome === "win" ? <FaTrophy /> : outcome === "lose" ? <FiFlag /> : <FaMedal />}
          </div>
          <div
            className="text-2xl font-bold text-white animate-pop-in"
            style={{ color: outcome === "win" ? "#fbbf24" : outcome === "lose" ? "#f87171" : "#cbd5e1" }}
          >
            {outcome === "win" ? "VICTORY! 🎉" : outcome === "lose" ? "Defeat" : "Durrang!"}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {isTeam ? "G'olib jamoa: " : "G'olib: "}
            <span className="font-bold" style={{ color: t.accent }}>
              {room.winner === "draw"
                ? "Durrang"
                : isTeam
                ? room.winner === "A"
                  ? "Jamoa A"
                  : "Jamoa B"
                : sorted[0]?.username ?? "?"}
            </span>
          </div>

          {/* Rewards */}
          <div className="flex items-center justify-center gap-3 mt-4">
            <div
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 animate-pop-in"
              style={{ background: "#f59e0b22", border: "1px solid #f59e0b55", color: "#fbbf24" }}
            >
              <CoinIcon size={16} /> +{reward.coins}
            </div>
            <div
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 animate-pop-in"
              style={{ background: "#a78bfa22", border: "1px solid #a78bfa55", color: "#a78bfa" }}
            >
              ⚡ +{reward.xp} XP
            </div>
          </div>
        </div>
      </div>

      {/* Standings */}
      <div
        className="p-4 rounded-2xl"
        style={{ background: t.surface, border: "1px solid #ffffff14" }}
      >
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">
          {isTeam ? "Yakuniy jamoalar" : "Yakuniy natija"}
        </div>

        {isTeam ? (
          <div className="grid sm:grid-cols-2 gap-3 mb-3">
            {(["A", "B"] as const).map((team) => (
              <div
                key={team}
                className="p-3 rounded-xl text-center"
                style={{
                  background: team === "A" ? "#38bdf81a" : "#f472b61a",
                  border: `1px solid ${
                    room.winner === team ? "#fbbf24" : team === "A" ? "#38bdf844" : "#f472b644"
                  }`,
                }}
              >
                <div className="text-xs font-bold mb-1" style={{ color: team === "A" ? "#38bdf8" : "#f472b6" }}>
                  {team === "A" ? "⚔️ Jamoa A" : "🛡️ Jamoa B"}
                  {room.winner === team && <span className="ml-1 text-yellow-400">👑</span>}
                </div>
                <div className="text-xl font-bold text-white">{teamTotal(team)}</div>
                <div className="text-[10px] text-gray-500">to'g'ri belgilar</div>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          {sorted.map((p, i) => (
            <div key={p.tokenIdentifier} className="flex items-center gap-3 text-sm">
              <span className="w-5 text-gray-500 font-bold">{i + 1}.</span>
              <AvatarChip avatar={p.avatar} size={26} heroEquip={p.tokenIdentifier === myToken ? heroEquip : undefined} />
              <span className={p.tokenIdentifier === myToken ? "font-bold" : "text-gray-300"} style={p.tokenIdentifier === myToken ? { color: t.accent } : undefined}>
                {p.username}
                {p.tokenIdentifier === myToken && " (siz)"}
              </span>
              <span className="ml-auto text-xs" style={{ color: p.color }}>
                {p.wpm} wpm
              </span>
              <span className="text-xs text-gray-500">{p.accuracy}%</span>
              <span className="text-xs text-gray-500 w-14 text-right">
                {progressPct(p.correct, room.text.length)}%
              </span>
              <button
                onClick={() => setReportTarget(p)}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title={`${p.username} haqida hisobot yuborish`}
                aria-label={`${p.username} haqida hisobot`}
              >
                <FiFlag size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          onClick={onRematch}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
          style={{ background: t.accent, color: "#000" }}
        >
          <FiRefreshCw size={14} /> Rematch
        </button>
        <button
          onClick={onLeave}
          className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 flex items-center gap-2"
          style={{ background: "#ffffff0d", border: "1px solid #ffffff14", color: "#9ca3af" }}
        >
          <FiLogOut size={14} /> Xonani tark etish
        </button>
      </div>

      {reportTarget && (
        <ReportPlayerModal
          t={t}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// O'yinchi haqida hisobot (report)
// ══════════════════════════════════════════════════════════════════════
const REPORT_REASONS = [
  { value: "cheating", label: "Aldash (cheat / autotyper)" },
  { value: "abuse", label: "Haqorat yoki yomon so'z" },
  { value: "spam", label: "Spam" },
  { value: "impersonation", label: "Boshqa odam nomidan yurish" },
  { value: "other", label: "Boshqa" },
];

function ReportPlayerModal({
  t,
  target,
  onClose,
}: {
  t: ThemeColors;
  target: RoomPlayer;
  onClose: () => void;
}) {
  const fileReport = useMutation(api.admin.fileReport);
  const [reason, setReason] = useState("cheating");
  const [details, setDetails] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await fileReport({
        targetToken: target.tokenIdentifier,
        targetName: target.username,
        reason,
        details: details.trim() || undefined,
      });
      setOk(true);
      window.setTimeout(onClose, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hisobot yuborilmadi");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={busy ? undefined : onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-md rounded-2xl p-5 animate-pop-in"
        style={{ background: t.surface, border: `1px solid ${t.accent}44` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-1">
          <FiFlag size={16} style={{ color: t.accent }} />
          <h3 className="text-sm font-bold text-white">Hisobot yuborish</h3>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          <span className="font-bold text-white">{target.username}</span> haqida shikoyat — admin tekshiradi.
        </p>

        {ok ? (
          <div className="text-center py-6 text-sm text-green-400 animate-pop-in">
            ✓ Hisobot yuborildi. Rahmat!
          </div>
        ) : (
          <>
            <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Sabab</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none mb-3"
              style={{ background: "#ffffff08", border: "1px solid #ffffff14", color: "#fff" }}
            >
              {REPORT_REASONS.map((r) => (
                <option key={r.value} value={r.value} className="bg-[#0b1626] text-white">
                  {r.label}
                </option>
              ))}
            </select>

            <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Tafsilot (ixtiyoriy)</label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              placeholder="Nima bo'ldi?"
              className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-y mb-3"
              style={{ background: "#ffffff08", border: "1px solid #ffffff14", color: "#fff" }}
            />

            {error && (
              <div className="mb-3 px-3 py-2 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
                {error}
              </div>
            )}

            <div className="flex gap-2 justify-end">
              <button
                onClick={onClose}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5 transition-all disabled:opacity-40"
              >
                Bekor qilish
              </button>
              <button
                onClick={submit}
                disabled={busy}
                className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: t.accent, color: "#000" }}
              >
                {busy ? "Yuborilmoqda..." : "Yuborish"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
