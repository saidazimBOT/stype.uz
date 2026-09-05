"use client";
import { useState, useCallback } from "react";
import type { ThemeColors, Tournament, TournamentMode } from "../../types";
import { FaTrophy, FaMedal, FaClock, FaUsers, FaCoins, FaPlay, FaCheck, FaTrash, FaGift } from "react-icons/fa6";
import { FiPlus, FiRefreshCw } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, StatCard, PrimaryBtn, TextInput, Field } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import {
  listTournaments,
  createTournament,
  deleteTournament,
  getTournamentResults,
  distributeTournamentRewards,
} from "../../lib/tournamentDb";

const MODE_CONFIG: Record<TournamentMode, { icon: string; label: string; color: string }> = {
  sprint: { icon: "⚡", label: "Sprint", color: "#f59e0b" },
  marathon: { icon: "🏃", label: "Marathon", color: "#38bdf8" },
  accuracy: { icon: "🎯", label: "Accuracy", color: "#22c55e" },
  endless: { icon: "∞", label: "Endless", color: "#a78bfa" },
};

function formatTime(ts: number) {
  if (!ts) return "—";
  const d = new Date(ts);
  return d.toLocaleDateString("en", { month: "short", day: "numeric" }) + " " +
    d.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    upcoming: { bg: "#f59e0b22", color: "#f59e0b", label: "⏳ Upcoming" },
    active: { bg: "#ef444422", color: "#ef4444", label: "🔴 Active" },
    finished: { bg: "#22c55e22", color: "#22c55e", label: "✅ Finished" },
  };
  const c = cfg[status] || cfg.upcoming;
  return (
    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: c.bg, color: c.color }}>
      {c.label}
    </span>
  );
}

export default function TournamentsSection({ t }: { t: ThemeColors }) {
  const { data: tournaments, loading, refetch } = useSupabaseQuery(() => listTournaments(), []);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // ── Create tournament ──
  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formMode, setFormMode] = useState<TournamentMode>("sprint");
  const [formLang, setFormLang] = useState("en");
  const [formDuration, setFormDuration] = useState(15);
  const [formPrize, setFormPrize] = useState(50);

  const handleCreate = async () => {
    if (!formTitle.trim()) return;
    const now = Date.now();
    const startTime = now + 5 * 60 * 1000;
    const endTime = startTime + (formDuration || 60) * 1000 + 5 * 60 * 1000;
    await createTournament({
      title: formTitle.trim(),
      description: formDesc.trim() || `${formMode} turniri`,
      mode: formMode,
      lang: formLang,
      duration: formDuration,
      startTime,
      endTime,
      prizeCoins: formPrize,
    });
    setFormTitle("");
    setFormDesc("");
    setShowCreate(false);
    setMsg("✅ Turnir yaratildi!");
    refetch();
    setTimeout(() => setMsg(""), 3000);
  };

  // ── Delete tournament ──
  const handleDelete = async (id: string) => {
    if (!confirm("Turnirni o'chirmoqchimisiz?")) return;
    setBusyId(id);
    await deleteTournament(id);
    setMsg("🗑 Turnir o'chirildi");
    refetch();
    setBusyId(null);
    setTimeout(() => setMsg(""), 3000);
  };

  // ── Distribute rewards ──
  const handleDistributeRewards = async (id: string) => {
    setBusyId(id);
    try {
      const result = await distributeTournamentRewards(id);
      if (result.winners.length > 0) {
        const winnerText = result.winners.map((w) => `${w.username} +${w.coins} 🪙`).join(", ");
        setMsg(`🏆 Mukofotlar tarqatildi: ${winnerText}`);
      } else if (result.distributed) {
        setMsg("Turnir yakunlandi — ishtirokchilar yo'q yoki natijalar mavjud emas");
      } else {
        setMsg("Turnir hali tugamagan yoki allaqachon tarqatilgan");
      }
    } catch {
      setMsg("❌ Xatolik yuz berdi");
    }
    refetch();
    setBusyId(null);
    setTimeout(() => setMsg(""), 4000);
  };

  // Stats
  const total = tournaments?.length || 0;
  const active = tournaments?.filter((t) => t.status === "active").length || 0;
  const upcoming = tournaments?.filter((t) => t.status === "upcoming").length || 0;
  const finished = tournaments?.filter((t) => t.status === "finished").length || 0;
  const totalPrize = tournaments?.reduce((sum, t) => sum + (t.prizeCoins || 0), 0) || 0;

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FaTrophy}
        title="Turnirlarni boshqarish"
        subtitle={total ? `${total} ta turnir` : undefined}
        actions={
          <>
            <button onClick={() => refetch()}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
              title="Yangilash">
              <FiRefreshCw size={14} />
            </button>
            <PrimaryBtn t={t} onClick={() => setShowCreate(!showCreate)}>
              <FiPlus size={12} /> Yangi turnir
            </PrimaryBtn>
          </>
        }
      />

      {msg && (
        <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
          {msg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard t={t} icon={FaTrophy} label="Jami" value={total} color="#a78bfa" />
        <StatCard t={t} icon={FaPlay} label="Faol" value={active} color="#ef4444" />
        <StatCard t={t} icon={FaClock} label="Kutilayotgan" value={upcoming} color="#f59e0b" />
        <StatCard t={t} icon={FaCheck} label="Tugagan" value={finished} color="#22c55e" />
      </div>

      {/* Create Form */}
      {showCreate && (
        <Card t={t} className="p-5">
          <SectionHeader t={t} icon={FiPlus} title="Yangi turnir yaratish" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Field t={t} label="Nomi">
              <TextInput t={t} value={formTitle} onChange={setFormTitle} placeholder="Turnir nomi..." accent />
            </Field>
            <Field t={t} label="Tavsif">
              <TextInput t={t} value={formDesc} onChange={setFormDesc} placeholder="Qisqacha tavsif..." />
            </Field>
            <Field t={t} label="Rejim">
              <select
                value={formMode}
                onChange={(e) => setFormMode(e.target.value as TournamentMode)}
                className="w-full px-3 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="sprint">⚡ Sprint</option>
                <option value="marathon">🏃 Marathon</option>
                <option value="accuracy">🎯 Accuracy</option>
                <option value="endless">∞ Endless</option>
              </select>
            </Field>
            <Field t={t} label="Til">
              <select
                value={formLang}
                onChange={(e) => setFormLang(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value="en">🇬🇧 English</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 O'zbekcha</option>
              </select>
            </Field>
            <Field t={t} label="Davomiylik (soniya)">
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 focus:outline-none"
              >
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>60s</option>
              </select>
            </Field>
            <Field t={t} label="Mukofot (🪙 coin)">
              <TextInput t={t} value={String(formPrize)} onChange={(v) => setFormPrize(Number(v) || 0)} type="number" accent />
            </Field>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={() => setShowCreate(false)}
              className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5">
              Bekor qilish
            </button>
            <PrimaryBtn t={t} onClick={handleCreate} disabled={!formTitle.trim()}>
              <FiPlus size={12} /> Yaratish
            </PrimaryBtn>
          </div>
        </Card>
      )}

      {/* Tournament List */}
      <SectionHeader t={t} icon={FaTrophy} title="Barcha turnirlar" />
      {loading ? (
        <Spinner t={t} />
      ) : !tournaments || tournaments.length === 0 ? (
        <EmptyState t={t} title="Turnirlar yo'q" desc="Yangi turnir yarating" />
      ) : (
        <div className="space-y-2">
          {tournaments.map((tr) => {
            const mode = MODE_CONFIG[tr.mode] || MODE_CONFIG.sprint;
            const isBusy = busyId === tr.id;
            return (
              <Card key={tr.id} t={t} className="p-4">
                <div className="flex items-center gap-3">
                  {/* Mode icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ background: mode.color + "22", border: `1px solid ${mode.color}44` }}
                  >
                    {mode.icon}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-white truncate">{tr.title}</h3>
                      <StatusBadge status={tr.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap text-[11px] text-gray-500">
                      <span>{mode.label}</span>
                      <span>🌐 {tr.lang.toUpperCase()}</span>
                      <span>⏱ {tr.duration}s</span>
                      <span className="flex items-center gap-1"><FaUsers size={9} /> {tr.participantCount}</span>
                      {tr.prizeCoins > 0 && (
                        <span className="flex items-center gap-1" style={{ color: "#fbbf24" }}>
                          <FaCoins size={9} /> {tr.prizeCoins}
                        </span>
                      )}
                      <span>{formatTime(tr.startTime)}</span>
                    </div>
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {(tr.status === "finished") && (
                      <button
                        onClick={() => handleDistributeRewards(tr.id)}
                        disabled={isBusy}
                        className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50"
                        style={{ background: "#fbbf2422", color: "#fbbf24", border: "1px solid #fbbf2444" }}
                        title="G'oliblarga coin berish"
                      >
                        <FaGift size={10} /> {isBusy ? "..." : "Mukofot"}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(tr.id)}
                      disabled={isBusy}
                      className="p-2 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                      title="O'chirish"
                    >
                      <FaTrash size={13} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
