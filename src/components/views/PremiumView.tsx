"use client";

import { useMemo, useState, useEffect } from "react";
import { FaCrown, FaGem, FaStar, FaFire, FaRocket } from "react-icons/fa6";
import { FiArrowLeft, FiShoppingBag, FiCheck } from "react-icons/fi";
import type { IconType } from "react-icons";

const TG_URL = "https://t.me/said_khujayev";

const PLANS = [
  { id: "1month", label: "1 oylik", price: "$1", color: "#f59e0b", icon: FaGem as IconType, months: "1 oy admin huquqi" },
  { id: "2month", label: "2 oylik", price: "$2", color: "#ec4899", icon: FaStar as IconType, popular: true, months: "2 oy admin huquqi" },
  { id: "1year", label: "1 yillik", price: "$5", color: "#22c55e", icon: FaCrown as IconType, months: "12 oy admin huquqi" },
];

interface PremiumViewProps {
  onClose: () => void;
}

export default function PremiumView({ onClose }: PremiumViewProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so CSS transition kicks in after mount
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Floating sparkle particles
  const sparkles = useMemo(
    () =>
      Array.from({ length: 35 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        top: Math.random() * 100,
        size: 3 + Math.random() * 12,
        delay: Math.random() * 4,
        duration: 2 + Math.random() * 3,
        drift: (Math.random() - 0.5) * 40,
      })),
    [],
  );

  // Floating gold rings around the crown
  const rings = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => ({
        id: i,
        size: 80 + i * 40,
        delay: i * 0.3,
        duration: 3 + i * 0.5,
      })),
    [],
  );

  const handleBuy = (plan: (typeof PLANS)[number]) => {
    const msg = encodeURIComponent(
      `Salom! Men ${plan.label} Premium sotib olmoqchiman (${plan.price}). Iltimos, tasdiqlang!`,
    );
    window.open(`${TG_URL}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto relative">
      {/* ── INLINE KEYFRAMES ── */}
      <style>{`
        /* ===== ENTRANCE ANIMATIONS ===== */
        @keyframes premiumFadeInUp {
          from { opacity: 0; transform: translateY(30px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes premiumPopIn {
          0%   { opacity: 0; transform: scale(0.3) rotate(-15deg); }
          60%  { transform: scale(1.15) rotate(3deg); }
          80%  { transform: scale(0.95) rotate(-1deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes premiumSlideRight {
          from { opacity: 0; transform: translateX(50px) scale(0.9); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes premiumSlideLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes premiumScaleIn {
          from { opacity: 0; transform: scale(0.6); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* ===== CROWN FLOAT + GLOW RING ===== */
        @keyframes crownFloat {
          0%, 100% { transform: translateY(0) rotate(0deg) scale(1); }
          20% { transform: translateY(-8px) rotate(5deg) scale(1.03); }
          40% { transform: translateY(-4px) rotate(-3deg) scale(1.01); }
          60% { transform: translateY(-10px) rotate(4deg) scale(1.04); }
          80% { transform: translateY(-3px) rotate(-2deg) scale(1.01); }
        }
        @keyframes crownGlowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.9; transform: scale(1.15); }
        }
        @keyframes crownRing {
          0% { opacity: 0.6; transform: scale(0.8); }
          50% { opacity: 0.2; transform: scale(1.2); }
          100% { opacity: 0; transform: scale(1.5); }
        }

        /* ===== SPARKLE FLOAT ===== */
        @keyframes sparkleFloat {
          0%   { opacity: 0; transform: translateY(0) scale(0); }
          20%  { opacity: 1; transform: translateY(-10px) scale(1); }
          80%  { opacity: 0.8; transform: translateY(-40px) scale(0.8); }
          100% { opacity: 0; transform: translateY(-60px) scale(0); }
        }

        /* ===== SHIMMER TEXT ===== */
        @keyframes premiumTextShine {
          0%   { background-position: -300% center; }
          100% { background-position: 300% center; }
        }

        /* ===== HERO GRADIENT SHIFT ===== */
        @keyframes heroGradientShift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        /* ===== CARD HOVER LIFT ===== */
        @keyframes cardHoverGlow {
          0%, 100% { box-shadow: 0 0 20px var(--card-glow); }
          50%      { box-shadow: 0 0 40px var(--card-glow), 0 0 80px var(--card-glow); }
        }

        /* ===== BENEFIT CHECK BOUNCE ===== */
        @keyframes checkBounce {
          0%   { transform: scale(0) rotate(-45deg); }
          50%  { transform: scale(1.3) rotate(10deg); }
          70%  { transform: scale(0.9) rotate(-5deg); }
          100% { transform: scale(1) rotate(0deg); }
        }

        /* ===== BUY BUTTON PULSE ===== */
        @keyframes buyPulse {
          0%, 100% { box-shadow: 0 4px 20px #229ed944; }
          50%      { box-shadow: 0 4px 40px #229ed988, 0 0 80px #229ed933; }
        }

        /* ===== BACKGROUND AURORA ===== */
        @keyframes premiumAurora {
          0%   { transform: rotate(0deg) scale(1); opacity: 0.3; }
          33%  { transform: rotate(120deg) scale(1.1); opacity: 0.5; }
          66%  { transform: rotate(240deg) scale(0.9); opacity: 0.4; }
          100% { transform: rotate(360deg) scale(1); opacity: 0.3; }
        }

        /* ===== SCALE BURST ON PLAN SELECT ===== */
        @keyframes selectBurst {
          0%   { transform: scale(1); }
          30%  { transform: scale(0.97); }
          60%  { transform: scale(1.02); }
          100% { transform: scale(1); }
        }

        /* ===== POPULAR BADGE PULSE ===== */
        @keyframes popularPulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.08); }
        }
      `}</style>

      {/* ── AURORA BACKGROUND ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl" style={{ opacity: visible ? 1 : 0, transition: "opacity 1.2s ease" }}>
        <div
          className="absolute"
          style={{
            width: 500,
            height: 500,
            top: "-15%",
            left: "-10%",
            background: "radial-gradient(circle, rgba(251,191,36,0.15), transparent 70%)",
            animation: "premiumAurora 12s ease-in-out infinite",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 400,
            height: 400,
            bottom: "-10%",
            right: "-8%",
            background: "radial-gradient(circle, rgba(236,72,153,0.12), transparent 70%)",
            animation: "premiumAurora 15s ease-in-out infinite reverse",
            filter: "blur(50px)",
          }}
        />
      </div>

      {/* ── FLOATING SPARKLES ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {sparkles.map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size,
              height: s.size,
              background: `radial-gradient(circle, #fbbf24 0%, #f59e0b 40%, transparent 70%)`,
              animation: `sparkleFloat ${s.duration}s ease-in-out ${s.delay}s infinite`,
              filter: "blur(0.5px)",
            }}
          />
        ))}
      </div>

      {/* ── HEADER ── */}
      <div
        className="flex items-center justify-between mb-6 relative z-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <span className="relative inline-flex items-center justify-center">
            <FaCrown size={22} style={{ color: "#fbbf24", animation: "crownFloat 3s ease-in-out infinite" }} />
            {/* Glow behind crown */}
            <span
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(251,191,36,0.5), transparent 70%)",
                animation: "crownGlowPulse 2s ease-in-out infinite",
                filter: "blur(8px)",
              }}
            />
          </span>
          Premium Admin
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1 transition-all duration-300 hover:text-white hover:scale-105"
        >
          <FiArrowLeft size={14} /> Orqaga
        </button>
      </div>

      {/* ── HERO CARD ── */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-center mb-6"
        style={{
          background: "linear-gradient(160deg, #1a1204, #0f0a02, #1a0a2e, #0f0a02, #1a1204)",
          backgroundSize: "400% 400%",
          border: "1px solid #fbbf2433",
          boxShadow: visible
            ? "0 0 80px #fbbf2422, 0 20px 60px rgba(0,0,0,0.5)"
            : "none",
          animation: "heroGradientShift 8s ease-in-out infinite, premiumFadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both",
        }}
      >
        {/* Inner sparkles */}
        {sparkles.slice(0, 20).map((s) => (
          <span
            key={s.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: `${s.left}%`,
              top: `${s.top}%`,
              width: s.size * 0.8,
              height: s.size * 0.8,
              background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)",
              animation: `sparkleFloat ${s.duration * 1.2}s ease-in-out ${s.delay}s infinite`,
            }}
          />
        ))}

        {/* Crown with rings */}
        <div className="mb-4 flex justify-center relative">
          {/* Expanding rings */}
          {rings.map((r) => (
            <span
              key={r.id}
              className="absolute rounded-full border border-amber-500/20"
              style={{
                width: r.size,
                height: r.size,
                top: "50%",
                left: "50%",
                marginTop: -r.size / 2,
                marginLeft: -r.size / 2,
                animation: `crownRing ${r.duration}s ease-out ${r.delay}s infinite`,
              }}
            />
          ))}
          {/* Main crown */}
          <div
            className="relative z-10"
            style={{ animation: "premiumPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.3s both" }}
          >
            <FaCrown
              size={72}
              style={{
                color: "#fbbf24",
                filter: "drop-shadow(0 0 20px rgba(251,191,36,0.6)) drop-shadow(0 0 40px rgba(251,191,36,0.3))",
                animation: "crownFloat 3.5s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Title with shimmer */}
        <h3
          className="text-3xl font-extrabold mb-3"
          style={{
            background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fcd34d, #fef3c7, #fbbf24)",
            backgroundSize: "300%",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            animation: "premiumTextShine 4s linear infinite",
            textShadow: "none",
          }}
        >
          Premium Admin
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
          Telegram orqali to&apos;lov qiling — shu saytning{" "}
          <span className="text-amber-400 font-bold relative">
            Admin
            <span
              className="absolute -bottom-0.5 left-0 right-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent, #fbbf24, transparent)" }}
            />
          </span>{" "}
          bo&apos;ling!
        </p>
      </div>

      {/* ── PRICING CARDS ── */}
      <div className="space-y-3 mb-6 relative z-10">
        {PLANS.map((plan, i) => {
          const isSelected = selected === plan.id;
          return (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className="w-full flex items-center justify-between p-5 rounded-2xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] group"
              style={{
                background: isSelected ? `${plan.color}12` : "rgba(255,255,255,0.03)",
                border: `1.5px solid ${isSelected ? `${plan.color}66` : "rgba(255,255,255,0.08)"}`,
                animation: `premiumSlideRight 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.3 + i * 0.12}s both${isSelected ? ", selectBurst 0.3s ease" : ""}`,
                "--card-glow": `${plan.color}33`,
                boxShadow: isSelected
                  ? `0 0 30px ${plan.color}22, 0 8px 32px rgba(0,0,0,0.3)`
                  : "0 4px 16px rgba(0,0,0,0.2)",
              } as React.CSSProperties}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6"
                  style={{
                    background: `${plan.color}22`,
                    boxShadow: isSelected ? `0 0 20px ${plan.color}33` : "none",
                  }}
                >
                  <plan.icon
                    size={26}
                    style={{
                      color: plan.color,
                      transition: "all 0.3s ease",
                      filter: isSelected ? `drop-shadow(0 0 8px ${plan.color})` : "none",
                    }}
                  />
                </div>
                <div className="text-left">
                  <div className="text-base font-bold text-white">{plan.label}</div>
                  <div className="text-xs text-gray-500">{plan.months}</div>
                  {plan.popular && (
                    <div
                      className="text-[11px] font-bold mt-0.5 flex items-center gap-1"
                      style={{
                        color: plan.color,
                        animation: "popularPulse 2s ease-in-out infinite",
                      }}
                    >
                      <FaFire size={11} /> ENG OMADLI
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-2xl font-extrabold transition-all duration-300"
                  style={{
                    color: plan.color,
                    textShadow: isSelected ? `0 0 12px ${plan.color}66` : "none",
                  }}
                >
                  {plan.price}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── BUY BUTTON ── */}
      <button
        onClick={() => {
          const p = PLANS.find((x) => x.id === selected);
          if (p) handleBuy(p);
        }}
        disabled={!selected}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all duration-300 relative overflow-hidden ${
          selected ? "hover:scale-[1.02] active:scale-95" : "opacity-40 cursor-not-allowed"
        }`}
        style={{
          background: selected ? "linear-gradient(135deg, #229ed9, #1a7ab5, #229ed9)" : "#333",
          backgroundSize: "200% 200%",
          color: "#fff",
          animation: selected
            ? "premiumFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both, buyPulse 2.5s ease-in-out infinite"
            : "premiumFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both",
        }}
      >
        {/* Shimmer overlay */}
        {selected && (
          <span
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
              backgroundSize: "200% 100%",
              animation: "premiumTextShine 3s linear infinite",
            }}
          />
        )}
        <FaRocket size={18} className="relative z-10" style={{ animation: selected ? "crownFloat 2s ease-in-out infinite" : "none" }} />
        <span className="relative z-10">
          Sotvolish — {selected ? PLANS.find((x) => x.id === selected)?.price : "..."}
        </span>
      </button>

      {/* ── TEGDA YOZUV ── */}
      <div
        className="mt-4 p-4 rounded-2xl text-center text-xs text-gray-400 flex items-center justify-center gap-2 flex-wrap relative z-10"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "premiumFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.75s both",
        }}
      >
        <FiShoppingBag size={13} className="text-gray-500" /> Sotib olsangiz, shu saytning{" "}
        <span className="text-amber-400 font-bold">Admin</span> bo&apos;lasiz!
        <span className="text-gray-500 flex items-center gap-1">
          — Telegram orqali tasdiqlanadi <FaRocket size={11} className="text-gray-500" />
        </span>
      </div>

      {/* ── FOYDALAR ── */}
      <div
        className="mt-4 rounded-2xl p-5 relative z-10"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "premiumFadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.85s both",
        }}
      >
        <div className="text-xs font-bold text-amber-400 mb-3 flex items-center gap-2">
          <FaStar size={12} style={{ animation: "crownFloat 2s ease-in-out infinite" }} />
          Premium imtiyozlari:
        </div>
        <div className="space-y-2.5">
          {[
            "Saytning to'liq Admin huquqlari",
            "Barcha funksiyalardan foydalanish",
            "Premium coinlar bilan ta'minlash",
            "Yangi mavzular va xususiyatlar",
          ].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-2.5 text-xs text-gray-400 group/item hover:text-gray-200 transition-colors"
              style={{
                animation: `premiumSlideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${0.9 + i * 0.1}s both`,
              }}
            >
              <span
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{
                  background: "rgba(34,197,94,0.15)",
                  animation: `checkBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) ${1.0 + i * 0.1}s both`,
                }}
              >
                <FiCheck size={11} className="text-green-400" />
              </span>
              {item}
            </div>
          ))}
        </div>
      </div>

      {/* ── BOTTOM SPACER ── */}
      <div className="h-8" />
    </div>
  );
}
