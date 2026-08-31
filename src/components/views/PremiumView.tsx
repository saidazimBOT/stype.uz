"use client";

import { useMemo, useState } from "react";
import { FaCrown } from "react-icons/fa6";
import { FiArrowLeft } from "react-icons/fi";

const TG_URL = "https://t.me/said_khujayev";

const PLANS = [
  { id: "1month", label: "1 oylik", price: "$1", color: "#f59e0b", emoji: "💎", months: "1 oy admin huquqi" },
  { id: "2month", label: "2 oylik", price: "$2", color: "#ec4899", emoji: "⭐", popular: true, months: "2 oy admin huquqi" },
  { id: "1year", label: "1 yillik", price: "$5", color: "#22c55e", emoji: "👑", months: "12 oy admin huquqi" },
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
    })), []
  );

  const handleBuy = (plan: (typeof PLANS)[number]) => {
    const msg = encodeURIComponent(`Salom! Men ${plan.label} Premium sotib olmoqchiman (${plan.price}). Iltimos, tasdiqlang!`);
    window.open(`${TG_URL}?text=${msg}`, "_blank");
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <FaCrown size={22} style={{ color: "#fbbf24" }} />
          Premium Admin
        </h2>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400 flex items-center gap-1">
          <FiArrowLeft size={14} /> Orqaga
        </button>
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-3xl p-8 text-center mb-6"
        style={{ background: "linear-gradient(160deg, #1a1204, #0f0a02, #1a0a2e)", border: "1px solid #fbbf2433", boxShadow: "0 0 80px #fbbf2422" }}>

        {/* Sparkles */}
        {sparkles.map((s) => (
          <span key={s.id} className="absolute rounded-full pointer-events-none"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)", animation: `premiumSparkle ${s.duration}s ease-in-out ${s.delay}s infinite` }} />
        ))}

        <div className="text-6xl mb-3">👑</div>
        <h3 className="text-3xl font-extrabold mb-2" style={{ background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fbbf24)", backgroundSize: "200%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", animation: "shine 3s linear infinite" }}>
          Premium Admin
        </h3>
        <p className="text-sm text-gray-400 max-w-md mx-auto">
          Telegram orqali to'lov qiling — shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'ling!
        </p>
      </div>

      {/* Narxlar */}
      <div className="space-y-3 mb-6">
        {PLANS.map((plan) => (
          <button key={plan.id} onClick={() => setSelected(plan.id)}
            className="w-full flex items-center justify-between p-5 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: selected === plan.id ? `${plan.color}15` : "rgba(255,255,255,0.03)", border: `1.5px solid ${selected === plan.id ? `${plan.color}55` : "rgba(255,255,255,0.08)"}` }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${plan.color}22` }}>
                {plan.emoji}
              </div>
              <div className="text-left">
                <div className="text-base font-bold text-white">{plan.label}</div>
                <div className="text-xs text-gray-500">{plan.months}</div>
                {plan.popular && <div className="text-[11px] font-bold mt-0.5" style={{ color: plan.color }}>🔥 ENG OMADLI</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
            </div>
          </button>
        ))}
      </div>

      {/* Sotvolish tugmasi */}
      <button onClick={() => { const p = PLANS.find((x) => x.id === selected); if (p) handleBuy(p); }}
        disabled={!selected}
        className={`w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2.5 transition-all ${selected ? "hover:scale-[1.02] active:scale-95" : "opacity-40 cursor-not-allowed"}`}
        style={{ background: selected ? "linear-gradient(135deg, #229ed9, #1a7ab5)" : "#333", color: "#fff", boxShadow: selected ? "0 8px 30px #229ed944" : "none" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
        Sotvolish — {selected ? PLANS.find((x) => x.id === selected)?.price : "..."}
      </button>

      {/* Tegda yozuv */}
      <div className="mt-4 p-4 rounded-2xl text-center text-xs text-gray-400"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        🛒 Sotib olsangiz, shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'lasiz!
        <br /><span className="text-gray-500">Telegram orqali tasdiqlanadi 🚀</span>
      </div>

      {/* Foydalar */}
      <div className="mt-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="text-xs font-bold text-amber-400 mb-3">Premium imtiyozlari:</div>
        <div className="space-y-2">
          {["Saytning to'liq Admin huquqlari", "Barcha funksiyalardan foydalanish", "Premium coinlar bilan ta'minlash", "Yangi mavzular va xususiyatlar"].map((item) => (
            <div key={item} className="flex items-center gap-2 text-xs text-gray-400">
              <span className="text-green-400">✓</span> {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
