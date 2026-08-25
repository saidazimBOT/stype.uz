"use client";
import type { ThemeColors } from "../../types";
import { FiMessageCircle } from "react-icons/fi";

/** Chat — vaqtincha o'chirilgan (Convex real-time chat Supabase Realtime ga o'tkazilmoqda) */
export default function Chat({ t }: { t: ThemeColors }) {
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
          <FiMessageCircle size={28} />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Chat</h2>
        <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
          Chat tizimi yangilanmoqda. Tez orada Supabase Realtime orqali ishga tushadi.
        </p>
      </div>
    </div>
  );
}
