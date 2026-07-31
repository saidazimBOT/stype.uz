"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeColors } from "../../types";

const KEY_ROWS: string[][] = [
  ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "Backspace"],
  ["Tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]", "\\"],
  ["Caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'", "Enter"],
  ["Shift", "z", "x", "c", "v", "b", "n", "m", ",", ".", "/", "Shift"],
  ["Ctrl", "Meta", "Alt", "Space", "Alt", "Fn", "Ctrl"],
];

const WIDE_KEYS: Record<string, string> = {
  Backspace: "w-[72px]",
  Tab: "w-[56px]",
  Caps: "w-[68px]",
  Enter: "w-[76px]",
  Shift: "w-[88px]",
  Space: "w-[240px]",
  Ctrl: "w-[52px]",
  Meta: "w-[48px]",
  Alt: "w-[44px]",
  Fn: "w-[40px]",
};

interface KeyboardVisualizerProps {
  t: ThemeColors;
  pressedKeys?: string[];
  showHeatmap?: boolean;
  layout?: string;
}

export default function KeyboardVisualizer({
  t,
  pressedKeys = [],
  showHeatmap = false,
  layout = "qwerty",
}: KeyboardVisualizerProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});

  // Auto-scale keyboard to fit any screen width (100% responsive)
  const wrapRef = useRef<HTMLDivElement>(null);
  const [kbdScale, setKbdScale] = useState(1);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const compute = () => {
      // Natural keyboard width ≈ 690px
      setKbdScale(Math.min(1, el.clientWidth / 690));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      setActiveKeys((prev) => new Set(prev).add(key));
      setHeatmap((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.key.toLowerCase());
        return next;
      });
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  const getKeyStyle = (key: string): React.CSSProperties => {
    const lower = key.toLowerCase();
    const isPressed = activeKeys.has(lower) || pressedKeys.includes(lower);
    const heat = heatmap[lower] || 0;

    if (isPressed) {
      return {
        background: t.accent,
        color: "#000",
        boxShadow: `0 0 15px ${t.accent}66`,
        transform: "scale(0.95)",
      };
    }
    if (showHeatmap && heat > 0) {
      const intensity = Math.min(1, heat / 10);
      const alpha = Math.floor(intensity * 80).toString(16).padStart(2, "0");
      return {
        background: `${t.accent}${alpha}`,
        color: intensity > 0.5 ? "#fff" : "#6b7280",
      };
    }
    return {
      background: "#1a1a24",
      color: "#6b7280",
    };
  };

  const handleKeyClick = (key: string) => {
    setActiveKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  return (
    <div ref={wrapRef} className="w-full">
      <div className="mx-auto overflow-hidden" style={{ width: 690 * kbdScale, height: 224 * kbdScale }}>
        <div
          className="flex flex-col gap-1.5 items-center origin-top"
          style={{ transform: `scale(${kbdScale})` }}
        >
        {KEY_ROWS.map((row, rowIdx) => (
          <div key={rowIdx} className="flex gap-1.5 justify-center">
            {row.map((key) => {
              const wide = WIDE_KEYS[key];
              const isPressed = activeKeys.has(key.toLowerCase());
              return (
                <button
                  key={key}
                  onClick={() => handleKeyClick(key)}
                  className={`h-10 rounded-lg text-xs font-medium transition-all duration-75 flex items-center justify-center ${
                    wide || "w-10"
                  }`}
                  style={{
                    ...getKeyStyle(key),
                    border: `1px solid ${isPressed ? t.accent + "88" : "#ffffff0a"}`,
                    minWidth: key === "Space" ? 200 : wide ? undefined : 36,
                  }}
                >
                  {key === "Space" ? "" : key.length > 4 ? key.slice(0, 4) : key}
                </button>
              );
            })}
          </div>
        ))}
        </div>
      </div>
    </div>
  );
}
