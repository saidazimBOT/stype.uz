"use client";

import { useState, useEffect, useCallback } from "react";
import { FaGamepad, FaCheck, FaXmark, FaClock, FaFire, FaBolt } from "react-icons/fa6";
import type { ThemeColors, ChallengeInvite } from "../../types";
import { updateChallengeStatus } from "../../lib/challengeBridge";

interface ChallengeInviteBannerProps {
  t: ThemeColors;
  invite: ChallengeInvite;
  onAccept: (invite: ChallengeInvite) => void;
  onDecline: (inviteId: string) => void;
  onExpired: (inviteId: string) => void;
}

/**
 * Tepada ko'rsatiladigan challenge invite banner'i.
 * 30 soniya ichida javob berilmasa — avtomatik muddati tugaydi.
 * Animatsiya bilan paydo bo'lib, qabul/rad etish tugmalari bilan.
 */
export default function ChallengeInviteBanner({
  t,
  invite,
  onAccept,
  onDecline,
  onExpired,
}: ChallengeInviteBannerProps) {
  const [timeLeft, setTimeLeft] = useState(30);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Paydo bo'lish animatsiyasi
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExpired = useCallback(() => {
    setLeaving(true);
    setTimeout(() => onExpired(invite.id), 400);
  }, [invite.id, onExpired]);

  const handleAccept = useCallback(async () => {
    await updateChallengeStatus({
      inviteId: invite.id,
      toUserId: invite.fromUserId,
      status: "accepted",
    });
    setLeaving(true);
    setTimeout(() => onAccept(invite), 400);
  }, [invite, onAccept]);

  const handleDecline = useCallback(async () => {
    await updateChallengeStatus({
      inviteId: invite.id,
      toUserId: invite.fromUserId,
      status: "declined",
    });
    setLeaving(true);
    setTimeout(() => onDecline(invite.id), 400);
  }, [invite, onDecline]);

  const progressPct = (timeLeft / 30) * 100;
  const isUrgent = timeLeft <= 10;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ease-out"
      style={{
        transform: visible && !leaving ? "translateY(0)" : "translateY(-120%)",
        opacity: visible && !leaving ? 1 : 0,
      }}
    >
      {/* Background blur */}
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(135deg, ${t.accent}dd, ${t.accent}88)`,
          backdropFilter: "blur(20px)",
        }}
      />

      {/* Content */}
      <div className="relative max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 animate-bounce"
            style={{ background: "#ffffff22" }}
          >
            <FaGamepad size={20} className="text-white" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-white">
                🔥 {invite.fromUsername} sizni challenge ga taklif qildi!
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-white/70 mt-0.5">
              <span className="flex items-center gap-1">
                <FaBolt size={9} /> {invite.lang.toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <FaClock size={9} /> {invite.duration}s
              </span>
              <span className={`flex items-center gap-1 font-bold ${isUrgent ? "text-white animate-pulse" : ""}`}>
                ⏱ {timeLeft}s
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAccept}
              className="px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
              style={{ background: "#ffffff22", color: "#fff", border: "1px solid #ffffff33" }}
            >
              <FaCheck size={12} /> Qabul qilish
            </button>
            <button
              onClick={handleDecline}
              className="p-2 rounded-xl transition-all hover:scale-105 active:scale-95"
              style={{ background: "#ffffff11", color: "#ffffffaa" }}
              title="Rad etish"
            >
              <FaXmark size={14} />
            </button>
          </div>
        </div>

        {/* Progress bar — qancha vaqt qoldi */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <div
            className="h-full transition-all duration-1000 ease-linear"
            style={{
              width: `${progressPct}%`,
              background: isUrgent ? "#ef4444" : "#ffffffcc",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// CHALLENGE RESULT BANNER (Natija ko'rsatilganda)
// ═══════════════════════════════════════════════════════════════════════

interface ChallengeResultBannerProps {
  t: ThemeColors;
  opponentName: string;
  myWpm: number;
  myAccuracy: number;
  opponentWpm: number;
  opponentAccuracy: number;
  onClose: () => void;
}

/**
 * Challenge tugagandan keyin natija banner'i.
 */
export function ChallengeResultBanner({
  t,
  opponentName,
  myWpm,
  myAccuracy,
  opponentWpm,
  opponentAccuracy,
  onClose,
}: ChallengeResultBannerProps) {
  const [visible, setVisible] = useState(false);
  const iWon = myWpm > opponentWpm;
  const isDraw = myWpm === opponentWpm;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500"
      style={{
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(10px)",
        opacity: visible ? 1 : 0,
      }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-3xl p-6 text-center transition-all duration-500"
        style={{
          background: t.surface,
          border: `2px solid ${iWon ? "#fbbf24" : isDraw ? "#6b7280" : "#38bdf8"}44`,
          transform: visible ? "scale(1)" : "scale(0.8)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Trophy */}
        <div className="text-6xl mb-4">
          {iWon ? "🏆" : isDraw ? "🤝" : "💪"}
        </div>
        <h3 className="text-xl font-bold text-white mb-1">
          {iWon ? "G'alaba!" : isDraw ? "Durrang!" : "Yaxshi urinish!"}
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          {iWon
            ? `${opponentName} ni yengdingiz!`
            : isDraw
              ? `${opponentName} bilan teng o'ynadingiz!`
              : `${opponentName} tezroq yozdi!`}
        </p>

        {/* Results comparison */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          {/* Me */}
          <div className="p-3 rounded-xl" style={{ background: t.accent + "11", border: `1px solid ${t.accent}33` }}>
            <div className="text-[10px] text-gray-500 uppercase mb-1">Siz</div>
            <div className="text-2xl font-bold" style={{ color: t.accent }}>{myWpm}</div>
            <div className="text-xs text-gray-500">WPM · {myAccuracy}%</div>
          </div>
          {/* Opponent */}
          <div className="p-3 rounded-xl" style={{ background: "#ffffff08", border: "1px solid #ffffff14" }}>
            <div className="text-[10px] text-gray-500 uppercase mb-1">{opponentName}</div>
            <div className="text-2xl font-bold text-white">{opponentWpm}</div>
            <div className="text-xs text-gray-500">WPM · {opponentAccuracy}%</div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: t.accent, color: "#000" }}
        >
          Davom etish
        </button>
      </div>
    </div>
  );
}
