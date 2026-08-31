"use client";

import { useState, useMemo } from "react";
import { FaCrown } from "react-icons/fa6";

const TG_URL = "https://t.me/said_khujayev";

const PLANS = [
  { id: "1month", label: "1 oylik", price: "$1", color: "#f59e0b", emoji: "💎" },
  { id: "2month", label: "2 oylik", price: "$2", color: "#ec4899", emoji: "⭐", popular: true },
  { id: "1year", label: "1 yillik", price: "$5", color: "#22c55e", emoji: "👑" },
];

interface PremiumButtonProps {
  onClick?: () => void;
}

export default function PremiumButton({ onClick }: PremiumButtonProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const sparkles = useMemo(
    () => Array.from({ length: 6 }, (_, i) => ({
      id: i, left: 10 + Math.random() * 80, top: 5 + Math.random() * 90,
      size: 6 + Math.random() * 8, delay: Math.random() * 2, duration: 1.5 + Math.random() * 1.5,
    })), []
  );

  const handleToggle = () => {
    if (onClick) onClick();
    setOpen((o) => !o);
  };

  const handleBuy = (plan: (typeof PLANS)[number]) => {
    const msg = encodeURIComponent(`Salom! Men ${plan.label} Premium sotib olmoqchiman (${plan.price}). Iltimos, tasdiqlang!`);
    window.open(`${TG_URL}?text=${msg}`, "_blank");
  };

  return (
    <div className="relative">
      {/* Premium tugma */}
      <button
        onClick={handleToggle}
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

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setOpen(false)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="relative w-full max-w-sm rounded-3xl p-6 animate-slide-up max-h-[85vh] overflow-y-auto"
              style={{ background: "linear-gradient(160deg, #1a1204, #0f0a02, #1a0a2e)", border: "1px solid #fbbf2433", boxShadow: "0 0 80px #fbbf2422, 0 25px 60px rgba(0,0,0,0.6)" }}>

              {/* Yopish */}
              <button onClick={() => setOpen(false)} className="absolute top-3 right-3 p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all z-10 text-lg">✕</button>

              {/* Header */}
              <div className="text-center mb-5">
                <div className="text-5xl mb-2">👑</div>
                <h3 className="text-xl font-extrabold mb-1" style={{ background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fbbf24)", backgroundSize: "200%", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", animation: "shine 3s linear infinite" }}>
                  Premium Admin
                </h3>
                <p className="text-xs text-gray-400">Sotib oling — <span className="text-amber-400 font-bold">Admin</span> bo'ling!</p>
              </div>

              {/* Narxlar */}
              <div className="space-y-2.5 mb-4">
                {PLANS.map((plan) => (
                  <button key={plan.id} onClick={() => setSelected(plan.id)}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl transition-all hover:scale-[1.02]"
                    style={{ background: selected === plan.id ? `${plan.color}18` : "rgba(255,255,255,0.04)", border: `1px solid ${selected === plan.id ? `${plan.color}66` : "rgba(255,255,255,0.08)"}` }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${plan.color}22` }}>
                        {plan.emoji}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">{plan.label}</div>
                        {plan.popular && <div className="text-[10px] font-bold" style={{ color: plan.color }}>🔥 ENG OMADLI</div>}
                      </div>
                    </div>
                    <div className="text-lg font-extrabold" style={{ color: plan.color }}>{plan.price}</div>
                  </button>
                ))}
              </div>

              {/* Sotvolish tugmasi */}
              <button onClick={() => { const p = PLANS.find((x) => x.id === selected); if (p) handleBuy(p); }}
                disabled={!selected}
                className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${selected ? "hover:scale-[1.02] active:scale-95" : "opacity-40 cursor-not-allowed"}`}
                style={{ background: selected ? "linear-gradient(135deg, #229ed9, #1a7ab5)" : "#333", color: "#fff", boxShadow: selected ? "0 8px 30px #229ed944" : "none" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" /></svg>
                Sotvolish — {selected ? PLANS.find((x) => x.id === selected)?.price : "..."}
              </button>

              {/* Tegda yozuv */}
              <div className="mt-3 p-3 rounded-xl text-center text-[11px] text-gray-400" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                🛒 Sotib olsangiz, shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'lasiz!
                <br /><span className="text-gray-500">Telegram orqali tasdiqlanadi 🚀</span>
              </div>

              {/* Foydalar */}
              <div className="mt-3 space-y-1.5">
                {["Saytning to'liq Admin huquqlari", "Barcha funksiyalardan foydalanish", "Premium coinlar"].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-[11px] text-gray-400">
                    <span className="text-green-400">✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
