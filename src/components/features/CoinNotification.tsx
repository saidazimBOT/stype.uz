"use client";

import { useEffect, useState } from "react";
import CoinIcon from "../CoinIcon";

export interface CoinNotif {
  id: number;
  amount: number;
  x: number;
  y: number;
  source: "typing" | "game" | "daily" | "challenge";
}

interface CoinNotificationProps {
  notifications: CoinNotif[];
  onDismiss: (id: number) => void;
}

export default function CoinNotification({ notifications, onDismiss }: CoinNotificationProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-[60]">
      {notifications.map((n) => (
        <CoinBubble key={n.id} notif={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function CoinBubble({ notif, onDismiss }: { notif: CoinNotif; onDismiss: (id: number) => void }) {
  const [phase, setPhase] = useState<"enter" | "float" | "exit">("enter");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("float"), 100);
    const t2 = setTimeout(() => setPhase("exit"), 2000);
    const t3 = setTimeout(() => onDismiss(notif.id), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [notif.id, onDismiss]);

  const sourceEmoji = notif.source === "typing" ? "⌨️" : notif.source === "game" ? "🎮" : "📅";
  const sourceLabel = notif.source === "typing" ? "Typing" : notif.source === "game" ? "Game" : "Daily";

  return (
    <div
      className="coin-notif-container"
      style={{
        position: "absolute",
        left: `${Math.min(Math.max(notif.x, 15), 85)}%`,
        top: notif.source === "typing" ? "45%" : "50%",
      }}
    >
      {/* Coin burst particles */}
      <div className="coin-burst">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="coin-particle"
            style={{
              "--angle": `${i * 60}deg`,
              "--delay": `${i * 30}ms`,
              animationDelay: `${i * 30}ms`,
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Main coin badge */}
      <div
        className={`coin-badge ${phase === "exit" ? "coin-badge-exit" : ""}`}
      >
        <div className="coin-icon-wrap">
          <span className="coin-emoji"><CoinIcon size={30} /></span>
          <div className="coin-ring" />
        </div>
        <div className="coin-text">
          <span className="coin-amount">+{notif.amount}</span>
          <span className="coin-source">{sourceEmoji} {sourceLabel}</span>
        </div>
      </div>

      {/* Floating coin trail */}
      <div className="coin-trail">
        {[...Array(4)].map((_, i) => (
          <span
            key={i}
            className="trail-coin"
            style={{ animationDelay: `${i * 120}ms` }}
          >
            <CoinIcon size={14} />
          </span>
        ))}
      </div>
    </div>
  );
}
