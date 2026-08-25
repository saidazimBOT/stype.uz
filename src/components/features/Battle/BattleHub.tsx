"use client";
import type { ThemeColors } from "../../../types";
import type { HeroEquip } from "../../../data/shop";
import { FiSend } from "react-icons/fi";

/** Battle — vaqtincha o'chirilgan (Convex real-time multiplayer Supabase Realtime ga o'tkazilmoqda) */
export default function BattleHub({ t, onClose, coinsStore, heroEquip, addXp }: {
  t: ThemeColors;
  onClose?: () => void;
  coinsStore?: { heroEquip: HeroEquip; activeAvatar: string; coins: number };
  heroEquip?: HeroEquip;
  addXp?: (amount: number) => void;
}) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
          <FiSend size={28} />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Multiplayer Battle</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Multiplayer tizimi yangilanmoqda. Tez orada Supabase Realtime orqali 1v1 va Team janglar ishga tushadi.
        </p>
        {onClose && (
          <button onClick={onClose} className="mt-4 px-4 py-2 rounded-lg text-sm hover:bg-white/10 text-gray-400">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}
