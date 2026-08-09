"use client";

import { useMemo } from "react";
import { FiCheckCircle, FiGift, FiSend, FiShield, FiTrendingUp, FiZap } from "react-icons/fi";
import GiftIcon from "../GiftIcon";
import { getT } from "../../data/i18n";
import type { ThemeColors } from "../../types";

// Telegram: sovg'a olish yoki savollar uchun
const PROMO_TG = "@said_khujayev";
const PROMO_TG_URL = "https://t.me/said_khujayev";
const TARGET_WPM = 200;

interface TelegramPromoProps {
  t: ThemeColors;
  lang: string;
  bestWpm: number;
  onClose: () => void;
}

export default function TelegramPromo({ t, lang, bestWpm, onClose }: TelegramPromoProps) {
  const T = getT(lang);
  const achieved = bestWpm >= TARGET_WPM;
  const progress = Math.min(100, Math.round((bestWpm / TARGET_WPM) * 100));
  const need = Math.max(0, TARGET_WPM - bestWpm);

  // Konfetti (yutuq holatida)
  const confetti = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.2,
        duration: 2.2 + Math.random() * 1.8,
        color: ["#f59e0b", "#ec4899", "#22c55e", "#38bdf8", "#a78bfa"][i % 5],
        rotate: Math.random() * 360,
      })),
    []
  );

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiGift style={{ color: "#f59e0b" }} />
          {T("promo.title")}
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          {T("promo.back")}
        </button>
      </div>

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-center animate-fade-in"
        style={{
          background: "linear-gradient(135deg, #2a1a05, #1a1204)",
          border: "1px solid #f59e0b55",
          boxShadow: "0 0 60px #f59e0b22",
        }}
      >
        {/* Floating sparkles */}
        {["12%", "22%", "80%", "88%"].map((left, i) => (
          <span
            key={i}
            className="absolute text-amber-400 sparkle-float pointer-events-none"
            style={{
              left,
              top: ["18%", "70%", "15%", "75%"][i],
              fontSize: ["14px", "10px", "12px", "16px"][i],
              animationDelay: `${i * 0.4}s`,
            }}
          >
            ✦
          </span>
        ))}

        <div className="trophy-bounce mb-3 inline-flex items-center justify-center">
          <GiftIcon size={72} />
        </div>
        <h3
          className="text-2xl sm:text-3xl font-extrabold mb-2"
          style={{
            background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fbbf24)",
            backgroundSize: "200%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "shine 3s linear infinite",
          }}
        >
          {T("promo.heroTitle", { target: TARGET_WPM })}
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          {T("promo.heroDesc", { target: TARGET_WPM })}{" "}
          {T("promo.skrinHint")}
        </p>

        {/* Progress */}
        <div className="mt-6">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-400 flex items-center gap-1">
              <FiTrendingUp style={{ color: t.accent }} />
              {T("promo.yourBest")}
            </span>
            <span className="font-bold" style={{ color: achieved ? "#22c55e" : "#f59e0b" }}>
              {bestWpm} WPM
            </span>
          </div>
          <div className="h-3 rounded-full bg-white/5 overflow-hidden border border-white/10">
            <div
              className="h-full rounded-full progress-shine"
              style={{
                width: `${Math.max(progress, 3)}%`,
                background: achieved
                  ? "linear-gradient(90deg, #22c55e, #4ade80)"
                  : "linear-gradient(90deg, #f59e0b, #fbbf24)",
              }}
            />
          </div>
          <div className="text-[11px] text-gray-500 mt-2">
            {achieved ? (
              <span className="text-green-400 flex items-center justify-center gap-1">
                <FiZap /> {T("promo.reached")}
              </span>
            ) : (
              <>
                <strong className="text-amber-400">{need} WPM</strong>{" "}
                {T("promo.needMore", { need })}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Achieved celebration / CTA */}
      {achieved ? (
        <div
          className="relative mt-6 rounded-2xl p-6 text-center overflow-hidden animate-fade-in"
          style={{ background: "#ffffff08", border: "1px solid #22c55e44" }}
        >
          {/* Confetti */}
          {confetti.map((c) => (
            <span
              key={c.id}
              className="confetti-piece"
              style={{
                left: `${c.left}%`,
                background: c.color,
                animationDelay: `${c.delay}s`,
                animationDuration: `${c.duration}s`,
                transform: `rotate(${c.rotate}deg)`,
              }}
            />
          ))}
          <div className="text-5xl mb-3">🎉</div>
          <h4 className="text-xl font-bold text-white mb-1">{T("promo.congrats")}</h4>
          <p className="text-sm text-gray-400 mb-4">
            {T("promo.achievedDesc", { wpm: bestWpm })}
          </p>
          <a
            href={PROMO_TG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: "#229ed9", color: "#fff" }}
          >
            <FiSend />
            Telegram: {PROMO_TG}
          </a>
        </div>
      ) : (
        <div
          className="mt-6 rounded-2xl p-6 text-center animate-fade-in"
          style={{ background: "#ffffff08", border: "1px solid #f59e0b33" }}
        >
          <div className="text-4xl mb-3">🎯</div>
          <h4 className="text-lg font-bold text-white mb-1">{T("promo.almost")}</h4>
          <p className="text-sm text-gray-400 mb-4">
            {T("promo.almostDesc", { target: TARGET_WPM })}
          </p>
          <a
            href={PROMO_TG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 active:scale-95"
            style={{ background: "#229ed918", border: "1px solid #229ed955", color: "#5fb8e8" }}
          >
            <FiSend />
            {T("promo.questions", { tg: PROMO_TG })}
          </a>
        </div>
      )}

      {/* Trust / rules */}
      <div className="mt-6 rounded-2xl p-5" style={{ background: "#ffffff05", border: "1px solid #ffffff14" }}>
        <div className="flex items-center gap-2 font-medium text-sm mb-3" style={{ color: t.accent }}>
          <FiShield />
          {T("promo.trust")}
        </div>
        <ul className="space-y-2 text-xs text-gray-400">
          {[T("promo.rule1"), T("promo.rule2"), T("promo.rule3"), T("promo.rule4")].map((rule) => (
            <li key={rule} className="flex items-start gap-2">
              <FiCheckCircle className="mt-0.5 flex-shrink-0" style={{ color: "#22c55e" }} />
              {rule}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
