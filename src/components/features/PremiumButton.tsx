"use client";

import { useMemo } from "react";
import { FaCrown } from "react-icons/fa6";

interface PremiumButtonProps {
  onClick?: () => void;
}

export default function PremiumButton({ onClick }: PremiumButtonProps) {
  const sparkles = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      id: i, left: 10 + Math.random() * 80, top: 5 + Math.random() * 90,
      size: 6 + Math.random() * 8, delay: Math.random() * 2, duration: 1.5 + Math.random() * 1.5,
    })), []
  );

  return (
    <button
      onClick={onClick}
      className="premium-btn group relative px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-1.5 transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden"
      title="Premium — Admin bo'ling!"
    >
      <span className="premium-btn-bg absolute inset-0 rounded-xl" />
      <span className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
        {sparkles.map((s) => (
          <span key={s.id} className="premium-sparkle absolute rounded-full"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s`, animationDuration: `${s.duration}s` }} />
        ))}
      </span>
      <span className="premium-glow absolute inset-0 rounded-xl pointer-events-none" />
      <span className="relative z-10 flex items-center gap-1.5">
        <FaCrown size={14} className="premium-crown drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
        <span className="hidden sm:inline premium-text">Premium</span>
      </span>
    </button>
  );
}
