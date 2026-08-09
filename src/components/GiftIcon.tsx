"use client";

import { useId } from "react";

interface GiftIconProps {
  size?: number;
  className?: string;
}

/**
 * STypeUz sovg'a (gift) qutisi — Telegram Premium sovg'asi belgisi.
 * Dizayn: oltin quti, qizil lenta va kamon — "200 WPM → Premium" o'rniga.
 */
export default function GiftIcon({ size = 20, className }: GiftIconProps) {
  // Har bir instansiya uchun unikal gradient ID — bir nechta belgi bir sahifada bo'lsa ham buzilmaydi
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const lid = `gift-lid-${uid}`;
  const box = `gift-box-${uid}`;
  const ribbon = `gift-ribbon-${uid}`;
  const bow = `gift-bow-${uid}`;
  const tail = `gift-tail-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      aria-hidden="true"
      style={{ display: "inline-block", flexShrink: 0, verticalAlign: "-0.14em" }}
    >
      <defs>
        <linearGradient id={lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd76a" />
          <stop offset="45%" stopColor="#f6b93b" />
          <stop offset="100%" stopColor="#e09e23" />
        </linearGradient>
        <linearGradient id={box} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0a92e" />
          <stop offset="100%" stopColor="#c9821a" />
        </linearGradient>
        <linearGradient id={ribbon} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff8a5c" />
          <stop offset="100%" stopColor="#e05a2b" />
        </linearGradient>
        <radialGradient id={bow} cx="50%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#ffc39a" />
          <stop offset="60%" stopColor="#f4734a" />
          <stop offset="100%" stopColor="#d94e22" />
        </radialGradient>
        <linearGradient id={tail} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff7f52" />
          <stop offset="100%" stopColor="#e05a2b" />
        </linearGradient>
      </defs>

      {/* Qutining tanasi */}
      <rect x="20" y="44" width="60" height="42" rx="6" fill={`url(#${box})`} />
      <rect x="20" y="44" width="60" height="8" rx="6" fill="#0000001f" />

      {/* Qopqoq */}
      <rect x="13" y="32" width="74" height="18" rx="6" fill={`url(#${lid})`} />
      <rect x="13" y="32" width="74" height="7" rx="6" fill="#ffffff26" />

      {/* Lenta (vertikal + qopqoqda gorizontal) */}
      <rect x="44" y="32" width="12" height="54" fill={`url(#${ribbon})`} />
      <rect x="13" y="38" width="74" height="7" fill={`url(#${ribbon})`} />

      {/* Kamon */}
      <path d="M50 40 C34 20 16 26 20 40 C27 42 42 42 50 40 Z" fill={`url(#${bow})`} />
      <path d="M50 40 C66 20 84 26 80 40 C73 42 58 42 50 40 Z" fill={`url(#${bow})`} />
      <circle cx="50" cy="40" r="7.5" fill="#e05a2b" stroke="#b53d14" strokeWidth="2" />

      {/* Lenta dumlari */}
      <path d="M50 46 L41 62 L50 57 L59 62 Z" fill={`url(#${tail})`} />

      {/* Yaltiroq */}
      <ellipse cx="33" cy="56" rx="13" ry="9" fill="#ffffff" opacity="0.14" transform="rotate(-12 33 56)" />
      <ellipse cx="70" cy="33" rx="6" ry="3" fill="#ffffff" opacity="0.35" transform="rotate(-12 70 33)" />
    </svg>
  );
}
