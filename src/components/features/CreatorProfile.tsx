"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiActivity, FiAward, FiCalendar, FiCode, FiCrosshair, FiStar,
  FiTrendingUp, FiUser, FiX, FiZap,
} from "react-icons/fi";
import { FaKeyboard } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ThemeColors, TestResult } from "../../types";

// ── Creator data ─────────────────────────────────────────────────────────
const CREATOR = {
  name: "Saidazim",
  age: 15,
  dob: "27 May 2011",
  role: "Website Creator / Developer",
  photo: "/creator.png",
};

const ACCENT = "#38bdf8";
const ACCENT_SOFT = "#7dd3fc";

interface CreatorSection {
  icon: IconType;
  title: string;
  desc: string;
}

const SECTIONS: CreatorSection[] = [
  { icon: FiZap, title: "Typing Test", desc: "Timed tests — 15s, 30s, 60s or endless free mode" },
  { icon: FiTrendingUp, title: "WPM", desc: "Live words-per-minute feedback on every keystroke" },
  { icon: FiCrosshair, title: "Accuracy", desc: "Precision tracking with instant error highlighting" },
  { icon: FiAward, title: "Daily Challenge", desc: "A fresh challenge every day with XP rewards" },
  { icon: FiStar, title: "Personal Best", desc: "Push your record and watch your best WPM climb" },
  { icon: FiActivity, title: "Statistics", desc: "Charts & insights across your whole test history" },
  { icon: FaKeyboard, title: "Typing Practice", desc: "Sharpen keyboard skills in 20+ languages" },
];

const CODE_LINES = [
  { indent: 0, color: "#7dd3fc", text: "const creator = {" },
  { indent: 1, color: "#a5b4fc", text: "name: 'Saidazim'," },
  { indent: 1, color: "#86efac", text: "role: 'Developer'," },
  { indent: 1, color: "#fbbf24", text: "wpm: 125," },
  { indent: 1, color: "#e879f9", text: "accuracy: '98%'," },
  { indent: 1, color: "#86efac", text: "loves: 'typing'," },
  { indent: 0, color: "#7dd3fc", text: "};" },
  { indent: 1, color: "#94a3b8", text: "// keep typing..." },
];

const KEYS = ["E", "R", "T", "Y", "U", "D", "F", "G", "H", "J", "X", "C", "B", "N"];

const CHART = [35, 55, 40, 70, 60, 85, 75, 100, 90, 110, 100, 125];

interface CreatorProfileProps {
  t: ThemeColors;
  history?: TestResult[];
}

export default function CreatorProfile({ t, history }: CreatorProfileProps) {
  const [open, setOpen] = useState(false);

  const bestWpm = useMemo(
    () => (history && history.length ? Math.max(...history.map((h) => h.wpm)) : 0),
    [history]
  );
  const testsCount = history?.length ?? 0;

  // Esc to close + body scroll lock
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      {/* ── CREATOR STUDIO SCENE ───────────────────────────────────── */}
      <section
        className="relative rounded-3xl overflow-hidden border border-white/10 select-none"
        style={{ background: "linear-gradient(160deg,#0a1628 0%,#071020 55%,#060d1a 100%)" }}
      >
        {/* ambient glows */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-30 pointer-events-none" style={{ background: ACCENT }} />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ background: "#818cf8" }} />
        <div className="absolute inset-0 opacity-[0.07] pointer-events-none studio-grid" />

        <div className="relative p-4 sm:p-6 flex flex-col lg:flex-row gap-4 sm:gap-6">
          {/* Left: code editor + stats */}
          <div className="hidden md:flex lg:w-64 flex-col gap-4">
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0b1220cc" }}>
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-400/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-green-400/80" />
                <span className="ml-2 text-[10px] text-gray-500 font-mono">creator.ts</span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed min-h-[200px]">
                {CODE_LINES.map((l, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="text-gray-600 w-4 text-right shrink-0">{i + 1}</span>
                    <span className="whitespace-pre" style={{ color: l.color, paddingLeft: l.indent * 12 }}>
                      {l.text}
                    </span>
                  </div>
                ))}
                <span className="inline-block w-2 h-4 mt-0.5 animate-caret" style={{ background: ACCENT }} />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-3 space-y-2.5" style={{ background: "#0b1220cc" }}>
              <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider">
                <span>WPM</span>
                <span className="font-bold" style={{ color: ACCENT_SOFT }}>125</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full animate-statbar" style={{ background: ACCENT, width: "82%" }} />
              </div>
              <div className="flex justify-between text-[10px] text-gray-500 uppercase tracking-wider">
                <span>Accuracy</span>
                <span className="font-bold text-emerald-300">98%</span>
              </div>
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full animate-statbar" style={{ background: "#22d3ee", width: "98%" }} />
              </div>
              <div className="flex items-end gap-1 h-10 pt-1">
                {CHART.map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm animate-eq"
                    style={{
                      height: `${(h / 125) * 100}%`,
                      background: "linear-gradient(180deg,#22d3ee,#38bdf8)",
                      animationDelay: `${i * 0.08}s`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Center: monitor with the photo */}
          <div className="flex-1 min-w-0">
            <div className="relative rounded-2xl border border-white/10 overflow-hidden shadow-2xl" style={{ background: "#000" }}>
              <img
                src={CREATOR.photo}
                alt={`${CREATOR.name} — creator of STypeUz in his workspace`}
                className="w-full aspect-[3/2] object-cover block"
                draggable={false}
              />
              {/* realistic lighting, untouched photo */}
              <div className="absolute inset-0 pointer-events-none creator-light" />
              <div className="absolute inset-0 pointer-events-none creator-scan" />

              {/* floating stat chips */}
              <div className="absolute top-3 left-3 glass-chip animate-float-slow">
                <div className="text-[9px] text-gray-400 uppercase">WPM</div>
                <div className="text-sm font-bold" style={{ color: ACCENT_SOFT }}>125</div>
              </div>
              <div className="absolute top-3 right-3 glass-chip animate-float-slow" style={{ animationDelay: "1.2s" }}>
                <div className="text-[9px] text-gray-400 uppercase">Accuracy</div>
                <div className="text-sm font-bold text-emerald-300">98%</div>
              </div>
              <div className="absolute bottom-16 right-3 glass-chip animate-float-slow" style={{ animationDelay: "2.1s" }}>
                <div className="text-[9px] text-gray-400 uppercase">Time</div>
                <div className="text-sm font-bold text-white">60s</div>
              </div>

              {/* bottom gradient + button */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
              <button
                onClick={() => setOpen(true)}
                className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm font-bold text-[#041018] transition-all hover:scale-105 active:scale-95 cursor-pointer creator-btn"
                style={{ background: "linear-gradient(135deg,#22d3ee,#38bdf8)" }}
              >
                <FiUser size={15} />
                Sayt egasi haqida
              </button>
            </div>

            {/* RGB keyboard strip */}
            <div
              className="mt-3 sm:mt-4 rounded-xl border border-white/10 p-2.5 sm:p-3 overflow-hidden relative"
              style={{ background: "#0b1220cc" }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-40"
                style={{
                  background: "linear-gradient(90deg,#f472b6,#22d3ee,#a78bfa,#38bdf8)",
                  backgroundSize: "300% 100%",
                  animation: "rgbSlide 6s linear infinite",
                }}
              />
              <div className="relative flex justify-center gap-1 sm:gap-1.5 flex-wrap">
                {KEYS.map((k, i) => (
                  <span key={k} className="kbd-key" style={{ animationDelay: `${i * 0.12}s` }}>
                    {k}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Right: live typing-test mini UI */}
          <div className="hidden lg:flex lg:w-56 flex-col gap-4">
            <div className="rounded-xl border border-white/10 overflow-hidden" style={{ background: "#0b1220cc" }}>
              <div className="px-3 py-2 border-b border-white/10 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-gray-500">Typing Test</span>
                <span className="text-[10px] font-mono animate-blink flex items-center gap-1" style={{ color: ACCENT_SOFT }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  live
                </span>
              </div>
              <div className="p-3 font-mono text-[11px] leading-relaxed">
                <div className="text-gray-600">the quick</div>
                <div>
                  <span className="text-white">brown </span>
                  <span style={{ color: ACCENT_SOFT }}>fox</span>
                  <span className="text-gray-600"> jumps</span>
                </div>
                <div className="text-gray-600">over the lazy dog</div>
                <div className="mt-2 flex items-center gap-1 text-[9px] text-gray-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  typing...
                </div>
              </div>
              <div className="px-3 py-2 border-t border-white/10 grid grid-cols-2 gap-2 text-[10px]">
                <div>
                  <div className="text-gray-500">WPM</div>
                  <div className="font-bold" style={{ color: ACCENT_SOFT }}>125</div>
                </div>
                <div>
                  <div className="text-gray-500">ACC</div>
                  <div className="font-bold text-emerald-300">98%</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-3" style={{ background: "#0b1220cc" }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FiAward size={11} style={{ color: ACCENT_SOFT }} />
                Daily Challenge
              </div>
              <div className="text-xs text-gray-300">Type 125 WPM in 60s</div>
              <div className="mt-2 flex gap-0.5">
                {[0, 1, 2, 3, 4].map((i) => (
                  <span key={i} className="text-[10px]" style={{ color: i < 4 ? "#fbbf24" : "#374151" }}>
                    ★
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-white/10 p-3" style={{ background: "#0b1220cc" }}>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 mb-1.5 flex items-center gap-1.5">
                <FiStar size={11} style={{ color: ACCENT_SOFT }} />
                Personal Best
              </div>
              <div className="text-lg font-bold" style={{ color: ACCENT_SOFT }}>
                {bestWpm || 125}
                <span className="text-[10px] text-gray-500 ml-1 font-normal">WPM</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CREATOR PROFILE MODAL ──────────────────────────────────── */}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Sayt egasi haqida"
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 animate-profile-in creator-modal"
            style={{ background: "linear-gradient(180deg,#0b1626,#070e1b)" }}
          >
            {/* top glow accent */}
            <div className="absolute top-0 left-0 right-0 h-1" style={{ background: "linear-gradient(90deg,#22d3ee,#38bdf8,#818cf8)" }} />

            <div className="relative p-6 sm:p-8">
              <button
                onClick={() => setOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
                aria-label="Close"
              >
                <FiX size={18} />
              </button>

              {/* header */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                <div
                  className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0"
                  style={{ border: "2px solid #38bdf866", boxShadow: "0 0 30px rgba(56,189,248,.35)" }}
                >
                  <img src={CREATOR.photo} alt={CREATOR.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
                </div>
                <div className="text-center sm:text-left flex-1 min-w-0">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-2"
                    style={{ background: "#38bdf822", color: ACCENT_SOFT, border: "1px solid #38bdf855" }}
                  >
                    <FiCode size={11} />
                    STypeUz · Creator
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{CREATOR.name}</h3>
                  <p className="text-sm mt-1" style={{ color: ACCENT_SOFT }}>
                    {CREATOR.role}
                  </p>
                  <p className="text-xs text-gray-500 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
                    <FiCalendar size={12} />
                    {CREATOR.dob} · {CREATOR.age} years old
                  </p>
                </div>
              </div>

              {/* bio */}
              <div className="mt-6 space-y-3">
                <p className="text-sm leading-relaxed text-gray-300">
                  Salom! Men <strong className="text-white">{CREATOR.name}</strong> — {CREATOR.age} yoshdaman va bu
                  saytning yaratuvchisiman.{" "}
                  <strong className="text-white">STypeUz</strong> — bu{" "}
                  <strong style={{ color: ACCENT_SOFT }}>yozish tezligini oshirish</strong> uchun yaratilgan platforma:
                  foydalanuvchilar bu yerda tezlik (WPM), aniqlik (accuracy) va klaviatura ko'nikmalarini mashq qilib
                  yaxshilashi mumkin.
                </p>
                <p className="text-sm leading-relaxed text-gray-400">
                  I'm the creator of this typing website — a typing-speed practice platform where users can improve
                  their typing speed, accuracy, WPM and keyboard skills. Built with Next.js, TypeScript and Tailwind.
                </p>
              </div>

              {/* feature sections */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {SECTIONS.map((s, i) => (
                  <div
                    key={s.title}
                    className="flex items-start gap-3 p-3 rounded-xl border border-white/10 animate-row"
                    style={{ background: "#ffffff06", animationDelay: `${i * 70}ms` }}
                  >
                    <span
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: "#38bdf81f", color: ACCENT_SOFT }}
                    >
                      <s.icon size={16} />
                    </span>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white">{s.title}</div>
                      <div className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* footer stats */}
              <div className="mt-6 grid grid-cols-3 gap-2.5">
                {[
                  { label: "Personal Best", value: bestWpm ? `${bestWpm}` : "125", unit: "WPM" },
                  { label: "Tests Completed", value: `${testsCount}`, unit: "" },
                  { label: "Age", value: `${CREATOR.age}`, unit: "years" },
                ].map((s) => (
                  <div key={s.label} className="p-3 rounded-xl text-center" style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}>
                    <div className="text-xl font-bold" style={{ color: ACCENT_SOFT }}>
                      {s.value}
                    </div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{s.label}</div>
                    {s.unit && <div className="text-[10px] text-gray-600">{s.unit}</div>}
                  </div>
                ))}
              </div>

              <div className="mt-6 text-center text-xs text-gray-600">
                Made with <span className="text-red-400">♥</span> by {CREATOR.name} · STypeUz
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
