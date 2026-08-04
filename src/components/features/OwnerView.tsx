"use client";

import {
  FiCalendar, FiCode, FiHeart, FiMail, FiStar, FiUser, FiZap,
} from "react-icons/fi";
import {
  FaCss3Alt, FaHtml5, FaJs, FaKeyboard, FaPython, FaReact, FaTelegram, FaTrophy,
} from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ThemeColors } from "../../types";

interface OwnerViewProps {
  t: ThemeColors;
  onClose: () => void;
}

// ── Portfolio ma'lumotlari ─────────────────────────────────────────────
const ME = {
  name: "Saidazim",
  role: "Dasturchi",
  photo: "/creator.png",
  born: "2011-yil",
  birthday: "27-may",
  age: "15 yosh",
  tg: "@said_khujayev",
  tgUrl: "https://t.me/said_khujayev",
  tagline: "Men kichik yoshimdan kod yozishga qiziqaman va o'z loyihalarimni yarataman.",
};

// Ko'nikmalar (skill) — real darajalar bilan
const SKILLS: { icon: IconType; name: string; level: number; color: string }[] = [
  { icon: FaPython, name: "Python", level: 85, color: "#4b8bbe" },
  { icon: FaHtml5, name: "HTML", level: 90, color: "#e34c26" },
  { icon: FaCss3Alt, name: "CSS", level: 80, color: "#2965f1" },
  { icon: FaJs, name: "JavaScript", level: 75, color: "#f0db4f" },
  { icon: FaReact, name: "React / Next.js", level: 70, color: "#61dafb" },
  { icon: FaKeyboard, name: "Tez yozish (Typing)", level: 92, color: "#22d3ee" },
];

// Loyihalar
const PROJECTS: { name: string; desc: string; tech: string; tag: string }[] = [
  { name: "STypeUz", desc: "Yozish tezligini oshirish platformasi — 20+ til, 25+ tema, reytinglar, o'yinlar, multiplayer poyga.", tech: "Next.js · TS · Tailwind", tag: "Asosiy loyiha" },
  { name: "Yangi loyihalar...", desc: "Kelajakdagi loyihalarim shu yerda ko'rinadi. Kod yozishda davom etaman!", tech: "Python · JS · React", tag: "Tez kunda" },
];

export default function OwnerView({ t, onClose }: OwnerViewProps) {
  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiUser style={{ color: t.accent }} />
          Portfolio
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 transition-all"
        >
          ← Orqaga
        </button>
      </div>

      {/* ── HERO: katta rasm + yonida ma'lumotlar ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-8 animate-fade-in"
        style={{
          background: "linear-gradient(160deg, #0b1626, #070e1b)",
          border: `1px solid ${t.accent}44`,
          boxShadow: `0 0 50px ${t.accent}1a`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg,#22d3ee,#38bdf8,#818cf8)" }}
        />
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          {/* Katta rasm */}
          <div
            className="relative w-40 h-52 sm:w-48 sm:h-60 rounded-2xl overflow-hidden flex-shrink-0 animate-bounce-in"
            style={{ border: `2px solid ${t.accent}66`, boxShadow: `0 0 34px ${t.accent}40` }}
          >
            <img
              src={ME.photo}
              alt={`${ME.name} — dasturchi`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-bold whitespace-nowrap"
              style={{ background: "#041018cc", border: `1px solid ${t.accent}66`, color: t.accent }}
            >
              {ME.role} 👨‍💻
            </div>
          </div>

          {/* Yonidagi ma'lumotlar */}
          <div className="text-center md:text-left flex-1 min-w-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-2"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}55` }}
            >
              <FiStar size={11} />
              STypeUz · Yaratuvchi
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-white">{ME.name}</h3>
            <p className="text-sm mt-1 font-medium" style={{ color: t.accent }}>
              {ME.role} / Website Creator
            </p>

            {/* Info chips — rasm yonida */}
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-2">
              {[
                { icon: FiCalendar, label: "27-may 2011" },
                { icon: FiStar, label: "15 yosh" },
                { icon: FiCode, label: "Dasturchi" },
              ].map((c) => (
                <span
                  key={c.label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-300 animate-row"
                  style={{ background: "#ffffff08", border: "1px solid #ffffff14" }}
                >
                  <c.icon size={12} style={{ color: t.accent }} />
                  {c.label}
                </span>
              ))}
            </div>

            <p className="text-sm text-gray-400 leading-relaxed mt-4">
              {ME.tagline} Hozirda{" "}
              <strong className="text-white">STypeUz</strong> — yozish tezligini oshirish
              platformasini yaratdim. Kelajakda yana ko'plab foydali loyihalar yaratishni
              rejalashtiryapman.
            </p>
          </div>
        </div>
      </div>

      {/* ── KO'NIKMALAR ── */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FiZap style={{ color: t.accent }} />
          Ko'nikmalar
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SKILLS.map((s) => (
            <div
              key={s.name}
              className="p-3 rounded-xl border border-white/10 animate-row"
              style={{ background: "#ffffff06" }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-2 text-sm text-gray-200">
                  <s.icon size={16} style={{ color: s.color }} />
                  {s.name}
                </span>
                <span className="text-xs font-bold" style={{ color: t.accent }}>
                  {s.level}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full animate-statbar"
                  style={{ width: `${s.level}%`, background: `linear-gradient(90deg, ${t.accent}, ${s.color})` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── LOYIHALAR ── */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FaTrophy style={{ color: t.accent }} />
          Loyihalarim
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PROJECTS.map((p) => (
            <div
              key={p.name}
              className="p-4 rounded-xl border border-white/10 animate-row"
              style={{ background: "#ffffff06" }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="font-semibold text-white">{p.name}</div>
                <span
                  className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                  style={{ background: t.accent + "22", color: t.accent }}
                >
                  {p.tag}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{p.desc}</p>
              <div className="text-[10px] mt-2" style={{ color: t.accent }}>
                {p.tech}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── KONTAKT ── */}
      <div
        className="mt-6 rounded-2xl p-5 text-center"
        style={{ background: "#ffffff05", border: "1px solid #229ed933" }}
      >
        <div className="text-sm text-gray-400 mb-3">
          Savol, taklif yoki hamkorlik? Telegram orqali yozing 👇
        </div>
        <div className="flex items-center justify-center gap-3 flex-wrap">
          <a
            href={ME.tgUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: "#229ed9", color: "#fff" }}
          >
            <FaTelegram size={15} />
            {ME.tg}
          </a>
          <a
            href={`mailto:${ME.tg.replace("@", "")}@gmail.com`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
            style={{ background: "#ffffff0d", border: "1px solid #ffffff1f", color: "#e5e7eb" }}
          >
            <FiMail size={15} />
            Email
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-600 flex items-center justify-center gap-1.5 flex-wrap">
        Made with <FiHeart size={12} className="text-red-400" /> by {ME.name} · STypeUz
      </div>
    </div>
  );
}
