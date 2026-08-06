"use client";

import { FiArrowUpRight } from "react-icons/fi";

const LINGOHUB_URL = "https://lingohub.uz";

interface LingohubAdProps {
  className?: string;
}

// ── Lingohub.uz logotipi (SVG): nutq pufakchasi + LH monogrammasi ─────
function LingohubLogo({ size = 52 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden>
      {/* Speech bubble circle */}
      <circle cx="32" cy="29" r="22" stroke="white" strokeWidth="2.5" />
      {/* Tail */}
      <path d="M23 48 L27 39 L31 48 Z" fill="white" />
      {/* Sound waves */}
      <path d="M18 23 a6.5 6.5 0 0 0 0 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 19.5 a10 10 0 0 0 0 19" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 16 a14 14 0 0 0 0 26" stroke="white" strokeWidth="2" strokeLinecap="round" />
      {/* LH monogram */}
      <path d="M33 18 v20" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M41 18 v20" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M33 28 h8" stroke="white" strokeWidth="4" strokeLinecap="round" />
      <path d="M37 18 v20 h9" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* Four-point star */}
      <path
        d="M40 21.5 C40.8 23.5 42.5 25.2 44.5 26 C42.5 26.8 40.8 28.5 40 30.5 C39.2 28.5 37.5 26.8 35.5 26 C37.5 25.2 39.2 23.5 40 21.5 Z"
        fill="white"
        opacity="0.95"
      />
    </svg>
  );
}

export default function LingohubAd({ className = "" }: LingohubAdProps) {
  return (
    <a
      href={LINGOHUB_URL}
      target="_blank"
      rel="noopener noreferrer"
      title="Lingohub — 27 tilda bepul til o'rganing"
      className={`group relative block overflow-hidden rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${className}`}
      style={{
        background: "linear-gradient(135deg, #0A60D9 0%, #083e8c 60%, #062b66 100%)",
        border: "1px solid #ffffff2e",
        boxShadow: "0 8px 30px rgba(10, 96, 217, 0.35), inset 0 1px 0 rgba(255,255,255,0.18)",
      }}
    >
      {/* Shine sweep on hover */}
      <span
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background:
            "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.22) 50%, transparent 60%)",
          backgroundSize: "250% 100%",
          animation: "promoShine 2.2s linear infinite",
        }}
      />
      {/* "Reklama" badge */}
      <span
        className="absolute top-1.5 right-2 z-10 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-widest"
        style={{ background: "#00000040", color: "#cfe2ff", border: "1px solid #ffffff22" }}
      >
        Reklama
      </span>

      <div className="relative z-[1] flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3">
        {/* Logo */}
        <div
          className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6"
          style={{ background: "#00000022", border: "1px solid #ffffff2e" }}
        >
          <LingohubLogo size={44} />
        </div>

        {/* Text */}
        <div className="min-w-0 flex-1">
          <div className="text-white font-extrabold tracking-wide text-base sm:text-lg leading-tight flex items-center gap-1.5">
            LINGOHUB<span className="opacity-80 font-medium">.UZ</span>
          </div>
          <div className="text-[11px] sm:text-xs text-sky-100/90 mt-0.5 leading-snug">
            27 tilda bepul til o'rganing — ingliz, nemis va boshqalar!
          </div>
        </div>

        {/* CTA */}
        <div
          className="flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 group-hover:gap-2 group-hover:bg-white group-hover:text-[#0A60D9]"
          style={{ background: "#ffffff22", color: "#ffffff", border: "1px solid #ffffff45" }}
        >
          Ochish
          <FiArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </div>
      </div>
    </a>
  );
}
