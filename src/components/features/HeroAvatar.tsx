"use client";

import { useId } from "react";
import { DEFAULT_HERO_EQUIP, getHeroItem, type HeroEquip } from "../../data/shop";

/**
 * Qahramon avatari — SVG chizilgan yuz + kepka/toj/ko'zoynak/kiyim.
 * Foydalanuvchi do'kondan sotib olgan kiyimlarini kiyingan holda ko'rsatadi.
 */
interface HeroAvatarProps {
  /** Kiyilayotgan narsalar (hat / glasses / outfit ID lari) */
  equip?: Partial<HeroEquip>;
  /** Asosiy rang (avatar rangi / aksent) — aura uchun */
  color?: string;
  size?: number;
  className?: string;
}

function itemColor(id: string, fallback: string): string {
  return getHeroItem(id)?.color || fallback;
}

export default function HeroAvatar({
  equip,
  color = "#a78bfa",
  size = 64,
  className,
}: HeroAvatarProps) {
  const uid = useId();
  const eq: HeroEquip = { ...DEFAULT_HERO_EQUIP, ...(equip || {}) };
  const hat = eq.hat;
  const glasses = eq.glasses;
  const outfit = eq.outfit;

  const skin = "#ffd9b8";
  const hair = "#4a3428";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 112"
      className={className}
      style={{ display: "block" }}
      aria-label="Qahramon avatari"
      role="img"
    >
      <defs>
        <radialGradient id={`heroGlow-${uid}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.5" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura */}
      <circle cx="50" cy="54" r="48" fill={`url(#heroGlow-${uid})`} />

      {/* ── OUTFIT (tanasi) ── */}
      <g>
        {/* Yelka/tana asosi */}
        <path
          d="M22 112 C22 88 34 78 50 78 C66 78 78 88 78 112 Z"
          fill={itemColor(outfit, "#64748b")}
        />
        {outfit === "hero_tshirt" && (
          <g>
            <path d="M22 104 C20 88 26 78 34 76 L38 80 C30 84 28 94 28 108 Z" fill="#16a34a" />
            <path d="M78 104 C80 88 74 78 66 76 L62 80 C70 84 72 94 72 108 Z" fill="#16a34a" />
            <path d="M38 78 L50 86 L62 78 L66 84 L50 112 L34 84 Z" fill="#22c55e" />
          </g>
        )}
        {outfit === "hero_hoodie" && (
          <g>
            <path d="M30 110 C30 86 38 78 50 78 C62 78 70 86 70 110 Z" fill="#0284c7" />
            <path d="M34 96 L66 96 L66 104 L34 104 Z" fill="#0369a1" rx="2" />
            <path d="M44 96 L44 106 M56 96 L56 106" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        )}
        {outfit === "hero_jersey" && (
          <g>
            <path d="M22 112 C22 88 34 78 50 78 C66 78 78 88 78 112 Z" fill="#db2777" />
            <path d="M40 84 L40 112 M60 84 L60 112" stroke="#f9a8d4" strokeWidth="5" />
            <circle cx="50" cy="96" r="9" fill="#fff" />
            <text x="50" y="100" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#db2777">
              7
            </text>
          </g>
        )}
        {outfit === "hero_suit" && (
          <g>
            <path d="M22 112 C22 88 34 78 50 78 C66 78 78 88 78 112 Z" fill="#1e293b" />
            <path d="M50 80 L44 90 L50 100 L56 90 Z" fill="#ef4444" />
            <path d="M36 82 L44 90 L50 84 L56 90 L64 82" stroke="#f8fafc" strokeWidth="4" fill="none" />
          </g>
        )}
        {outfit === "hero_armor" && (
          <g>
            <path d="M22 112 C22 88 34 78 50 78 C66 78 78 88 78 112 Z" fill="#64748b" />
            <circle cx="26" cy="84" r="7" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            <circle cx="74" cy="84" r="7" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            <path d="M42 80 L50 90 L58 80 L60 90 L50 112 L40 90 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
            <rect x="46" y="94" width="8" height="10" rx="2" fill="#f59e0b" />
          </g>
        )}
        {/* Bo'yin */}
        <rect x="43" y="68" width="14" height="14" rx="6" fill={skin} />
      </g>

      {/* ── BOSH ── */}
      <circle cx="50" cy="48" r="24" fill={skin} />
      {/* Quloqlar */}
      <circle cx="27" cy="50" r="4.5" fill={skin} />
      <circle cx="73" cy="50" r="4.5" fill={skin} />
      {/* Soch (kepka bo'lmasa ko'rinadi) */}
      {hat === "hero_hat_none" && (
        <g>
          <path d="M28 44 C28 26 38 22 50 22 C62 22 72 26 72 44 C66 32 56 30 50 30 C44 30 34 32 28 44 Z" fill={hair} />
          <path d="M32 40 C32 34 38 30 44 30 C40 34 38 38 36 42 Z" fill={hair} />
        </g>
      )}

      {/* Yuz */}
      <g>
        {/* Qoshlar */}
        <path d="M37 38 Q41 35 45 38" stroke={hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M55 38 Q59 35 63 38" stroke={hair} strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Ko'zlar */}
        <circle cx="41" cy="45" r="3.2" fill="#1f2937" />
        <circle cx="59" cy="45" r="3.2" fill="#1f2937" />
        <circle cx="42.2" cy="44" r="1.1" fill="#fff" />
        <circle cx="60.2" cy="44" r="1.1" fill="#fff" />
        {/* Yonoq */}
        <ellipse cx="34" cy="52" rx="3.4" ry="2" fill="#fca5a5" opacity="0.55" />
        <ellipse cx="66" cy="52" rx="3.4" ry="2" fill="#fca5a5" opacity="0.55" />
        {/* Og'iz */}
        <path d="M45 55 Q50 60 55 55" stroke="#b45309" strokeWidth="2.2" fill="none" strokeLinecap="round" />
      </g>

      {/* ── GLASSES (ko'zoynak) ── */}
      {glasses === "hero_rounds" && (
        <g>
          <circle cx="41" cy="45" r="7" fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="2" />
          <circle cx="59" cy="45" r="7" fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="2" />
          <path d="M48 45 L52 45" stroke="#374151" strokeWidth="2" />
          <path d="M34 43 L28 47 M66 43 L72 47" stroke="#374151" strokeWidth="2" />
        </g>
      )}
      {glasses === "hero_sunglasses" && (
        <g>
          <rect x="33" y="40" width="17" height="11" rx="4" fill="#111827" />
          <rect x="50" y="40" width="17" height="11" rx="4" fill="#111827" />
          <path d="M50 44 L50 47" stroke="#111827" strokeWidth="2.5" />
          <path d="M34 47 L36 49 M66 47 L64 49" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
        </g>
      )}
      {glasses === "hero_star" && (
        <g>
          <path d="M41 36 L43.2 41.2 L48.5 41.8 L44.5 45.6 L45.6 50.8 L41 48 L36.4 50.8 L37.5 45.6 L33.5 41.8 L38.8 41.2 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          <path d="M59 36 L61.2 41.2 L66.5 41.8 L62.5 45.6 L63.6 50.8 L59 48 L54.4 50.8 L55.5 45.6 L51.5 41.8 L56.8 41.2 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          <path d="M48 46 L52 46" stroke="#f59e0b" strokeWidth="1.6" />
        </g>
      )}
      {glasses === "hero_visor" && (
        <g>
          <rect x="28" y="39" width="44" height="13" rx="6" fill="#0e7490" opacity="0.92" />
          <path d="M32 42 L68 42" stroke="#a5f3fc" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
          <circle cx="50" cy="45.5" r="2" fill="#67e8f9" />
          <rect x="40" y="52" width="20" height="4" rx="2" fill="#155e75" />
        </g>
      )}

      {/* ── HAT (kepka/toj) ── */}
      {hat === "hero_cap" && (
        <g>
          <path d="M27 38 C27 20 38 14 50 14 C62 14 73 20 73 38 Z" fill="#38bdf8" />
          <path d="M27 36 L73 36 L73 40 Q50 50 27 40 Z" fill="#0284c7" />
          <circle cx="50" cy="16" r="2.6" fill="#bae6fd" />
        </g>
      )}
      {hat === "hero_beanie" && (
        <g>
          <path d="M27 42 C27 20 38 15 50 15 C62 15 73 20 73 42 Z" fill="#ec4899" />
          <rect x="27" y="38" width="46" height="8" rx="4" fill="#be185d" />
          <circle cx="50" cy="13" r="4.5" fill="#fbcfe8" />
        </g>
      )}
      {hat === "hero_halo" && (
        <g>
          <ellipse cx="50" cy="16" rx="16" ry="5.5" fill="none" stroke="#fbbf24" strokeWidth="3.5" />
          <circle cx="50" cy="16" r="2" fill="#fde68a" />
        </g>
      )}
      {hat === "hero_wizard" && (
        <g>
          <path d="M50 8 L67 36 L64 40 L50 26 L36 40 L33 36 Z" fill="#7c3aed" />
          <ellipse cx="50" cy="38" rx="21" ry="4.5" fill="#6d28d9" />
          <circle cx="44" cy="24" r="2" fill="#fbbf24" />
          <circle cx="57" cy="20" r="1.8" fill="#fbbf24" />
          <circle cx="50" cy="32" r="1.6" fill="#fbbf24" />
        </g>
      )}
      {hat === "hero_crown" && (
        <g>
          <path d="M29 40 L29 24 L38 32 L44 20 L50 28 L56 20 L62 32 L71 24 L71 40 Z" fill="#f59e0b" />
          <rect x="29" y="38" width="42" height="6" rx="2.5" fill="#d97706" />
          <circle cx="38" cy="32" r="2" fill="#ef4444" />
          <circle cx="50" cy="26" r="2" fill="#38bdf8" />
          <circle cx="62" cy="32" r="2" fill="#22c55e" />
        </g>
      )}
    </svg>
  );
}
