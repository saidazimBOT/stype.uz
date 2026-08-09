"use client";

import { useMemo } from "react";
import {
  FiActivity, FiAward, FiCalendar, FiClock, FiCrosshair, FiGlobe, FiSun, FiZap,
} from "react-icons/fi";
import { FaDna } from "react-icons/fa6";
import type { DailyState, ReplayRecording, TestResult, ThemeColors } from "../../types";
import { buildDnaProfile } from "../../data/typingDna";
import { getT } from "../../data/i18n";

interface TypingDNAProps {
  t: ThemeColors;
  lang: string;
  onClose: () => void;
  history: TestResult[];
  recordings: ReplayRecording[];
  daily: DailyState;
  usedLangs: string[];
}

const DNA_COLORS: Record<string, string> = {
  A: "#22d3ee",
  T: "#a78bfa",
  C: "#4ade80",
  G: "#f59e0b",
};

function DnaString({ dna }: { dna: string }) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-sm sm:text-base tracking-[0.2em] select-none">
      {dna.split("-").map((group, gi) => (
        <span key={gi} className="flex gap-1">
          {group.split("").map((ch, i) => (
            <span key={i} style={{ color: DNA_COLORS[ch] || "#22d3ee", textShadow: `0 0 10px ${DNA_COLORS[ch] || "#22d3ee"}66` }}>
              {ch}
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}

function Barcode({ bars, t }: { bars: number[]; t: ThemeColors }) {
  return (
    <div className="flex items-end justify-center gap-[3px] h-16 w-full max-w-md mx-auto" aria-hidden>
      {bars.map((h, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm transition-all hover:opacity-70"
          style={{
            height: `${Math.round(h * 100)}%`,
            background: `linear-gradient(180deg, ${t.accent}, #a78bfa)`,
            opacity: 0.5 + h * 0.5,
          }}
        />
      ))}
    </div>
  );
}

function TraitBar({ label, value, color, hint }: { label: string; value: number; color: string; hint: string }) {
  return (
    <div className="p-3.5 rounded-xl border border-white/10 animate-row" style={{ background: "#ffffff06" }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-200">{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full animate-statbar"
          style={{ width: `${value}%`, background: `linear-gradient(90deg, ${color}66, ${color})` }}
        />
      </div>
      <div className="text-[10px] text-gray-600 mt-1.5">{hint}</div>
    </div>
  );
}

export default function TypingDNA({ t, lang, onClose, history, recordings, daily, usedLangs }: TypingDNAProps) {
  const T = getT(lang);
  const dna = useMemo(
    () => buildDnaProfile(history, recordings, daily, usedLangs),
    [history, recordings, daily, usedLangs]
  );

  const statCards = dna.ready
    ? [
        { label: T("dna.tests"), value: String(dna.stats.tests), icon: FiActivity, color: t.accent },
        { label: T("dna.avgWpm"), value: String(dna.stats.avgWpm), icon: FiZap, color: "#a78bfa" },
        { label: T("dna.bestWpm"), value: String(dna.stats.bestWpm), icon: FiAward, color: "#f59e0b" },
        { label: T("dna.accuracy"), value: dna.stats.avgAcc + "%", icon: FiCrosshair, color: "#22c55e" },
        { label: T("dna.streak"), value: String(dna.stats.streak), icon: FiCalendar, color: "#38bdf8" },
        { label: T("dna.activeDays"), value: String(dna.stats.totalLogins), icon: FiSun, color: "#f472b6" },
      ]
    : [];

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaDna style={{ color: t.accent }} />
          Typing DNA
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 transition-all">
          {T("owner.back")}
        </button>
      </div>

      {!dna.ready ? (
        /* ── Bo'sh holat ── */
        <div
          className="rounded-3xl p-10 text-center animate-fade-in"
          style={{ background: t.surface, border: `1px solid ${t.accent}22` }}
        >
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: t.accent + "1f", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FaDna size={30} />
          </div>
          <div className="text-lg font-bold text-white mb-2">{T("dna.emptyTitle")}</div>
          <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            {T("dna.emptyDesc")}
          </p>
          <button
            onClick={onClose}
            className="mt-6 px-6 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: t.accent, color: "#000" }}
          >
            {T("dna.backToTest")}
          </button>
        </div>
      ) : (
        <>
          {/* ── HERO: DNK karta ── */}
          <div
            className="relative overflow-hidden rounded-3xl p-6 sm:p-8 mb-6 animate-fade-in"
            style={{
              background: "linear-gradient(160deg, #0b1626, #070e1b)",
              border: `1px solid ${t.accent}44`,
              boxShadow: `0 0 50px ${t.accent}1a`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-1"
              style={{ background: `linear-gradient(90deg, ${t.accent}, #a78bfa, #4ade80)` }}
            />
            <div className="text-center">
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mb-3 animate-bounce-in"
                style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}55` }}
              >
                <FaDna size={11} />
                {dna.archetype.name} · {dna.dnaString.length > 4 ? "raqamli imzo" : ""}
              </div>

              {/* DNK chizig'i */}
              <DnaString dna={dna.dnaString} />
              <div className="my-4">
                <Barcode bars={dna.bars} t={t} />
              </div>
              <div className="text-[10px] text-gray-600 font-mono tracking-widest">
                {dna.dnaString.replace(/-/g, "")} · {dna.bars.length} segment · noyob
              </div>

              {/* Arxetip */}
              <div className="mt-5">
                <div className="text-4xl mb-1 animate-bounce-in">{dna.archetype.icon}</div>
                <div className="text-xl font-extrabold text-white">{dna.archetype.name}</div>
                <p className="text-xs text-gray-400 max-w-md mx-auto mt-1.5 leading-relaxed">{dna.archetype.desc}</p>
              </div>
            </div>
          </div>

          {/* ── Stat kartalar ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-6">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="p-3 rounded-xl transition-all hover:scale-[1.03] animate-row"
                style={{ background: t.surface, border: `1px solid ${s.color}22` }}
              >
                <s.icon size={13} style={{ color: s.color }} className="mb-1.5" />
                <div className="text-lg font-bold text-white">{s.value}</div>
                <div className="text-[9px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* ── Xususiyatlar ── */}
          <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FiActivity style={{ color: t.accent }} />
            {T("dna.styleTraits")}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
            {dna.traits.map((tr) => (
              <TraitBar key={tr.key} label={tr.label} value={tr.value} color={tr.color} hint={tr.hint} />
            ))}
          </div>

          {/* ── Ritm + Xatolar ── */}
          <div className="grid lg:grid-cols-2 gap-4 mb-6">
            {/* Ritm */}
            <div className="p-5 rounded-2xl animate-fade-in" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
                <FiClock style={{ color: t.accent }} />
                {T("dna.rhythm")}
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-lg font-bold" style={{ color: t.accent }}>
                    {dna.rhythm.avgInterval ? `${dna.rhythm.avgInterval}ms` : "—"}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{T("dna.avgInterval")}</div>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-lg font-bold" style={{ color: "#a78bfa" }}>
                    {dna.rhythm.burstWpm ? `${dna.rhythm.burstWpm}` : "—"}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{T("dna.burstWpm")}</div>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-lg font-bold" style={{ color: "#f59e0b" }}>
                    {dna.rhythm.cv ? `${dna.rhythm.cv}%` : "—"}
                  </div>
                  <div className="text-[9px] text-gray-500 mt-0.5">{T("dna.variability")}</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-600 mt-3 leading-relaxed">
                {dna.rhythm.cv <= 25 && dna.rhythm.cv > 0
                  ? T("dna.rhythmMetronome")
                  : dna.rhythm.cv > 40
                    ? T("dna.rhythmBursty")
                    : dna.rhythm.avgInterval
                      ? T("dna.rhythmAverage")
                      : T("dna.rhythmNoData")}
              </p>
            </div>

            {/* Xato xaritasi */}
            <div className="p-5 rounded-2xl animate-fade-in" style={{ background: t.surface, border: `1px solid ${t.accent}1a` }}>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-4">
                <FiCrosshair style={{ color: t.accent }} />
                {T("dna.errorMap")}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full ml-auto"
                  style={{ background: "#ef44441f", color: "#ef4444", border: "1px solid #ef444433" }}
                  title="O'rtacha xato darajasi"
                >
                  ~{dna.stats.errorRate}% xato
                </span>
              </div>
              {dna.errorKeys.length === 0 ? (
                <div className="text-center py-6 text-sm text-gray-600">
                  {recordings.length
                    ? T("dna.noErrors")
                    : T("dna.noErrorData")}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {dna.errorKeys.map((e, i) => {
                    const max = dna.errorKeys[0].count;
                    return (
                      <div key={e.key} className="flex items-center gap-3 row-in" style={{ animationDelay: `${i * 50}ms` }}>
                        <span className="w-7 h-7 rounded-lg flex items-center justify-center font-mono text-xs font-bold flex-shrink-0" style={{ background: "#ef44441f", color: "#ef4444", border: "1px solid #ef444444" }}>
                          {e.key === " " ? "␣" : e.key}
                        </span>
                        <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className="h-full rounded-full bar-fill"
                            style={{ width: `${(e.count / max) * 100}%`, background: "linear-gradient(90deg, #ef444466, #ef4444)" }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-6 text-right">{e.count}×</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Afzalliklar ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mb-6">
            {[
              { icon: FiZap, label: T("dna.prefMode"), value: dna.prefDuration, color: t.accent },
              { icon: FiGlobe, label: T("dna.prefLang"), value: dna.prefLang, color: "#38bdf8" },
              { icon: FiSun, label: T("dna.activeTime"), value: dna.activeHour >= 0 ? `${String(dna.activeHour).padStart(2, "0")}:00` : "—", color: "#f59e0b" },
            ].map((c) => (
              <div key={c.label} className="p-3.5 rounded-xl flex items-center gap-3 animate-row" style={{ background: "#ffffff06", border: "1px solid #ffffff10" }}>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.color + "1f", color: c.color }}>
                  <c.icon size={15} />
                </span>
                <div className="min-w-0">
                  <div className="text-[10px] text-gray-500">{c.label}</div>
                  <div className="text-sm font-semibold text-white truncate">{c.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* ── Xulosa ── */}
          <div
            className="rounded-2xl p-5 text-sm leading-relaxed animate-fade-in"
            style={{ background: "linear-gradient(160deg, #0b1626, #070e1b)", border: `1px solid ${t.accent}33` }}
          >
            <div className="flex items-center gap-2 font-bold text-white mb-2">
              <FaDna style={{ color: t.accent }} />
              {T("dna.analysis")}
            </div>
            <p className="text-gray-400">{dna.summary}</p>
          </div>
        </>
      )}
    </div>
  );
}
