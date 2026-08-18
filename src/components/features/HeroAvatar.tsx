"use client";

import { useId } from "react";
import { DEFAULT_HERO_EQUIP, getHeroItem, type HeroEquip } from "../../data/shop";

/**
 * To'liq tana — chiroyli 3D cartoon qahramon.
 * Bosh, tana, qo'l, oyoq, kiyim — hammasi SVG bilan chizilgan.
 * Foydalanuvchi do'kondan sotib olgan kiyimlarini kiyingan holda ko'rsatadi.
 */
interface HeroAvatarProps {
  /** Kiyilayotgan narsalar */
  equip?: Partial<HeroEquip>;
  /** Asosiy rang (aura / aksent) */
  color?: string;
  size?: number;
  className?: string;
}

function ic(id: string, fb: string): string {
  return getHeroItem(id)?.color || fb;
}

export default function HeroAvatar({
  equip,
  color = "#a78bfa",
  size = 64,
  className,
}: HeroAvatarProps) {
  const uid = useId();
  const eq: HeroEquip = { ...DEFAULT_HERO_EQUIP, ...(equip || {}) };

  const skin = "#ffd9b8";
  const skinShadow = "#f0c49a";
  const hair = "#4a3428";
  const hairHighlight = "#6b4c36";

  const outfitColor = ic(eq.outfit, "#64748b");
  const pantsColor = ic(eq.pants, "#a0845c");
  const shoesColor = ic(eq.shoes, "#a0845c");
  const watchColor = ic(eq.watch, "#c0c0c0");

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 180"
      className={className}
      style={{ display: "block" }}
      role="img"
      aria-label="3D Cartoon Mannequin"
    >
      <defs>
        {/* Body gradient for 3D shading */}
        <linearGradient id={`body3d-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skin} />
          <stop offset="100%" stopColor={skinShadow} />
        </linearGradient>
        {/* Outfit gradient */}
        <linearGradient id={`outfit3d-${uid}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor={outfitColor} />
          <stop offset="100%" stopColor={outfitColor} stopOpacity="0.7" />
        </linearGradient>
        {/* Glow */}
        <radialGradient id={`heroGlow-${uid}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </radialGradient>
        <filter id={`shadow3d-${uid}`}>
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.2" />
        </filter>
      </defs>

      {/* Background aura */}
      <ellipse cx="60" cy="90" rx="55" ry="80" fill={`url(#heroGlow-${uid})`} />

      {/* ── SHADOW ON GROUND ── */}
      <ellipse cx="60" cy="174" rx="30" ry="5" fill="#00000033" />

      {/* ── LEGS / PANTS ── */}
      <g>
        {/* Left leg */}
        <rect x="38" y="120" width="16" height="42" rx="7" fill={pantsColor} />
        <rect x="38" y="120" width="16" height="42" rx="7" fill="#000" opacity="0.08" />
        {/* Right leg */}
        <rect x="66" y="120" width="16" height="42" rx="7" fill={pantsColor} />
        <rect x="66" y="120" width="16" height="42" rx="7" fill="#000" opacity="0.08" />
        {/* Pants details */}
        {eq.pants !== "hero_pants_none" && (
          <>
            <line x1="46" y1="135" x2="46" y2="158" stroke="#000" strokeWidth="0.6" opacity="0.12" />
            <line x1="74" y1="135" x2="74" y2="158" stroke="#000" strokeWidth="0.6" opacity="0.12" />
            {/* Pocket on cargo pants */}
            {eq.pants === "hero_pants_cargo" && (
              <>
                <rect x="38" y="138" width="8" height="8" rx="1.5" fill="#000" opacity="0.15" />
                <rect x="74" y="138" width="8" height="8" rx="1.5" fill="#000" opacity="0.15" />
              </>
            )}
          </>
        )}
      </g>

      {/* ── SHOES ── */}
      <g>
        {/* Left shoe */}
        {eq.shoes === "hero_shoes_none" ? (
          <ellipse cx="46" cy="164" rx="9" ry="5" fill={skin} />
        ) : eq.shoes === "hero_shoes_sneakers" || eq.shoes === "hero_shoes_jordans" ? (
          <g>
            <path d="M33 160 Q33 168 46 168 Q56 168 56 162 L56 158 L36 158 Z" fill={shoesColor} />
            <path d="M36 158 L56 158" stroke={eq.shoes === "hero_shoes_jordans" ? "#fff" : "#e2e8f0"} strokeWidth="2" strokeLinecap="round" />
            <rect x="33" y="158" width="23" height="4" rx="2" fill={shoesColor === "#f1f5f9" ? "#e2e8f0" : shoesColor} />
          </g>
        ) : eq.shoes === "hero_shoes_boots" || eq.shoes === "hero_shoes_biker" ? (
          <g>
            <rect x="33" y="152" width="23" height="14" rx="4" fill={shoesColor} />
            <rect x="33" y="152" width="23" height="4" rx="2" fill="#000" opacity="0.15" />
            <rect x="36" y="156" width="2" height="5" rx="1" fill="#000" opacity="0.1" />
          </g>
        ) : eq.shoes === "hero_shoes_flame" ? (
          <g>
            <path d="M33 160 Q33 168 46 168 Q56 168 56 160 L56 156 L36 156 Z" fill={shoesColor} />
            <path d="M38 156 L42 152 L46 158" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          </g>
        ) : eq.shoes === "hero_shoes_crystal" ? (
          <g>
            <path d="M33 162 Q33 168 46 168 Q56 168 56 160 L56 157 L36 157 Z" fill={shoesColor} opacity="0.7" />
            <path d="M38 160 L42 156 L46 162" stroke="#e0f2fe" strokeWidth="1" fill="none" />
          </g>
        ) : (
          <ellipse cx="46" cy="163" rx="11" ry="5" fill={shoesColor} />
        )}
        {/* Right shoe (mirror) */}
        {eq.shoes === "hero_shoes_none" ? (
          <ellipse cx="74" cy="164" rx="9" ry="5" fill={skin} />
        ) : eq.shoes === "hero_shoes_sneakers" || eq.shoes === "hero_shoes_jordans" ? (
          <g>
            <path d="M87 160 Q87 168 74 168 Q64 168 64 162 L64 158 L84 158 Z" fill={shoesColor} />
            <path d="M64 158 L84 158" stroke={eq.shoes === "hero_shoes_jordans" ? "#fff" : "#e2e8f0"} strokeWidth="2" strokeLinecap="round" />
            <rect x="64" y="158" width="23" height="4" rx="2" fill={shoesColor === "#f1f5f9" ? "#e2e8f0" : shoesColor} />
          </g>
        ) : eq.shoes === "hero_shoes_boots" || eq.shoes === "hero_shoes_biker" ? (
          <g>
            <rect x="64" y="152" width="23" height="14" rx="4" fill={shoesColor} />
            <rect x="64" y="152" width="23" height="4" rx="2" fill="#000" opacity="0.15" />
            <rect x="82" y="156" width="2" height="5" rx="1" fill="#000" opacity="0.1" />
          </g>
        ) : eq.shoes === "hero_shoes_flame" ? (
          <g>
            <path d="M87 160 Q87 168 74 168 Q64 168 64 160 L64 156 L84 156 Z" fill={shoesColor} />
            <path d="M78 156 L74 152 L70 158" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
          </g>
        ) : eq.shoes === "hero_shoes_crystal" ? (
          <g>
            <path d="M87 162 Q87 168 74 168 Q64 168 64 160 L64 157 L84 157 Z" fill={shoesColor} opacity="0.7" />
          </g>
        ) : (
          <ellipse cx="74" cy="163" rx="11" ry="5" fill={shoesColor} />
        )}
      </g>

      {/* ── TORSO / SHIRT ── */}
      <g filter={`url(#shadow3d-${uid})`}>
        {/* Main torso */}
        <path
          d="M30 80 C30 68 40 58 60 58 C80 58 90 68 90 80 L90 122 C90 124 78 126 60 126 C42 126 30 124 30 122 Z"
          fill={`url(#outfit3d-${uid})`}
        />
        {/* Shirt shadow */}
        <path
          d="M60 58 C40 58 30 68 30 80 L30 122 C30 124 42 126 60 126 L60 58 Z"
          fill="#000"
          opacity="0.06"
        />
        {/* Collar / neckline */}
        <path d="M50 58 Q60 64 70 58" fill="none" stroke={skin} strokeWidth="3" strokeLinecap="round" />

        {/* Shirt-specific details */}
        {eq.outfit === "hero_outfit_none" && (
          <>
            {/* Simple tee */}
            <rect x="46" y="72" width="28" height="3" rx="1.5" fill="#000" opacity="0.08" />
            <path d="M46 85 Q60 90 74 85" fill="none" stroke="#000" strokeWidth="0.5" opacity="0.08" />
          </>
        )}
        {eq.outfit === "hero_tshirt" && (
          <>
            <rect x="34" y="68" width="52" height="4" rx="2" fill="#000" opacity="0.1" />
            <text x="60" y="100" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#fff" opacity="0.3">⚡</text>
          </>
        )}
        {eq.outfit === "hero_hoodie" && (
          <>
            <rect x="38" y="78" width="44" height="20" rx="4" fill="#000" opacity="0.12" />
            <path d="M48 78 L48 98 M72 78 L72 98" stroke="#fff" strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
            <path d="M52 58 Q60 62 68 58" fill="none" stroke="#000" strokeWidth="1" opacity="0.1" />
          </>
        )}
        {eq.outfit === "hero_jersey" && (
          <>
            <path d="M40 64 L40 122 M80 64 L80 122" stroke="#000" strokeWidth="2" opacity="0.12" />
            <circle cx="60" cy="92" r="8" fill="#fff" opacity="0.3" />
            <text x="60" y="96" textAnchor="middle" fontSize="12" fontWeight="bold" fill={outfitColor}>7</text>
          </>
        )}
        {eq.outfit === "hero_suit" && (
          <>
            <path d="M60 60 L52 80 L60 100 L68 80 Z" fill="#ef4444" opacity="0.8" />
            <path d="M42 64 L52 80 L60 68 L68 80 L78 64" stroke="#fff" strokeWidth="2" fill="none" opacity="0.5" />
          </>
        )}
        {eq.outfit === "hero_kimono" && (
          <>
            <path d="M42 58 L60 126" stroke="#000" strokeWidth="1" opacity="0.15" />
            <path d="M78 58 L60 126" stroke="#000" strokeWidth="1" opacity="0.15" />
            <rect x="48" y="90" width="24" height="6" rx="3" fill="#000" opacity="0.2" />
          </>
        )}
        {eq.outfit === "hero_ninja" && (
          <>
            <rect x="34" y="62" width="52" height="2" fill="#000" opacity="0.2" />
            <path d="M50 58 Q60 64 70 58" fill={skin} opacity="0.3" />
          </>
        )}
      </g>

      {/* ── ARMS ── */}
      <g>
        {/* Left arm */}
        <rect x="18" y="64" width="16" height="44" rx="8" fill={skin} />
        <rect x="18" y="64" width="16" height="44" rx="8" fill="#000" opacity="0.05" />
        {/* Left hand */}
        <circle cx="26" cy="112" r="7" fill={skin} />
        <circle cx="26" cy="112" r="7" fill="#000" opacity="0.04" />

        {/* Right arm */}
        <rect x="86" y="64" width="16" height="44" rx="8" fill={skin} />
        <rect x="86" y="64" width="16" height="44" rx="8" fill="#000" opacity="0.05" />
        {/* Right hand */}
        <circle cx="94" cy="112" r="7" fill={skin} />
        <circle cx="94" cy="112" r="7" fill="#000" opacity="0.04" />

        {/* Sleeve overlay on arms if outfit covers */}
        {eq.outfit !== "hero_outfit_none" && (
          <>
            <rect x="18" y="64" width="16" height="18" rx="8" fill={outfitColor} opacity="0.9" />
            <rect x="86" y="64" width="16" height="18" rx="8" fill={outfitColor} opacity="0.9" />
          </>
        )}

        {/* ── WATCH (left wrist) ── */}
        {eq.watch !== "hero_watch_none" && (
          <g>
            {eq.watch === "hero_watch_classic" && (
              <>
                <rect x="17" y="105" width="18" height="9" rx="3" fill="#c0c0c0" stroke="#9ca3af" strokeWidth="1" />
                <circle cx="26" cy="109.5" r="3.5" fill="#1f2937" stroke="#c0c0c0" strokeWidth="0.8" />
                <line x1="26" y1="109.5" x2="26" y2="107.5" stroke="#e5e7eb" strokeWidth="0.6" strokeLinecap="round" />
                <line x1="26" y1="109.5" x2="28" y2="109.5" stroke="#e5e7eb" strokeWidth="0.6" strokeLinecap="round" />
              </>
            )}
            {eq.watch === "hero_watch_gold" && (
              <>
                <rect x="17" y="105" width="18" height="9" rx="3" fill="#d97706" stroke="#b45309" strokeWidth="1" />
                <circle cx="26" cy="109.5" r="3.5" fill="#422006" stroke="#f59e0b" strokeWidth="0.8" />
                <line x1="26" y1="109.5" x2="26" y2="107.8" stroke="#fde68a" strokeWidth="0.6" strokeLinecap="round" />
                <circle cx="26" cy="109.5" r="0.8" fill="#f59e0b" />
              </>
            )}
            {eq.watch === "hero_watch_smart" && (
              <>
                <rect x="16" y="104" width="20" height="11" rx="3" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
                <rect x="18" y="106" width="16" height="7" rx="2" fill="#0c4a6e" />
                <text x="26" y="111" textAnchor="middle" fontSize="5" fill="#67e8f9" fontWeight="bold">12:45</text>
              </>
            )}
            {eq.watch === "hero_watch_ruby" && (
              <>
                <rect x="17" y="105" width="18" height="9" rx="3" fill="#991b1b" stroke="#ef4444" strokeWidth="1" />
                <circle cx="26" cy="109.5" r="4" fill="#450a0a" stroke="#dc2626" strokeWidth="1" />
                <circle cx="26" cy="109.5" r="2" fill="#ef4444" opacity="0.7" />
              </>
            )}
            {eq.watch === "hero_watch_neon" && (
              <>
                <rect x="16" y="104" width="20" height="11" rx="3" fill="#1e1b4b" stroke="#a855f7" strokeWidth="1.5" />
                <path d="M20 109 L22 107 L24 110 L28 108" stroke="#c084fc" strokeWidth="1" fill="none" strokeLinecap="round" />
              </>
            )}
            {eq.watch === "hero_watch_diamond" && (
              <>
                <rect x="16" y="104" width="20" height="11" rx="2.5" fill="#e2e8f0" stroke="#bae6fd" strokeWidth="1.2" />
                <circle cx="26" cy="109.5" r="3.5" fill="#0f172a" stroke="#e0f2fe" strokeWidth="1" />
                <circle cx="26" cy="109.5" r="1.8" fill="#e0f2fe" opacity="0.5" />
              </>
            )}
            {eq.watch === "hero_watch_royal" && (
              <>
                <circle cx="26" cy="110" r="5" fill="#92400e" stroke="#f59e0b" strokeWidth="1.2" />
                <circle cx="26" cy="110" r="3" fill="#1c1917" stroke="#d97706" strokeWidth="0.6" />
                <path d="M26 104 L26 98 Q24 96 22 98" stroke="#d97706" strokeWidth="0.8" fill="none" />
                <circle cx="22" cy="98" r="1.2" fill="#f59e0b" />
              </>
            )}
          </g>
        )}
      </g>

      {/* ── NECK ── */}
      <rect x="52" y="48" width="16" height="14" rx="6" fill={skin} />
      <rect x="52" y="48" width="16" height="14" rx="6" fill="#000" opacity="0.04" />

      {/* ── HEAD ── */}
      <g>
        {/* Main head */}
        <ellipse cx="60" cy="34" rx="24" ry="26" fill={`url(#body3d-${uid})`} />
        {/* Ears */}
        <ellipse cx="36" cy="36" rx="5" ry="7" fill={skinShadow} />
        <ellipse cx="84" cy="36" rx="5" ry="7" fill={skinShadow} />
        <ellipse cx="36" cy="36" rx="3" ry="5" fill={skin} />
        <ellipse cx="84" cy="36" rx="3" ry="5" fill={skin} />
      </g>

      {/* ── HAIR ── */}
      {eq.hat === "hero_hat_none" && (
        <g>
          {/* Main hair top */}
          <path
            d="M36 30 C36 12 48 6 60 6 C72 6 84 12 84 30 C80 20 72 14 60 14 C48 14 40 20 36 30 Z"
            fill={hair}
          />
          {/* Hair highlight */}
          <path d="M42 18 C46 12 54 10 60 10 C54 14 46 16 42 20 Z" fill={hairHighlight} opacity="0.6" />
          {/* Hair sides */}
          <path d="M36 30 C34 26 34 22 38 18 C36 22 36 26 36 30 Z" fill={hair} />
          <path d="M84 30 C86 26 86 22 82 18 C84 22 84 26 84 30 Z" fill={hair} />
          {/* Spiky top */}
          <path d="M48 8 L52 2 L56 10" fill={hair} />
          <path d="M56 6 L60 0 L64 8" fill={hair} />
          <path d="M64 8 L68 2 L72 12" fill={hair} />
        </g>
      )}

      {/* ── FACE ── */}
      <g>
        {/* Eyebrows */}
        <path d="M46 26 Q50 23 54 26" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M66 26 Q70 23 74 26" stroke={hair} strokeWidth="2.2" fill="none" strokeLinecap="round" />

        {/* Eyes — big cute cartoon eyes */}
        <ellipse cx="50" cy="32" rx="6" ry="6.5" fill="#fff" />
        <ellipse cx="70" cy="32" rx="6" ry="6.5" fill="#fff" />
        <circle cx="51" cy="33" r="4" fill="#1f2937" />
        <circle cx="71" cy="33" r="4" fill="#1f2937" />
        {/* Eye highlights */}
        <circle cx="52.5" cy="31.5" r="1.5" fill="#fff" />
        <circle cx="72.5" cy="31.5" r="1.5" fill="#fff" />
        <circle cx="49" cy="34" r="0.8" fill="#fff" opacity="0.6" />
        <circle cx="69" cy="34" r="0.8" fill="#fff" opacity="0.6" />

        {/* Cheek blush */}
        <ellipse cx="40" cy="40" rx="5" ry="3" fill="#fca5a5" opacity="0.45" />
        <ellipse cx="80" cy="40" rx="5" ry="3" fill="#fca5a5" opacity="0.45" />

        {/* Nose */}
        <path d="M58 38 Q60 41 62 38" stroke={skinShadow} strokeWidth="1.5" fill="none" strokeLinecap="round" />

        {/* Mouth — cute smile */}
        <path d="M52 44 Q60 50 68 44" stroke="#b45309" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <path d="M55 44 Q60 47 65 44" fill="#dc2626" opacity="0.25" />
      </g>

      {/* ── GLASSES (ko'zoynak) ── */}
      {eq.glasses === "hero_rounds" && (
        <g>
          <circle cx="50" cy="32" r="8" fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="1.8" />
          <circle cx="70" cy="32" r="8" fill="rgba(255,255,255,0.12)" stroke="#374151" strokeWidth="1.8" />
          <path d="M58 32 L62 32" stroke="#374151" strokeWidth="1.8" />
          <path d="M42 30 L36 34 M78 30 L84 34" stroke="#374151" strokeWidth="1.8" />
        </g>
      )}
      {eq.glasses === "hero_sunglasses" && (
        <g>
          <rect x="38" y="26" width="22" height="14" rx="5" fill="#111827" />
          <rect x="60" y="26" width="22" height="14" rx="5" fill="#111827" />
          <path d="M60 32 L60 35" stroke="#111827" strokeWidth="2.5" />
          <path d="M39 34 L42 36 M78 34 L81 36" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
        </g>
      )}
      {eq.glasses === "hero_star" && (
        <g>
          <path d="M50 24 L52 29 L57 29.5 L53 33 L54 38 L50 35.5 L46 38 L47 33 L43 29.5 L48 29 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          <path d="M70 24 L72 29 L77 29.5 L73 33 L74 38 L70 35.5 L66 38 L67 33 L63 29.5 L68 29 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
          <path d="M58 32 L62 32" stroke="#f59e0b" strokeWidth="1.4" />
        </g>
      )}
      {eq.glasses === "hero_visor" && (
        <g>
          <rect x="34" y="26" width="52" height="14" rx="7" fill="#0e7490" opacity="0.85" />
          <path d="M38 30 L82 30" stroke="#a5f3fc" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
          <circle cx="60" cy="33" r="2" fill="#67e8f9" />
        </g>
      )}

      {/* ── HAT (kepka/toj) ── */}
      {eq.hat === "hero_cap" && (
        <g>
          <path d="M34 24 C34 8 48 2 60 2 C72 2 86 8 86 24 Z" fill="#38bdf8" />
          <path d="M34 22 L86 22 L86 26 Q60 36 34 26 Z" fill="#0284c7" />
          <circle cx="60" cy="4" r="2.5" fill="#bae6fd" />
        </g>
      )}
      {eq.hat === "hero_beanie" && (
        <g>
          <path d="M34 28 C34 8 48 2 60 2 C72 2 86 8 86 28 Z" fill="#ec4899" />
          <rect x="34" y="24" width="52" height="8" rx="4" fill="#be185d" />
          <circle cx="60" cy="0" r="5" fill="#fbcfe8" />
        </g>
      )}
      {eq.hat === "hero_halo" && (
        <g>
          <ellipse cx="60" cy="4" rx="18" ry="6" fill="none" stroke="#fbbf24" strokeWidth="3.5" />
          <circle cx="60" cy="4" r="2" fill="#fde68a" />
        </g>
      )}
      {eq.hat === "hero_wizard" && (
        <g>
          <path d="M60 -8 L80 24 L76 28 L60 14 L44 28 L40 24 Z" fill="#7c3aed" />
          <ellipse cx="60" cy="26" rx="22" ry="5" fill="#6d28d9" />
          <circle cx="52" cy="12" r="2" fill="#fbbf24" />
          <circle cx="68" cy="8" r="1.8" fill="#fbbf24" />
        </g>
      )}
      {eq.hat === "hero_crown" && (
        <g>
          <path d="M36 26 L36 8 L46 16 L52 4 L60 12 L68 4 L74 16 L84 8 L84 26 Z" fill="#f59e0b" />
          <rect x="36" y="24" width="48" height="6" rx="2.5" fill="#d97706" />
          <circle cx="48" cy="16" r="2" fill="#ef4444" />
          <circle cx="60" cy="10" r="2" fill="#38bdf8" />
          <circle cx="72" cy="16" r="2" fill="#22c55e" />
        </g>
      )}
    </svg>
  );
}
