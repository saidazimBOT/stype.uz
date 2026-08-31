"use client";

import { useState } from "react";
import { FiCheckCircle, FiX, FiStar } from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import type { SupabaseProfileRow } from "../../lib/supabaseService";
import { isPremiumActive, formatPremiumUntil } from "../../lib/supabaseService";

const TG_URL = "https://t.me/said_khujayev";

const PLANS = [
  {
    id: "1month",
    label: "1 oylik",
    price: "$1",
    priceNum: 1,
    color: "#f59e0b",
    popular: false,
  },
  {
    id: "2month",
    label: "2 oylik",
    price: "$2",
    priceNum: 2,
    color: "#ec4899",
    popular: true,
  },
  {
    id: "1year",
    label: "1 yillik",
    price: "$5",
    priceNum: 5,
    color: "#22c55e",
    popular: false,
  },
];

interface PremiumButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  /** Joriy foydalanuvchining Supabase profili (premium holatini ko'rsatish uchun) */
  userProfile?: SupabaseProfileRow | null;
}

export default function PremiumButton({ isOpen, onToggle, userProfile }: PremiumButtonProps) {
  const [selected, setSelected] = useState<string | null>(null);

  const active = userProfile ? isPremiumActive(userProfile) : false;

  const handleBuy = (plan: (typeof PLANS)[number]) => {
    const msg = encodeURIComponent(
      `Salom! Men ${plan.label} Premium sotib olmoqchiman (${plan.price}). Iltimos, tasdiqlang!`
    );
    window.open(`${TG_URL}?text=${msg}`, "_blank");
  };

  return (
    <div className="relative">
      {/* Premium tugma — animatsiyali */}
      <button
        onClick={onToggle}
        className={`${active ? "premium-active" : "premium-pulse"} px-2.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-110 active:scale-95`}
        title={active ? `Premium faol — ${formatPremiumUntil(userProfile?.premium_until ?? null)}` : "Premium — Admin bo'ling!"}
        style={active ? {
          background: "linear-gradient(90deg, #22c55e33, #4ade80aa, #22c55e33)",
          backgroundSize: "200%",
          border: "1px solid #22c55e66",
          color: "#86efac",
          animation: "premiumShine 2.5s linear infinite",
        } : undefined}
      >
        {active ? (
          <FaCrown size={14} style={{ color: "#4ade80" }} />
        ) : (
          <FiStar size={14} className="premium-icon-spin" style={{ color: "#fbbf24" }} />
        )}
        <span className={`hidden sm:inline ${active ? "text-green-300" : "text-amber-300"}`}>
          {active ? "Premium ✓" : "Premium"}
        </span>
      </button>

      {/* Premium modal/dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onToggle}
          />

          {/* Panel */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div
              className="relative w-full max-w-md rounded-3xl p-6 sm:p-8 animate-slide-up max-h-[90vh] overflow-y-auto"
              style={{
                background: "linear-gradient(160deg, #1a1204 0%, #0f0a02 50%, #1a0a2e 100%)",
                border: "1px solid #fbbf2433",
                boxShadow: "0 0 80px #fbbf2422, 0 25px 60px rgba(0,0,0,0.6)",
              }}
            >
              {/* Yopish tugmasi */}
              <button
                onClick={onToggle}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all z-10"
              >
                <FiX size={18} />
              </button>

              {/* Faol premium holati */}
              {active && userProfile && (
                <div
                  className="mb-5 p-4 rounded-xl text-center"
                  style={{ background: "#22c55e11", border: "1px solid #22c55e33" }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <FaCrown size={18} style={{ color: "#4ade80" }} />
                    <span className="text-sm font-bold text-green-300">Premium Faol!</span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Reja: <span className="text-white font-medium">{userProfile.premium_plan === "1year" ? "1 yillik" : userProfile.premium_plan === "2month" ? "2 oylik" : "1 oylik"}</span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Muddat: <span className="text-green-400 font-medium">{formatPremiumUntil(userProfile.premium_until)}</span>
                  </p>
                  <p className="text-[10px] text-gray-500 mt-2">
                    Admin huquqlari faol — barcha funksiyalardan foydalaning! 🚀
                  </p>
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-6">
                <div className="premium-icon-spin inline-flex mb-3">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
                    style={{
                      background: "linear-gradient(135deg, #fbbf24, #f59e0b)",
                      boxShadow: "0 0 40px #fbbf2444",
                    }}
                  >
                    👑
                  </div>
                </div>
                <h3
                  className="text-2xl font-extrabold mb-1"
                  style={{
                    background: "linear-gradient(90deg, #fbbf24, #fff7cc, #fbbf24)",
                    backgroundSize: "200%",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    animation: "shine 3s linear infinite",
                  }}
                >
                  Premium Admin
                </h3>
                <p className="text-sm text-gray-400">
                  {active
                    ? "Siz allaqachon Premium egasisiz! 🎉"
                    : <>Sotib oling — shu saytning <span className="text-amber-400 font-bold">Admin</span> bo'ling!</>}
                </p>
              </div>

              {/* Narxlar */}
              <div className="space-y-3 mb-5">
                {PLANS.map((plan) => (
                  <button
                    key={plan.id}
                    onClick={() => !active && setSelected(plan.id)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02] ${
                      selected === plan.id ? "ring-2" : ""
                    }`}
                    style={{
                      background:
                        selected === plan.id
                          ? `${plan.color}18`
                          : "rgba(255,255,255,0.04)",
                      border: `1px solid ${
                        selected === plan.id
                          ? `${plan.color}66`
                          : "rgba(255,255,255,0.08)"
                      }`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                        style={{
                          background: `${plan.color}22`,
                          color: plan.color,
                        }}
                      >
                        {plan.popular ? "⭐" : "💎"}
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-bold text-white">
                          {plan.label}
                        </div>
                        {plan.popular && (
                          <div
                            className="text-[10px] font-bold"
                            style={{ color: plan.color }}
                          >
                            🔥 ENG OMADLI
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="text-lg font-extrabold"
                        style={{ color: plan.color }}
                      >
                        {plan.price}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {plan.priceNum <= 1 ? "/oy" : plan.priceNum <= 2 ? "/oy" : "/yil"}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Sotvolish tugmasi */}
              <button
                onClick={() => {
                  const plan = PLANS.find((p) => p.id === selected);
                  if (plan) handleBuy(plan);
                }}
                disabled={!selected || active}
                className={`w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                  selected && !active
                    ? "hover:scale-[1.02] active:scale-95 hover:brightness-110"
                    : "opacity-40 cursor-not-allowed"
                }`}
                style={{
                  background: selected && !active
                    ? "linear-gradient(135deg, #229ed9, #1a7ab5)"
                    : "#333",
                  color: "#fff",
                  boxShadow: selected && !active ? "0 8px 30px #229ed944" : "none",
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="white"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z" />
                </svg>
                {active ? "✅ Premium Faol" : `Sotvolish — ${selected ? PLANS.find((p) => p.id === selected)?.price : "..."}`}
              </button>

              {/* Tegda yozuv */}
              <div
                className="mt-4 p-3 rounded-xl text-center text-xs text-gray-400"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
              >
                {active ? (
                  <>
                    🎉 Sizning Premium hisobingiz <span className="text-green-400 font-bold">faol</span>!
                    <br />
                    <span className="text-gray-500">
                      Admin panel, barcha funksiyalar ochiq 🚀
                    </span>
                  </>
                ) : (
                  <>
                    🛒 Sotib olsangiz, shu saytning{" "}
                    <span className="text-amber-400 font-bold">Admin</span> bo'lasiz va{" "}
                    <span className="text-green-400 font-bold">coin</span> olasiz!
                    <br />
                    <span className="text-gray-500">
                      Istalgan narsani qilishingiz mumkin 🚀
                    </span>
                  </>
                )}
              </div>

              {/* Foydalar ro'yxati */}
              <div className="mt-4 space-y-2">
                {[
                  "Saytning to'liq Admin huquqlari",
                  "Premium coinlar bilan ta'minlash",
                  "Barcha funksiyalardan foydalanish",
                  "Yangi mavzular va xususiyatlar",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <FiCheckCircle size={12} style={{ color: "#22c55e", flexShrink: 0 }} />
                    {item}
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
