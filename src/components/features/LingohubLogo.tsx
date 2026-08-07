"use client";

import { useId } from "react";

interface LingohubLogoProps {
  size?: number;
  className?: string;
  /** Show the chrome "LINGOHUB.UZ" wordmark below the emblem */
  showText?: boolean;
}

/** 4-point star (sparkle / lens flare) path centered at (cx, cy). */
function sparklePath(cx: number, cy: number, r: number): string {
  const s = r * 0.22;
  return [
    `M ${cx} ${cy - r}`,
    `C ${cx + s} ${cy - s}, ${cx + s} ${cy - s}, ${cx + r} ${cy}`,
    `C ${cx + s} ${cy + s}, ${cx + s} ${cy + s}, ${cx} ${cy + r}`,
    `C ${cx - s} ${cy + s}, ${cx - s} ${cy + s}, ${cx - r} ${cy}`,
    `C ${cx - s} ${cy - s}, ${cx - s} ${cy - s}, ${cx} ${cy - r}`,
    "Z",
  ].join(" ");
}

/**
 * Lingohub.UZ logosi — kumush/xrom metall uslubidagi nutq pufakchasi
 * ichidagi "LH" monogrammasi, chap tomonda signal to'lqinlari va
 * yorqin akslar (lens flare) bilan. Asl logo (rasm) asosida tayyorlangan.
 */
export default function LingohubLogo({
  size = 132,
  className,
  showText = false,
}: LingohubLogoProps) {
  // Gradient ID'lari sahifada bir nechta logo bo'lganda ham yagona bo'lsin
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const chrome = `lhChrome${uid}`;
  const inner = `lhInner${uid}`;
  const metal = `lhMetal${uid}`;
  const gloss = `lhGloss${uid}`;
  const shadow = `lhShadow${uid}`;

  return (
    <div className={`inline-flex flex-col items-center ${className ?? ""}`}>
      <svg
        width={size}
        height={size * 1.1}
        viewBox="0 0 100 110"
        aria-hidden
      >
        <defs>
          {/* Xrom halqa — turli metall akslar bilan */}
          <linearGradient id={chrome} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#cbd5e1" />
            <stop offset="42%" stopColor="#94a3b8" />
            <stop offset="52%" stopColor="#e2e8f0" />
            <stop offset="70%" stopColor="#64748b" />
            <stop offset="88%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#ffffff" />
          </linearGradient>
          {/* Ichki chuqur ko'k fon */}
          <radialGradient id={inner} cx="0.34" cy="0.26" r="1.15">
            <stop offset="0%" stopColor="#26395a" />
            <stop offset="55%" stopColor="#0e1c33" />
            <stop offset="100%" stopColor="#060d1c" />
          </radialGradient>
          {/* LH monogramma metalli */}
          <linearGradient id={metal} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="38%" stopColor="#e2e8f0" />
            <stop offset="52%" stopColor="#8b95a3" />
            <stop offset="64%" stopColor="#dde3ec" />
            <stop offset="100%" stopColor="#5b6573" />
          </linearGradient>
          {/* Yuqori qismdagi yaltiroq aks */}
          <linearGradient id={gloss} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id={shadow} x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="4" stdDeviation="3.5" floodColor="#000000" floodOpacity="0.55" />
          </filter>
        </defs>

        <g filter={`url(#${shadow})`}>
          {/* Nutq pufakchasi dumi (pastki chap) */}
          <path d="M 24 80 L 47 80 L 32 100 Z" fill={`url(#${chrome})`} />

          {/* Xrom halqa */}
          <circle cx="50" cy="48" r="43" fill="none" stroke={`url(#${chrome})`} strokeWidth="9" />
          {/* Halqa ustidagi yaltiroq chiziq */}
          <path
            d="M 12 36 A 43 43 0 0 1 66 7"
            fill="none"
            stroke={`url(#${gloss})`}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.9"
          />
          {/* Ichki chuqurlik */}
          <circle cx="50" cy="48" r="38" fill={`url(#${inner})`} stroke="#ffffff2b" strokeWidth="1" />
          {/* Ichki yumshoq yorug'lik (yuqori chap) */}
          <ellipse cx="38" cy="26" rx="26" ry="14" fill="#ffffff" opacity="0.07" transform="rotate(-18 38 26)" />

          {/* Signal to'lqinlari (chap tomonda, konsentrik yoylar) */}
          <path d="M 17 66 A 21 21 0 0 0 17 30" fill="none" stroke={`url(#${metal})`} strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
          <path d="M 24 63 A 15.5 15.5 0 0 0 24 33" fill="none" stroke={`url(#${metal})`} strokeWidth="3.5" strokeLinecap="round" opacity="0.75" />
          <path d="M 31 60 A 10 10 0 0 0 31 36" fill="none" stroke={`url(#${metal})`} strokeWidth="3.5" strokeLinecap="round" opacity="1" />

          {/* LH monogramma */}
          <text
            x="56"
            y="63"
            textAnchor="middle"
            fontFamily="'Inter','Segoe UI',sans-serif"
            fontWeight="800"
            fontSize="34"
            fill={`url(#${metal})`}
            style={{ letterSpacing: "-1px" }}
          >
            LH
          </text>

          {/* Lens flare — halqaning yuqori o'ng chetida */}
          <g>
            <circle cx="85" cy="13" r="10" fill="#ffffff" opacity="0.14" />
            <circle cx="85" cy="13" r="4.5" fill="#ffffff" opacity="0.95">
              <animate attributeName="opacity" values="0.95;0.4;0.95" dur="2.2s" repeatCount="indefinite" />
            </circle>
            <path d={sparklePath(85, 13, 7)} fill="#ffffff" opacity="0.85">
              <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2.2s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Ichki chap yoy ustidagi kichik yulduzcha */}
          <g>
            <circle cx="17" cy="28" r="5" fill="#ffffff" opacity="0.16" />
            <circle cx="17" cy="28" r="1.8" fill="#ffffff" opacity="0.9">
              <animate attributeName="opacity" values="0.9;0.3;0.9" dur="3s" repeatCount="indefinite" />
            </circle>
            <path d={sparklePath(17, 28, 4)} fill="#ffffff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.25;0.8" dur="3s" repeatCount="indefinite" />
            </path>
          </g>

          {/* Pastki o'ng burchakdagi to'rt qirrali yulduzcha */}
          <path d={sparklePath(90, 96, 5)} fill="#e2e8f0" opacity="0.7" />
        </g>
      </svg>

      {/* Xrom uslubidagi LINGOHUB.UZ matni */}
      {showText && (
        <div
          className="chrome-text font-extrabold uppercase tracking-wide leading-none"
          style={{ fontSize: Math.max(15, size * 0.16), marginTop: Math.max(6, size * 0.07) }}
        >
          Lingohub.UZ
        </div>
      )}
    </div>
  );
}
