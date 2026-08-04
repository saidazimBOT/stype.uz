"use client";

import {
  FiCalendar, FiCode, FiCpu, FiGlobe, FiHeart, FiInfo, FiSend, FiStar, FiUser, FiZap,
} from "react-icons/fi";
import { FaKeyboard, FaMedal, FaPalette, FaTrophy } from "react-icons/fa6";
import type { IconType } from "react-icons";
import type { ThemeColors } from "../../types";
import AppLogo from "../AppLogo";

interface OwnerViewProps {
  t: ThemeColors;
  onClose: () => void;
}

// Sayt egasi ma'lumotlari
const OWNER = {
  name: "Saidazim",
  role: "Dasturchi",
  photo: "/creator.png",
  born: "2011-yil",
  birthday: "27-may",
  age: "15 yosh",
  tg: "@said_khujayev",
  tgUrl: "https://t.me/said_khujayev",
};

// Sayt haqida — nima haqda, nimalar bor
const SITE_FACTS: [IconType, string, string][] = [
  [FiZap, "Tezlik testi", "15s / 30s / 60s / Free rejimlarda WPM va aniqlikni o'lchaydi"],
  [FiGlobe, "20+ til", "UZ / RU / EN / DE / FR va boshqa tillarda mashq"],
  [FaPalette, "25+ tema", "Premium hamda VS Code uslubidagi chiroyli dizaynlar"],
  [FiCpu, "AI mashqlar", "Sun'iy intellekt yordamida shaxsiy mashqlar"],
  [FaTrophy, "Reytinglar", "Global va mamlakat bo'yicha liderlik jadvali"],
  [FiSend, "Multiplayer poyga", "Boshqa foydalanuvchilar bilan real vaqtda poyga"],
  [FaMedal, "Missions & Events", "Haftalik missiyalar va mavsumiy tadbirlar"],
  [FaKeyboard, "Mini o'yinlar", "Snake, Tetris va Flappy Bird"],
];

export default function OwnerView({ t, onClose }: OwnerViewProps) {
  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiUser style={{ color: t.accent }} />
          Sayt egasi
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 transition-all"
        >
          ← Orqaga
        </button>
      </div>

      {/* ── Owner profile card ── */}
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
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Photo */}
          <div
            className="relative w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden flex-shrink-0 animate-bounce-in"
            style={{ border: `2px solid ${t.accent}66`, boxShadow: `0 0 30px ${t.accent}40` }}
          >
            <img
              src={OWNER.photo}
              alt={`${OWNER.name} — sayt egasi`}
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left flex-1 min-w-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-2"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}55` }}
            >
              <FiStar size={11} />
              STypeUz · Yaratuvchi
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white">{OWNER.name}</h3>
            <p className="text-sm mt-1" style={{ color: t.accent }}>
              Website Creator / {OWNER.role}
            </p>
            <p className="text-xs text-gray-500 mt-2 flex items-center justify-center sm:justify-start gap-1.5">
              <FiCalendar size={12} /> {OWNER.birthday} {OWNER.born} · {OWNER.age}
            </p>
          </div>
        </div>

        {/* Info chips */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Tug'ilgan", value: OWNER.born },
            { label: "Tug'ilgan kun", value: OWNER.birthday },
            { label: "Kasb", value: OWNER.role },
          ].map((c) => (
            <div
              key={c.label}
              className="p-3 rounded-xl text-center animate-row"
              style={{ background: "#ffffff08", border: "1px solid #ffffff12" }}
            >
              <div className="text-base font-bold" style={{ color: t.accent }}>
                {c.value}
              </div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{c.label}</div>
            </div>
          ))}
        </div>

        {/* Bio */}
        <div className="mt-5 space-y-3">
          <p className="text-sm leading-relaxed text-gray-300">
            Salom! Men <strong className="text-white">{OWNER.name}</strong> — bu saytning yaratuvchisiman.
            Men <strong className="text-white">{OWNER.age}</strong>daman va{" "}
            <strong className="text-white">{OWNER.role}</strong> sifatida{" "}
            <strong className="text-white">STypeUz</strong> platformasini yaratdim. Bu sayt —{" "}
            <strong style={{ color: t.accent }}>yozish tezligini oshirish</strong> uchun yaratilgan
            bepul platforma: foydalanuvchilar bu yerda tezlik (WPM), aniqlik (accuracy) va klaviatura
            ko'nikmalarini mashq qilib yaxshilashadi.
          </p>
          <p className="text-sm leading-relaxed text-gray-400">
            Men faqat shu saytni emas, kelajakda yana ko'plab loyihalar yaratishni rejalashtiryapman.
            Savollar, takliflar yoki hamkorlik uchun Telegram orqali bog'lanishingiz mumkin!
          </p>
        </div>
      </div>

      {/* ── Sayt haqida ── */}
      <div className="mt-6">
        <div className="flex items-center gap-2 font-semibold text-white mb-3">
          <FiInfo style={{ color: t.accent }} />
          Sayt nima haqida?
        </div>
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: "linear-gradient(135deg,#0b1626,#0a1120)", border: "1px solid #ffffff14" }}
        >
          <div className="flex items-center gap-3 mb-3">
            <AppLogo size={40} animate="glow" glowColor={t.accent} />
            <div>
              <div className="font-bold text-white">STypeUz</div>
              <div className="text-xs text-gray-500">
                Fast. Beautiful. Yours. — yozish tezligi testi va mashq platformasi
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            <strong className="text-white">STypeUz</strong> — bu klaviaturada{" "}
            <strong style={{ color: t.accent }}>tez va xatosiz yozishni</strong> o'rganish uchun bepul
            platforma. Siz bu yerda yozish tezligingizni o'lchaysiz, mashq qilasiz, boshqalar bilan
            poygalashasiz va o'z natijalaringizni kuzatib borasiz.
          </p>
        </div>

        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3">Saytda nimalar bor</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {SITE_FACTS.map(([Icon, title, desc]) => (
            <div
              key={title}
              className="flex items-start gap-3 p-3 rounded-xl border border-white/10 animate-row"
              style={{ background: "#ffffff06" }}
            >
              <span
                className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: t.accent + "1f", color: t.accent }}
              >
                <Icon size={16} />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white">{title}</div>
                <div className="text-[11px] text-gray-500 leading-relaxed">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Contact ── */}
      <div
        className="mt-6 rounded-2xl p-5 text-center"
        style={{ background: "#ffffff05", border: "1px solid #229ed933" }}
      >
        <div className="text-sm text-gray-400 mb-3">
          Savol yoki taklifingiz bormi? Telegram orqali yozing 👇
        </div>
        <a
          href={OWNER.tgUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
          style={{ background: "#229ed9", color: "#fff" }}
        >
          <FiSend />
          {OWNER.tg}
        </a>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-gray-600 flex items-center justify-center gap-1.5">
        Made with <FiHeart size={12} className="text-red-400" /> by {OWNER.name} · STypeUz ·{" "}
        <FiCode size={12} /> Next.js + TypeScript
      </div>
    </div>
  );
}
