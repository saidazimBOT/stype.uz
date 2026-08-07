"use client";

import { useEffect, useRef, useState } from "react";

import {
  FiBookOpen, FiCalendar, FiChevronLeft, FiChevronRight, FiCode, FiHeart, FiMail, FiStar, FiUser, FiUsers, FiX, FiZap, FiZoomIn,
} from "react-icons/fi";
import {
  FaAward, FaCertificate, FaCss3Alt, FaHtml5, FaJs, FaKeyboard, FaMedal, FaPython, FaReact, FaRocket, FaTelegram, FaTrophy,
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
  mentor: "Sunnatbek Yusupov",
  photo: "/saidazim-stypeuz-developer.webp",
  born: "2011-yil",
  birthday: "27-may",
  age: "15 yosh",
  tg: "@said_khujayev",
  tgUrl: "https://t.me/said_khujayev",
  tagline: "Men kichik yoshimdan kod yozishga qiziqaman va o'z loyihalarimni yarataman.",
};

// ── Guruh ma'lumotlari ────────────────────────────────────────────────
const GROUP = {
  name: "NF-2957",
  members: [
    { name: "Yusuf", role: "Jamoa sardori", emoji: "👑" },
    { name: "Akbar", role: "Dizayner", emoji: "🎨" },
    { name: "Shaxriyor", role: "Backend", emoji: "⚙️" },
    { name: "Zafar", role: "Geymer", emoji: "🎮" },
    { name: "Saidazim", role: "Frontend · Yaratuvchi", emoji: "👨‍💻" },
    { name: "Mirzohid", role: "Analitik", emoji: "📊" },
  ],
  mentor: "Sunnatbek Yusupov",
};

// ── Lightbox galereyasi (guruh + ustoz rasmlari) ──────────────────────
const GALLERY: { src: string; alt: string; caption: string; width: number; height: number }[] = [
  {
    src: "/saidazim-stypeuz-developer.webp",
    alt: "Saidazim — STypeUz dasturchisi",
    caption: "Saidazim — STypeUz platformasini yaratgan dasturchi",
    width: 600,
    height: 901,
  },
  {
    src: "/stypeuz-team-nf2957.webp",
    alt: "NF-2957 dasturlash guruhi — STypeUz jamoasi",
    caption: "NF-2957 — dasturlash guruhining jamoa surati, STypeUz",
    width: 800,
    height: 1067,
  },
  {
    src: "/mentor-sunnatbek-yusupov.webp",
    alt: "Sunnatbek Yusupov — STypeUz ustozim",
    caption: "Sunnatbek Yusupov — mening ustozim, STypeUz",
    width: 480,
    height: 640,
  },
];

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

// Yutuqlar (achievements)
const ACHIEVEMENTS: { icon: IconType; color: string; title: string; desc: string }[] = [
  { icon: FaTrophy, color: "#f59e0b", title: "Eng yaxshi natija", desc: "92 WPM · 98% aniqlik" },
  { icon: FaMedal, color: "#22d3ee", title: "STypeUz yaratuvchisi", desc: "Yozish tezligi platformasi" },
  { icon: FaCertificate, color: "#818cf8", title: "Kodlash kursi", desc: "NF-2957 · Frontend yo'nalishi" },
  { icon: FaRocket, color: "#f472b6", title: "Ko'nikmalar to'plami", desc: "Python, JS, React, Next.js" },
];

export default function OwnerView({ t, onClose }: OwnerViewProps) {
  // Lightbox: rasm ustiga bosilganda kattalashtirib ko'rsatish (galereya navigatsiya bilan)
  const [lightbox, setLightbox] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const openLightbox = (index: number) => setLightbox(index);
  const closeLightbox = () => setLightbox(null);
  const nextImage = () =>
    setLightbox((i) => (i === null ? null : (i + 1) % GALLERY.length));
  const prevImage = () =>
    setLightbox((i) => (i === null ? null : (i - 1 + GALLERY.length) % GALLERY.length));

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") nextImage();
      if (e.key === "ArrowLeft") prevImage();
    };
    window.addEventListener("keydown", onKey);
    // Asosiy scroll konteynerni qulflash (body emas — OwnerView o'zi scroll qiladi)
    if (scrollRef.current) scrollRef.current.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      if (scrollRef.current) scrollRef.current.style.overflow = "";
    };
  }, [lightbox]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      ref={scrollRef}
      className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-3xl mx-auto w-full overflow-y-auto"
    >
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
            className="relative w-40 h-52 sm:w-48 sm:h-60 rounded-2xl overflow-hidden flex-shrink-0 animate-bounce-in cursor-zoom-in"
            style={{ border: `2px solid ${t.accent}66`, boxShadow: `0 0 34px ${t.accent}40` }}
            onClick={() => openLightbox(0)}
            role="button"
            tabIndex={0}
            aria-label="Portfolio rasmini kattalashtirish"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(0);
              }
            }}
          >
            <img
              src={ME.photo}
              alt={`${ME.name} — STypeUz dasturchisi`}
              title={`${ME.name} — STypeUz platformasini yaratgan dasturchi`}
              width={600}
              height={901}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: t.accent + "cc", color: "#041018" }}
              >
                <FiZoomIn size={12} />
                Kattalashtirish
              </span>
            </div>
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
                { icon: FiBookOpen, label: `Ustoz: ${ME.mentor}` },
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

      {/* ── USTOZIM ── */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FiBookOpen style={{ color: t.accent }} />
          Ustozim
        </div>
        <div
          className="flex items-center gap-4 p-4 rounded-2xl border border-white/10 animate-row"
          style={{ background: "#ffffff06" }}
        >
          <div
            className="relative w-28 h-32 rounded-xl overflow-hidden flex-shrink-0 animate-bounce-in cursor-zoom-in"
            style={{ border: `2px solid ${t.accent}55`, boxShadow: `0 0 24px ${t.accent}30` }}
            onClick={() => openLightbox(2)}
            role="button"
            tabIndex={0}
            aria-label="Ustoz rasmini kattalashtirish"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(2);
              }
            }}
          >
            <img
              src="/mentor-sunnatbek-yusupov.webp"
              alt={`${ME.mentor} — STypeUz ustozim`}
              title={`${ME.mentor} — STypeUz ustozim`}
              width={480}
              height={640}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: t.accent + "cc", color: "#041018" }}
              >
                <FiZoomIn size={12} />
                Kattalashtirish
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-1.5"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}55` }}
            >
              <FiBookOpen size={11} />
              Ustozim 👨‍🏫
            </div>
            <div className="text-lg font-bold text-white truncate">{ME.mentor}</div>
            <div className="text-xs text-gray-400 mt-0.5">Mening ustozim</div>
          </div>
        </div>
      </div>

      {/* ── GURUHIM ── */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FiUsers style={{ color: t.accent }} />
          Guruhim
        </div>
        <div
          className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl border border-white/10 animate-row"
          style={{ background: "#ffffff06" }}
        >
          <div
            className="relative w-32 h-40 sm:w-28 sm:h-36 rounded-xl overflow-hidden flex-shrink-0 animate-bounce-in cursor-zoom-in"
            style={{ border: `2px solid ${t.accent}55`, boxShadow: `0 0 24px ${t.accent}30` }}
            onClick={() => openLightbox(1)}
            role="button"
            tabIndex={0}
            aria-label="Guruh rasmini kattalashtirish"
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openLightbox(1);
              }
            }}
          >
            <img
              src="/stypeuz-team-nf2957.webp"
              alt={`${GROUP.name} — STypeUz jamoasi`}
              title={`${GROUP.name} — STypeUz dasturlash guruhining jamoa surati`}
              width={800}
              height={1067}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              draggable={false}
            />
            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 pointer-events-none" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
              <span
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
                style={{ background: t.accent + "cc", color: "#041018" }}
              >
                <FiZoomIn size={12} />
                Kattalashtirish
              </span>
            </div>
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold mb-1.5"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}55` }}
            >
              <FiUsers size={11} />
              Guruhim 👨‍🎓
            </div>
            <div className="text-lg font-bold text-white">{GROUP.name}</div>
            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
              {GROUP.members.map((m) => (
                <div
                  key={m.name}
                  className="px-1.5 py-2 rounded-xl text-center transition-all hover:scale-105 hover:border-white/25"
                  style={{ background: "#ffffff08", border: "1px solid #ffffff14" }}
                >
                  <div className="text-base leading-none">{m.emoji}</div>
                  <div className="text-[10px] font-semibold text-white mt-1 truncate">{m.name}</div>
                  <div className="text-[8px] text-gray-500 truncate">{m.role}</div>
                </div>
              ))}
            </div>
            <div className="text-[11px] text-gray-400 mt-2">
              Ustoz: <span className="text-white font-medium">{GROUP.mentor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── YUTUQLAR ── */}
      <div className="mt-6">
        <div className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <FaAward style={{ color: t.accent }} />
          Yutuqlarim
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {ACHIEVEMENTS.map((a) => (
            <div
              key={a.title}
              className="flex items-center gap-3 p-3.5 rounded-xl border border-white/10 animate-row"
              style={{ background: "#ffffff06" }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-110"
                style={{ background: a.color + "1f", border: `1px solid ${a.color}55`, color: a.color }}
              >
                <a.icon size={20} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-white truncate">{a.title}</div>
                <div className="text-[11px] text-gray-500 truncate">{a.desc}</div>
              </div>
            </div>
          ))}
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

      {/* Lightbox — kattalashtirilgan rasm (galereya navigatsiya bilan) */}
      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Rasm galereyasi"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-sm animate-fade-in"
          onClick={closeLightbox}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            className="absolute top-4 right-4 p-2.5 rounded-full text-white bg-white/10 hover:bg-white/25 transition-all hover:scale-110"
            aria-label="Yopish"
          >
            <FiX size={22} />
          </button>

          {/* Oldingi rasm */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              prevImage();
            }}
            className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-white bg-white/10 hover:bg-white/25 transition-all hover:scale-110"
            aria-label="Oldingi rasm"
          >
            <FiChevronLeft size={24} />
          </button>

          {/* Keyingi rasm */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              nextImage();
            }}
            className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full text-white bg-white/10 hover:bg-white/25 transition-all hover:scale-110"
            aria-label="Keyingi rasm"
          >
            <FiChevronRight size={24} />
          </button>

          <div
            key={GALLERY[lightbox].src}
            className="max-w-full max-h-full animate-pop-in"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={GALLERY[lightbox].src}
              alt={GALLERY[lightbox].alt}
              title={GALLERY[lightbox].caption}
              width={GALLERY[lightbox].width}
              height={GALLERY[lightbox].height}
              className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl"
              draggable={false}
            />
            <div className="text-center text-xs text-gray-400 mt-3">
              {GALLERY[lightbox].caption} · {lightbox + 1}/{GALLERY.length} · Yopish uchun bosing yoki Esc
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
