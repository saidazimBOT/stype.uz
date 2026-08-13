"use client";

import { useState, useEffect, useRef } from "react";
import type { ThemeColors } from "../../types";
import { isDashChar } from "../../utils/typingChars";

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

// ── FINGER GUIDE (touch typing method) ─────────────────────────────────
export type FingerId =
  | "l_pinky"
  | "l_ring"
  | "l_middle"
  | "l_index"
  | "thumb"
  | "r_index"
  | "r_middle"
  | "r_ring"
  | "r_pinky";

export const FINGERS: Record<FingerId, { name: string; short: string; color: string }> = {
  l_pinky: { name: "Left Pinky", short: "L·Pinky", color: "#f87171" },
  l_ring: { name: "Left Ring", short: "L·Ring", color: "#fb923c" },
  l_middle: { name: "Left Middle", short: "L·Middle", color: "#facc15" },
  l_index: { name: "Left Index", short: "L·Index", color: "#a3e635" },
  thumb: { name: "Thumb", short: "Thumb", color: "#a78bfa" },
  r_index: { name: "Right Index", short: "R·Index", color: "#2dd4bf" },
  r_middle: { name: "Right Middle", short: "R·Middle", color: "#38bdf8" },
  r_ring: { name: "Right Ring", short: "R·Ring", color: "#818cf8" },
  r_pinky: { name: "Right Pinky", short: "R·Pinky", color: "#e879f9" },
};

// Legend order: left hand → thumbs → right hand
const FINGER_ORDER: FingerId[] = [
  "l_pinky",
  "l_ring",
  "l_middle",
  "l_index",
  "thumb",
  "r_index",
  "r_middle",
  "r_ring",
  "r_pinky",
];

// Physical QWERTY (US) keys → finger
const FINGER_MAP: Record<string, FingerId> = {
  "`": "l_pinky", "1": "l_pinky", "2": "l_ring", "3": "l_middle", "4": "l_index", "5": "l_index",
  "6": "r_index", "7": "r_index", "8": "r_middle", "9": "r_ring", "0": "r_pinky", "-": "r_pinky", "=": "r_pinky",
  q: "l_pinky", w: "l_ring", e: "l_middle", r: "l_index", t: "l_index",
  y: "r_index", u: "r_index", i: "r_middle", o: "r_ring", p: "r_pinky",
  "[": "r_pinky", "]": "r_pinky", "\\": "r_pinky",
  a: "l_pinky", s: "l_ring", d: "l_middle", f: "l_index", g: "l_index",
  h: "r_index", j: "r_index", k: "r_middle", l: "r_ring", ";": "r_pinky", "'": "r_pinky",
  z: "l_pinky", x: "l_ring", c: "l_middle", v: "l_index", b: "l_index",
  n: "r_index", m: "r_index", ",": "r_middle", ".": "r_ring", "/": "r_pinky",
  " ": "thumb",
};

// Cyrillic (RU/UK) layouts typed on a physical QWERTY keyboard
const CYRILLIC_TO_QWERTY: Record<string, string> = {
  й: "q", ц: "w", у: "e", к: "r", е: "t", н: "y", г: "u", ш: "i", щ: "o", з: "p", х: "[", ъ: "]",
  ф: "a", ы: "s", в: "d", а: "f", п: "g", р: "h", о: "j", л: "k", д: "l", ж: ";", э: "'",
  я: "z", ч: "x", с: "c", м: "v", и: "b", т: "n", ь: "m", б: ",", ю: ".", ё: "`",
  і: "s", ї: "]", є: "'", ґ: "\\",
};

// Resolve any typed char to its physical QWERTY key position
export function toPhysicalKey(ch: string): string {
  if (ch === "Space") return " ";
  const lower = ch.toLowerCase();
  // Tire turlari (—, –, −) klaviaturada yo'q — "-" tugmasi sifatida ko'rsatamiz
  if (isDashChar(lower)) return "-";
  return CYRILLIC_TO_QWERTY[lower] || lower;
}

export function getFinger(ch: string): FingerId | undefined {
  return FINGER_MAP[toPhysicalKey(ch)];
}

const HOME_KEYS = new Set(["f", "j"]);

interface KeyboardVisualizerProps {
  t: ThemeColors;
  pressedKeys?: string[];
  showHeatmap?: boolean;
  layout?: string;
  fingerGuide?: boolean;
  nextKey?: string;
  /** Ekran klaviaturasi bosilganda chaqiriladi — matnga yozish uchun. */
  onKeyPress?: (key: string) => void;
}

export default function KeyboardVisualizer({
  t,
  pressedKeys = [],
  showHeatmap = false,
  layout = "qwerty",
  fingerGuide = false,
  nextKey,
  onKeyPress,
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

  // Next key to type (live hint for beginners)
  const nextKeyLower = nextKey?.toLowerCase();
  const nextFinger = nextKeyLower ? getFinger(nextKeyLower) : undefined;

  const isNextKey = (key: string) => {
    if (!fingerGuide || !nextKeyLower) return false;
    // Compare by physical key position, so Cyrillic chars (ru/uk) also light up
    return toPhysicalKey(key) === toPhysicalKey(nextKeyLower);
  };

  const getKeyStyle = (key: string): React.CSSProperties => {
    const lower = key.toLowerCase();
    const isPressed = activeKeys.has(lower) || pressedKeys.includes(lower);
    const heat = heatmap[lower] || 0;
    const finger = fingerGuide ? getFinger(key) : undefined;
    const fingerColor = finger ? FINGERS[finger].color : undefined;

    if (isNextKey(key)) {
      return {
        background: t.accent,
        color: "#000",
        boxShadow: `0 0 22px ${t.accent}aa, 0 0 3px ${t.accent}`,
        transform: "scale(1.1)",
        zIndex: 10,
      };
    }
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
    if (fingerColor) {
      return {
        background: `${fingerColor}22`,
        color: "#cbd5e1",
        boxShadow: `inset 0 -3px 0 ${fingerColor}66`,
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
    // Ekran klaviaturasi tugmasi matnga belgi yozadi (Space → " ")
    // Tire "-" tugmasi bosilsa, "—" kabi tire kerak bo'lganda ham to'g'ri hisoblanadi
    if (onKeyPress) onKeyPress(key === "Space" ? " " : key);
  };

  return (
    <div ref={wrapRef} className="w-full">
      {/* Finger guide legend */}
      {fingerGuide && (
        <div className="mb-2.5 flex flex-col items-center gap-1.5">
          <div className="flex flex-wrap justify-center gap-1">
            {FINGER_ORDER.map((fid) => {
              const f = FINGERS[fid];
              const active = nextFinger === fid;
              return (
                <span
                  key={fid}
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-medium transition-all"
                  style={{
                    background: active ? f.color + "30" : "#ffffff0a",
                    color: active ? "#fff" : "#94a3b8",
                    border: `1px solid ${active ? f.color : "transparent"}`,
                    boxShadow: active ? `0 0 10px ${f.color}55` : undefined,
                  }}
                  title={f.name}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ background: f.color, boxShadow: `0 0 4px ${f.color}` }}
                  />
                  {f.short}
                </span>
              );
            })}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-500">
            <span>Touch typing finger guide</span>
            {nextFinger && (
              <span
                className="px-1.5 py-0.5 rounded-md font-semibold animate-pulse"
                style={{ background: t.accent + "1f", color: t.accent }}
              >
                Next: {nextKeyLower === " " ? "Space" : nextKeyLower} → {FINGERS[nextFinger].name}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mx-auto overflow-hidden" style={{ width: 690 * kbdScale, height: 224 * kbdScale }}>
        <div
          className="flex flex-col gap-1.5 items-center origin-top"
          style={{ transform: `scale(${kbdScale})` }}
        >
          {KEY_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1.5 justify-center">
              {row.map((key) => {
                const wide = WIDE_KEYS[key];
                const lower = key.toLowerCase();
                const isPressed = activeKeys.has(lower) || pressedKeys.includes(lower);
                const next = isNextKey(key);
                const finger = fingerGuide ? getFinger(key) : undefined;
                const fingerColor = finger ? FINGERS[finger].color : undefined;
                return (
                  <button
                    key={key}
                    // focus o'g'irlanishini oldini olamiz — yozish inputi fokusda qoladi
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleKeyClick(key)}
                    title={finger ? FINGERS[finger].name : undefined}
                    className={`relative h-10 rounded-lg text-xs font-medium transition-all duration-75 flex items-center justify-center ${
                      wide || "w-10"
                    } ${next ? "animate-pulse" : ""}`}
                    style={{
                      ...getKeyStyle(key),
                      border: `1px solid ${
                        next
                          ? t.accent + "cc"
                          : isPressed
                            ? t.accent + "88"
                            : fingerColor
                              ? fingerColor + "55"
                              : "#ffffff0a"
                      }`,
                      minWidth: key === "Space" ? 200 : wide ? undefined : 36,
                    }}
                  >
                    {key === "Space" ? (
                      fingerGuide ? (
                        <span className="text-[8px] uppercase tracking-widest opacity-50">space</span>
                      ) : (
                        ""
                      )
                    ) : key.length > 4 ? (
                      key.slice(0, 4)
                    ) : (
                      key
                    )}
                    {/* Finger color dot (top-right) */}
                    {fingerGuide && fingerColor && !next && !isPressed && (
                      <span
                        className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full"
                        style={{ background: fingerColor, boxShadow: `0 0 4px ${fingerColor}` }}
                      />
                    )}
                    {/* Home-row bumps on F and J (real keyboard feel) */}
                    {HOME_KEYS.has(lower) && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-[3px] pointer-events-none">
                        <span className="w-[3px] h-[3px] rounded-full bg-current opacity-50" />
                        <span className="w-[3px] h-[3px] rounded-full bg-current opacity-50" />
                      </span>
                    )}
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
