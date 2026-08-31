"use client";

import { useMemo, useState } from "react";
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

  const sparkles = useMemo(
    () => Array.from({ length: 20 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 4 + Math.random() * 10,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 2,
    })),
    [],
  );

  const handleBuy = (plan: (typeof PLANS)[number]) => {
    const msg = encodeURIComponent(`Salom! Men ${plan.label} Premium sotib olmoqchiman (${plan.price}). Iltimos, tasdiqlang!`);
    window.open(`${TG_URL}?text=${msg}`, "_blank");
  };

  // Kirish animatsiyasi uchun asosiy CSS
  const anim = {
    fadeInUp: (delay: number) => ({
      animation: `premiumFadeInUp 0.5s ease-out ${delay}s both`,
    } as React.CSSProperties),
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">

      {/* Kirish animatsiyasi — inline keyframe */}
      <style>{`
        @keyframes premiumFadeInUp {
          from { opacity: 0; transform: translateY(24px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes premiumPopIn {
          0%   { opacity: 0; transform: scale(0.6); }
          70%  { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes premiumSlideLeft {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>

      {/* Header */}
      <div className="flex items-center justify-between mb-6" style={anim.fadeInUp(0)}>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaCrown size={22} style={{ color: "#fbbf24" }} />
          Premium Admin
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1">
          <FiArrowLeft size={14} /> Orqaga
        </button>
      </div>

      {/* Hero card */}
      <div
        className="relative overflow-hidden rounded-3xl p-8 text-center mb-6"
        style={{
          background: "linear-gradient(160deg, #1a1204, #0f0a02, #1a0a2e)",
          border: "1px solid #fbbf2433",
          boxShadow: "0 0 80px #fbbf2422",
          animation: "premiumFadeInUp 0.5s ease-out 0.1s both",
        }}
      >
        {/* Sparkles */}
        {sparkles.map((s) => (
          <span key={s.id} className="absolute rounded-full pointer-events-none"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)", animation: `premiumSparkle ${s.duration}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        <div className="mb-3 flex justify-center" style={{ animation: "premiumPopIn 0.6s ease-out 0.3s both" }}>
          <FaCrown size={64} style={{ color: "#fbbf24" }} />
        </div>
        <h3 className="text-3xl font-extrabold mb-2" style={{ background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fbbf24)", backgroundSize: "200%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", animation: "shine 3s linear infinite" }}>
          Premium Admin
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Telegram orqali to'lov qiling — shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'ling!
        </p>
      </div>

      {/* Narxlar */}
      <div className="space-y-3 mb-6">
        {PLANS.map((plan, i) => (
          <button
            key={plan.id}
            onClick={() => setSelected(plan.id)}
            className="w-full flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: selected === plan.id ? `${plan.color}15` : "rgba(255,255,255,0.03)",
              border: `1.5px solid ${selected === plan.id ? `${plan.color}55` : "rgba(255,255,255,0.08)"}`,
              animation: `premiumFadeInUp 0.4s ease-out ${0.25 + i * 0.12}s both`,
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `${plan.color}22` }}>
                <plan.icon size={26} style={{ color: plan.color }} />
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white">{plan.label}</div>
                <div className="text-xs text-gray-500">{plan.months}</div>
                {plan.popular && <div className="text-[11px] font-bold mt-0.5 flex items-center gap-1" style={{ color: plan.color }}><FaFire size={11} /> ENG OMADLI</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Sotvolish tugmasi */}
      <button
        onClick={() => { const p = PLANS.find((x) => x.id === selected); if (p) handleBuy(p); }}
        disabled={!selected}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all ${selected ? "hover:scale-[1.02] active:scale-95" : "opacity-40 cursor-not-allowed"}`}
        style={{
          background: selected ? "linear-gradient(135deg, #229ed9, #1a7ab5)" : "#333",
          color: "#fff",
          boxShadow: selected ? "0 8px 30px #229ed944" : "none",
          animation: "premiumFadeInUp 0.4s ease-out 0.65s both",
        }}
      >
        <FaRocket size={18} />
        Sotvolish — {selected ? PLANS.find((x) => x.id === selected)?.price : "..."}
      </button>

      {/* Tegda yozuv */}
      <div
        className="mt-4 p-4 rounded-2xl text-center text-xs text-gray-400 flex items-center justify-center gap-2 flex-wrap"
        style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "premiumFadeInUp 0.4s ease-out 0.75s both",
        }}
      >
        <FiShoppingBag size={13} className="text-gray-500" /> Sotib olsangiz, shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'lasiz!
        <span className="text-gray-500 flex items-center gap-1">— Telegram orqali tasdiqlanadi <FaRocket size={11} className="text-gray-500" /></span>
      </div>

      {/* Foydalar */}
      <div
        className="mt-4 rounded-2xl p-5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          animation: "premiumFadeInUp 0.4s ease-out 0.85s both",
        }}
      >
        <div className="text-xs font-bold text-amber-400 mb-3">Premium imtiyozlari:</div>
        <div className="space-y-2">
          {["Saytning to'liq Admin huquqlari", "Barcha funksiyalardan foydalanish", "Premium coinlar bilan ta'minlash", "Yangi mavzular va xususiyatlar"].map((item, i) => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-400" style={{ animation: `premiumSlideLeft 0.3s ease-out ${0.9 + i * 0.08}s both` }}>
              <FiCheck size={13} className="text-green-400 flex-shrink-0" /> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
