"use client";

import { FiExternalLink, FiGlobe, FiX } from "react-icons/fi";
import { FaBullhorn, FaLanguage, FaGraduationCap } from "react-icons/fa6";
import type { ThemeColors } from "../../types";

// Lingohub.uz — reklama qilinadigan sayt
const LINGOHUB_URL = "https://lingohub.uz";
const LINGOHUB_NAME = "lingohub.uz";

interface LingohubPromoProps {
  t: ThemeColors;
  onClose: () => void;
}

// ── Lingohub logosi (kumush/metal uslubidagi nutq pufakchasi + LH) ────
function LingohubLogo({ size = 132 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size * 1.08}
      viewBox="0 0 100 108"
      className="animate-bounce-in drop-shadow-2xl"
      aria-hidden
    >
      <defs>
        <linearGradient id="lhRing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="35%" stopColor="#64748b" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="72%" stopColor="#475569" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id="lhMetal" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f1f5f9" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        <radialGradient id="lhInner" cx="0.35" cy="0.3" r="1.1">
          <stop offset="0%" stopColor="#2b3c58" />
          <stop offset="70%" stopColor="#0d1a2e" />
          <stop offset="100%" stopColor="#081120" />
        </radialGradient>
      </defs>

      {/* Nutq pufakchasi dumi */}
      <path d="M 28 84 L 46 84 L 33 100 Z" fill="url(#lhRing)" />
      {/* Metall halqa */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#lhRing)" strokeWidth="10" />
      <circle cx="50" cy="50" r="41" fill="url(#lhInner)" stroke="#ffffff2b" strokeWidth="1" />

      {/* Signal to'lqinlari */}
      <path d="M 13 76 Q 13 50 13 24" stroke="url(#lhMetal)" strokeWidth="4" strokeLinecap="round" opacity="0.55" fill="none" />
      <path d="M 21 70 Q 21 50 21 30" stroke="url(#lhMetal)" strokeWidth="4" strokeLinecap="round" opacity="0.75" fill="none" />
      <path d="M 29 64 Q 29 50 29 36" stroke="url(#lhMetal)" strokeWidth="4" strokeLinecap="round" opacity="1" fill="none" />

      {/* LH monogramma */}
      <text
        x="50"
        y="63"
        textAnchor="middle"
        fontFamily="'Inter', sans-serif"
        fontWeight="800"
        fontSize="36"
        fill="url(#lhMetal)"
      >
        LH
      </text>

      {/* Yorqin akslar (lens flare) */}
      <circle cx="82" cy="15" r="9" fill="#ffffff3d" />
      <circle cx="82" cy="15" r="3.5" fill="#ffffff" opacity="0.95">
        <animate attributeName="opacity" values="0.95;0.45;0.95" dur="2.2s" repeatCount="indefinite" />
      </circle>
      <circle cx="16" cy="30" r="2" fill="#ffffff" opacity="0.7">
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// Xususiyatlar (sayt haqida qisqa ma'lumot)
const FEATURES: { emoji: string; title: string; desc: string }[] = [
  { emoji: "🌍", title: "27 ta til", desc: "Dunyo tillarini bitta platformada o'rganing" },
  { emoji: "💸", title: "100% bepul", desc: "Barcha til kurslari mutlaqo tekin" },
  { emoji: "🎓", title: "Online kurs", desc: "Tayyor interaktiv darslar va mashqlar" },
  { emoji: "🚀", title: "Tez natija", desc: "Har kuni mashq qiling — tezda gapira boshlang" },
];

export default function LingohubPromo({ t, onClose }: LingohubPromoProps) {
  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaBullhorn style={{ color: t.accent }} />
          Reklama · Hamkorlik
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 transition-all"
        >
          ← Orqaga
        </button>
      </div>

      {/* ── HERO KARTA ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-center animate-fade-in"
        style={{
          background: "linear-gradient(170deg, #14263f 0%, #0d1a2e 55%, #081120 100%)",
          border: "1px solid #7dd3fc44",
          boxShadow: "0 0 60px #38bdf822",
        }}
      >
        {/* Dekorativ chiziq */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: "linear-gradient(90deg, #cbd5e1, #e2e8f0, #94a3b8, #e2e8f0, #cbd5e1)" }}
        />
        {/* Suzuvchi yulduzchalar */}
        {["10%", "22%", "80%", "90%"].map((left, i) => (
          <span
            key={i}
            className="absolute text-sky-200/80 sparkle-float pointer-events-none"
            style={{
              left,
              top: ["16%", "72%", "14%", "70%"][i],
              fontSize: ["14px", "10px", "12px", "15px"][i],
              animationDelay: `${i * 0.45}s`,
            }}
          >
            ✦
          </span>
        ))}

        {/* Logo */}
        <div className="mb-4 inline-block">
          <LingohubLogo />
        </div>

        {/* Sayt nomi — bosilganda saytga o'tadi */}
        <a
          href={LINGOHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block chrome-text text-4xl sm:text-5xl font-extrabold tracking-tight transition-all hover:scale-105 active:scale-95"
          title={`${LINGOHUB_NAME} saytiga o'tish`}
        >
          {LINGOHUB_NAME.toUpperCase()}
        </a>

        {/* "REKLAMA" belgisi */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold mt-4"
          style={{ background: "#7dd3fc1f", border: "1px solid #7dd3fc55", color: "#7dd3fc" }}
        >
          <FaBullhorn size={11} />
          REKLAMA · HOMIY SAYT
        </div>

        {/* Tavsif */}
        <p className="text-sm text-gray-300 leading-relaxed max-w-lg mx-auto mt-4">
          <strong className="text-white">Lingohub</strong> —{" "}
          <strong style={{ color: "#7dd3fc" }}>27 tilda bepul til o'rganish</strong>{" "}
          platformasi. Ingliz, nemis, fransuz, yapon, koreys kabi tillarni{" "}
          <strong className="text-white">interaktiv online kurslar</strong> va mashqlar orqali
          oson va qiziqarli o'rganing. Har qanday yoshdagi o'quvchi uchun mo'ljallangan — tez,
          qulay va mutlaqo bepul!
        </p>

        {/* Asosiy tugma — bosilganda saytga o'tadi */}
        <a
          href={LINGOHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl font-extrabold text-sm mt-6 transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(120deg, #38bdf8, #818cf8)",
            color: "#041018",
            boxShadow: "0 0 30px #38bdf866",
          }}
        >
          <FiExternalLink size={16} />
          {LINGOHUB_NAME} saytiga o'tish
        </a>
        <div className="text-[11px] text-gray-500 mt-3 flex items-center justify-center gap-1">
          <FiGlobe size={11} />
          Tugmani bosganingizda sayt yangi oynada ochiladi
        </div>
      </div>

      {/* ── XUSUSIYATLAR ── */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="flex items-start gap-3 p-4 rounded-2xl border border-white/10 animate-row transition-all hover:border-sky-400/40 hover:bg-white/[0.07]"
            style={{ background: "#ffffff06" }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "#38bdf81f", border: "1px solid #38bdf855" }}
            >
              {f.emoji}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{f.title}</div>
              <div className="text-[11px] text-gray-400 leading-relaxed mt-0.5">{f.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── NEGA LINGOHUB? ── */}
      <div
        className="mt-6 rounded-2xl p-5"
        style={{ background: "#ffffff05", border: "1px solid #ffffff14" }}
      >
        <div className="flex items-center gap-2 font-medium text-sm mb-3" style={{ color: t.accent }}>
          <FaLanguage size={14} />
          Nega aynan Lingohub?
        </div>
        <ul className="space-y-2 text-xs text-gray-400">
          {[
            "27 xil tildan birini tanlang — o'zingizga mosini topasiz.",
            "Interaktiv darslar: so'z boyligi, grammatika va talaffuz mashqlari.",
            "Internetga ulangan holda istalgan qurilmada, istalgan vaqtda o'rganing.",
            "Kurslar bepul — ro'yxatdan o'tib, darhol boshlang.",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="mt-0.5 flex-shrink-0" style={{ color: t.accent }}>
                <FiGlobe size={12} />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      {/* ── YAKUNIY CTA ── */}
      <a
        href={LINGOHUB_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-4 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
        style={{
          background: "#38bdf818",
          border: "1px solid #38bdf855",
          color: "#7dd3fc",
        }}
      >
        <FaGraduationCap size={16} />
        Hozir o'rganishni boshlang — {LINGOHUB_NAME}
        <FiExternalLink size={14} />
      </a>

      {/* Yopish */}
      <button
        onClick={onClose}
        className="mt-4 mx-auto flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-300 transition-all"
      >
        <FiX size={12} />
        Reklamani yopish
      </button>
    </div>
  );
}
