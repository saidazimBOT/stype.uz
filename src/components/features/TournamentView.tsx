"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { FaTrophy, FaMedal, FaCrown, FaUsers, FaClock, FaCoins, FaPlay, FaCheck, FaArrowLeft, FaFire } from "react-icons/fa6";
import { FiAward, FiPlus, FiTrash2 } from "react-icons/fi";
import type { ThemeColors, Tournament, TournamentParticipant, TournamentViewProps, TournamentStatus, TournamentMode } from "../../types";
import {
  listTournaments,
  getTournament,
  joinTournament,
  submitTournamentResult,
  getTournamentResults,
  createTournament,
  deleteTournament,
  ensureDailyTournaments,
} from "../../lib/tournamentDb";
import { getCurrentUserId } from "../../lib/db";
import { supabase } from "../../lib/supabase";

const MODE_CONFIG: Record<TournamentMode, { icon: string; label: string; color: string; desc: string }> = {
  sprint: { icon: "⚡", label: "Sprint", color: "#f59e0b", desc: "Eng yuqori WPM — 15 soniya" },
  marathon: { icon: "🏃", label: "Marathon", color: "#38bdf8", desc: "60 soniyada eng ko'p so'z" },
  accuracy: { icon: "🎯", label: "Accuracy", color: "#22c55e", desc: "Eng yuqori aniqlik" },
  endless: { icon: "∞", label: "Endless", color: "#a78bfa", desc: "Cheksiz — o'z tempingizda" },
};

const STATUS_TABS: { id: TournamentStatus | "all"; label: string; icon: string }[] = [
  { id: "active", label: "Active", icon: "🔴" },
  { id: "upcoming", label: "Upcoming", icon: "⏳" },
  { id: "finished", label: "Finished", icon: "✅" },
  { id: "all", label: "All", icon: "📋" },
];

// ── COUNTDOWN TIMER ──────────────────────────────────────────────────
function Countdown({ targetTime, label }: { targetTime: number; label: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const tick = () => {
      const diff = targetTime - Date.now();
      if (diff <= 0) { setTimeLeft("0s"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setTimeLeft(`${h}h ${m}m`);
      else if (m > 0) setTimeLeft(`${m}m ${s}s`);
      else setTimeLeft(`${s}s`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);
  return (
    <span className="text-xs text-gray-400 flex items-center gap-1">
      <FaClock size={10} /> {label}: {timeLeft}
    </span>
  );
}

// ── TOURNAMENT CARD ──────────────────────────────────────────────────
function TournamentCard({
  tournament,
  t,
  onSelect,
  onJoin,
  canJoin,
}: {
  tournament: Tournament;
  t: ThemeColors;
  onSelect: () => void;
  onJoin: () => void;
  canJoin: boolean;
}) {
  const mode = MODE_CONFIG[tournament.mode] || MODE_CONFIG.sprint;
  const isActive = tournament.status === "active";
  const isUpcoming = tournament.status === "upcoming";
  const isFinished = tournament.status === "finished";

  return (
    <div
      className="p-4 rounded-xl transition-all hover:scale-[1.01] cursor-pointer"
      style={{
        background: isActive ? t.surface : "transparent",
        border: `1px solid ${isActive ? t.accent + "44" : isUpcoming ? "#ffffff14" : "#ffffff0a"}`,
      }}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        {/* Mode icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: mode.color + "22", border: `1px solid ${mode.color}44` }}
        >
          {mode.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-white truncate">{tournament.title}</h3>
            {isActive && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse"
                style={{ background: "#ef444422", color: "#ef4444" }}>
                LIVE
              </span>
            )}
            {isUpcoming && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "#f59e0b22", color: "#f59e0b" }}>
                SOON
              </span>
            )}
            {isFinished && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: "#22c55e22", color: "#22c55e" }}>
                DONE
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{tournament.description}</p>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: mode.color + "22", color: mode.color }}>
              {mode.label}
            </span>
            <span className="text-xs text-gray-500">
              🌐 {tournament.lang.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">
              ⏱ {tournament.duration}s
            </span>
            <span className="text-xs text-gray-500 flex items-center gap-1">
              <FaUsers size={10} /> {tournament.participantCount}
            </span>
            {tournament.prizeCoins > 0 && (
              <span className="text-xs flex items-center gap-1" style={{ color: "#fbbf24" }}>
                <FaCoins size={10} /> {tournament.prizeCoins}
              </span>
            )}
          </div>
        </div>
        {/* Action button */}
        <div className="flex flex-col items-end gap-1">
          {isUpcoming && (
            <Countdown targetTime={tournament.startTime} label="Starts" />
          )}
          {isActive && canJoin && !tournament.isJoined && (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(); }}
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all hover:scale-105"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
            >
              <FaPlay size={10} /> Join
            </button>
          )}
          {isActive && tournament.isJoined && (
            <span className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
              style={{ background: "#22c55e22", color: "#22c55e" }}>
              <FaCheck size={10} /> Joined
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── TOURNAMENT DETAIL ────────────────────────────────────────────────
function TournamentDetail({
  tournament,
  t,
  onBack,
  onJoin,
  onPlay,
}: {
  tournament: Tournament;
  t: ThemeColors;
  onBack: () => void;
  onJoin: () => void;
  onPlay: () => void;
}) {
  const [results, setResults] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const mode = MODE_CONFIG[tournament.mode] || MODE_CONFIG.sprint;
  const isActive = tournament.status === "active";
  const isUpcoming = tournament.status === "upcoming";
  const medalColors = ["#fbbf24", "#cbd5e1", "#d97706"];

  useEffect(() => {
    setLoading(true);
    getTournamentResults(tournament.id)
      .then(setResults)
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, [tournament.id]);

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all">
          <FaArrowLeft size={16} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{mode.icon}</span>
            <h2 className="text-xl font-bold text-white">{tournament.title}</h2>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{tournament.description}</p>
        </div>
        <div className="text-right">
          {isActive && (
            <Countdown targetTime={tournament.endTime} label="Ends" />
          )}
          {isUpcoming && (
            <Countdown targetTime={tournament.startTime} label="Starts" />
          )}
          {tournament.status === "finished" && (
            <span className="text-xs text-green-500">Finished</span>
          )}
        </div>
      </div>

      {/* Tournament Info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <div className="text-xs text-gray-500 mb-1">Mode</div>
          <div className="text-sm font-bold" style={{ color: mode.color }}>{mode.label}</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <div className="text-xs text-gray-500 mb-1">Language</div>
          <div className="text-sm font-bold text-white">🌐 {tournament.lang.toUpperCase()}</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <div className="text-xs text-gray-500 mb-1">Duration</div>
          <div className="text-sm font-bold text-white">⏱ {tournament.duration}s</div>
        </div>
        <div className="p-3 rounded-xl" style={{ background: t.surface, border: `1px solid ${t.accent}22` }}>
          <div className="text-xs text-gray-500 mb-1">Prize</div>
          <div className="text-sm font-bold" style={{ color: "#fbbf24" }}>🪙 {tournament.prizeCoins}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 mb-6">
        {isUpcoming && !tournament.isJoined && (
          <button
            onClick={onJoin}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FaPlay size={14} /> Turnirga Qo'shilish
          </button>
        )}
        {isUpcoming && tournament.isJoined && (
          <div className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "#22c55e11", color: "#22c55e", border: "1px solid #22c55e33" }}>
            <FaCheck size={14} /> Qo'shilgansiz — Kuting
          </div>
        )}
        {isActive && tournament.isJoined && (
          <button
            onClick={onPlay}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] animate-pulse"
            style={{ background: t.accent, color: "#000" }}
          >
            <FaPlay size={14} /> Yozishni Boshlash!
          </button>
        )}
        {isActive && !tournament.isJoined && (
          <button
            onClick={onJoin}
            className="flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FaPlay size={14} /> Hozir Qo'shilish
          </button>
        )}
      </div>

      {/* Results Leaderboard */}
      <div>
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <FaTrophy size={14} /> Turnir Natijalari
          <span className="text-xs text-gray-500 font-normal">({results.length} ishtirokchi)</span>
        </h3>
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : results.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            {isActive ? "Hozircha natijalar yo'q — yozing!" : "Natijalar yo'q"}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {results.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                style={{
                  background: i < 3 ? t.surface : "transparent",
                  border: i < 3 ? `1px solid ${t.accent}22` : "1px solid transparent",
                }}
              >
                <div className="text-center w-8">
                  {i < 3 ? (
                    <FaMedal size={18} style={{ color: medalColors[i] }} className="mx-auto" />
                  ) : (
                    <span className="text-sm text-gray-600">{i + 1}</span>
                  )}
                </div>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ background: p.color + "22", color: p.color }}
                >
                  {p.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white flex items-center gap-1.5">
                    {p.username}
                    {i === 0 && <FaCrown size={10} style={{ color: "#fbbf24" }} />}
                  </div>
                  <div className="text-xs text-gray-500">
                    {p.accuracy}% accuracy · {p.time}s
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold" style={{ color: p.color }}>
                    {p.wpm}
                  </div>
                  <div className="text-[10px] text-gray-600">WPM</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN TOURNAMENT VIEW ─────────────────────────────────────────────
export default function TournamentView({ t, onClose, history }: TournamentViewProps) {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [filter, setFilter] = useState<TournamentStatus | "all">("active");
  const [loading, setLoading] = useState(true);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playedResult, setPlayedResult] = useState<{ wpm: number; accuracy: number } | null>(null);

  // Load tournaments
  const loadTournaments = useCallback(async () => {
    setLoading(true);
    try {
      await ensureDailyTournaments();
      const data = await listTournaments();
      setTournaments(data);
    } catch {
      setTournaments([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadTournaments();
    getCurrentUserId().then(setUserId);
  }, [loadTournaments]);

  // Join tournament
  const handleJoin = useCallback(async (tournamentId: string) => {
    const ok = await joinTournament(tournamentId);
    if (ok) {
      setTournaments((prev) =>
        prev.map((t) =>
          t.id === tournamentId
            ? { ...t, isJoined: true, participantCount: t.participantCount + 1 }
            : t
        )
      );
      if (selectedTournament?.id === tournamentId) {
        setSelectedTournament((prev) => prev ? { ...prev, isJoined: true, participantCount: prev.participantCount + 1 } : prev);
      }
    }
  }, [selectedTournament]);

  // Play tournament
  const handlePlay = useCallback((tournament: Tournament) => {
    // Turnirda yozish — foydalanuvchi asosiy typing view'ga o'tkaziladi
    // va natija turnirga yoziladi
    setIsPlaying(true);
    setSelectedTournament(tournament);
  }, []);

  // Handle play completion — from App.tsx natija qaytishi
  const handlePlayComplete = useCallback(async (tournamentId: string, result: { wpm: number; accuracy: number; errors: number; correct: number; total: number; time: number }) => {
    await submitTournamentResult(tournamentId, result);
    setPlayedResult({ wpm: result.wpm, accuracy: result.accuracy });
    setIsPlaying(false);
    // Natijalarni qayta yuklaymiz
    const data = await listTournaments();
    setTournaments(data);
  }, []);

  const filtered = tournaments.filter((t) => filter === "all" || t.status === filter);

  // ── RENDER ──
  // Agar turnir o'ynalayotgan bo'lsa — typing ga qaytish
  if (isPlaying && selectedTournament) {
    return null; // App.tsx ga qaytadi, u yerda typing boshlanadi
  }

  // Agar natija ko'rsatilayotgan bo'lsa
  if (playedResult && selectedTournament) {
    return (
      <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
        <div className="text-center animate-fade-in py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h2 className="text-2xl font-bold text-white mb-2">Turnir Natijasi!</h2>
          <p className="text-sm text-gray-500 mb-6">{selectedTournament.title}</p>
          <div className="flex justify-center gap-8 mb-8">
            <div>
              <div className="text-4xl font-bold" style={{ color: t.accent }}>{playedResult.wpm}</div>
              <div className="text-xs text-gray-500">WPM</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-white">{playedResult.accuracy}%</div>
              <div className="text-xs text-gray-500">Accuracy</div>
            </div>
          </div>
          <button
            onClick={() => { setPlayedResult(null); setSelectedTournament(null); loadTournaments(); }}
            className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105"
            style={{ background: t.accent + "22", color: t.accent }}
          >
            Turnirlarga Qaytish
          </button>
        </div>
      </div>
    );
  }

  // Agar batafsil ko'rilsa
  if (selectedTournament) {
    return (
      <TournamentDetail
        tournament={selectedTournament}
        t={t}
        onBack={() => setSelectedTournament(null)}
        onJoin={() => handleJoin(selectedTournament.id)}
        onPlay={() => handlePlay(selectedTournament)}
      />
    );
  }

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FaTrophy />
            Turnirlar
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {tournaments.length} turnir · {tournaments.filter((t) => t.status === "active").length} active
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadTournaments}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            title="Yangilash"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {STATUS_TABS.map((tab) => {
          const count = tab.id === "all"
            ? tournaments.length
            : tournaments.filter((t) => t.status === tab.id).length;
          return (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="px-4 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1.5"
              style={{
                background: filter === tab.id ? t.accent + "22" : "transparent",
                color: filter === tab.id ? t.accent : "#6b7280",
                border: `1px solid ${filter === tab.id ? t.accent + "44" : "transparent"}`,
              }}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {count > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                  style={{
                    background: filter === tab.id ? t.accent + "33" : "#ffffff0d",
                    color: filter === tab.id ? t.accent : "#6b7280",
                  }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tournament List */}
      {loading ? (
        <div className="text-center text-gray-500 py-12">
          <div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full mx-auto mb-3" style={{ borderColor: t.accent + "33", borderTopColor: t.accent }} />
          Turnirlar yuklanmoqda...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🏟️</div>
          <p className="text-gray-500 text-sm">
            {filter === "active" ? "Hozircha faol turnir yo'q" : "Turnirlar topilmadi"}
          </p>
          <p className="text-gray-600 text-xs mt-1">Tez orada yangi turnirlar bo'ladi!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {filtered.map((tournament) => (
            <TournamentCard
              key={tournament.id}
              tournament={tournament}
              t={t}
              onSelect={() => setSelectedTournament(tournament)}
              onJoin={() => handleJoin(tournament.id)}
              canJoin={!!userId}
            />
          ))}
        </div>
      )}

      {/* Create Tournament Modal (Admin) */}
      {showCreateModal && (
        <CreateTournamentModal t={t} onClose={() => setShowCreateModal(false)} onCreated={loadTournaments} />
      )}
    </div>
  );
}

// ── CREATE TOURNAMENT MODAL ──────────────────────────────────────────
function CreateTournamentModal({
  t,
  onClose,
  onCreated,
}: {
  t: ThemeColors;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [mode, setMode] = useState<TournamentMode>("sprint");
  const [lang, setLang] = useState("en");
  const [duration, setDuration] = useState(15);
  const [prizeCoins, setPrizeCoins] = useState(50);
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const now = Date.now();
      const startTime = now + 5 * 60 * 1000; // 5 daqiqadan keyin
      const endTime = startTime + (duration || 60) * 1000 + 5 * 60 * 1000;
      await createTournament({
        title: title.trim(),
        description: description.trim() || `${mode} turniri — ${lang.toUpperCase()}`,
        mode,
        lang,
        duration,
        startTime,
        endTime,
        prizeCoins,
      });
      onCreated();
      onClose();
    } catch {
      // Xato
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 animate-fade-in"
        style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FiPlus size={18} /> Yangi Turnir Yaratish
        </h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Nomi</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/20"
              placeholder="Turnir nomi..."
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Tavsif</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none focus:border-white/20"
              placeholder="Qisqacha tavsif..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Rejim</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as TournamentMode)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="sprint">⚡ Sprint</option>
                <option value="marathon">🏃 Marathon</option>
                <option value="accuracy">🎯 Accuracy</option>
                <option value="endless">∞ Endless</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Til</label>
              <select
                value={lang}
                onChange={(e) => setLang(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="en">🇬🇧 English</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbekcha</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Davomiylik (soniya)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Mukofot (🪙)</label>
              <input
                type="number"
                value={prizeCoins}
                onChange={(e) => setPrizeCoins(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg text-sm text-white bg-white/5 border border-white/10 focus:outline-none"
                min={0}
              />
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-gray-400 hover:bg-white/5"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] disabled:opacity-50"
            style={{ background: t.accent, color: "#000" }}
          >
            {saving ? "Yaratilmoqda..." : "Yaratish"}
          </button>
        </div>
      </div>
    </div>
  );
}
