"use client";

import { useRef, useEffect, useMemo } from "react";
import type { ThemeColors } from "../../types";

export interface WpmSample {
  /** Seconds elapsed since test start */
  time: number;
  /** Net WPM at this point */
  wpm: number;
  /** Cumulative error count at this point */
  errors: number;
}

export interface ResultsChartProps {
  t: ThemeColors;
  /** Final net WPM */
  wpm: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** WPM samples recorded every second during the test */
  wpmHistory: WpmSample[];
  /** Total correct characters typed */
  correctChars: number;
  /** Total characters typed (correct + incorrect + extra) */
  totalChars: number;
  /** Number of errors */
  errors: number;
  /** Test duration in seconds */
  time: number;
  /** Max combo achieved */
  maxCombo: number;
  /** Language */
  lang: string;
  /** Duration setting */
  duration: number | string;
  /** XP earned */
  xp: number;
  /** Coins earned */
  coins: number;
}

/**
 * Monkeytype-style results chart.
 * Renders a canvas line chart of WPM over time with error markers,
 * plus stats panels for accuracy, raw WPM, characters, consistency, and time.
 */
export default function ResultsChart({
  t,
  wpm,
  accuracy,
  wpmHistory,
  correctChars,
  totalChars,
  errors,
  time,
  maxCombo,
  lang,
  duration,
  xp,
  coins,
}: ResultsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derived stats
  const raw = useMemo(() => {
    // Raw WPM = totalChars / 5 / (time / 60), capped at 300
    if (time <= 0) return 0;
    return Math.min(300, Math.round((totalChars / 5) / (time / 60)));
  }, [totalChars, time]);

  const consistency = useMemo(() => {
    if (wpmHistory.length < 2) return 0;
    const wpmValues = wpmHistory.map((s) => s.wpm).filter((w) => w > 0);
    if (wpmValues.length < 2) return 100;
    const mean = wpmValues.reduce((a, b) => a + b, 0) / wpmValues.length;
    const variance = wpmValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / wpmValues.length;
    const stdDev = Math.sqrt(variance);
    // Consistency = 1 - (stdDev / mean), clamped 0-100
    return Math.round(Math.max(0, Math.min(100, (1 - stdDev / mean) * 100)));
  }, [wpmHistory]);

  const extra = useMemo(() => Math.max(0, totalChars - correctChars - errors), [totalChars, correctChars, errors]);
  const missed = errors;

  // Canvas chart drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || wpmHistory.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const width = rect.width;
    const height = 220;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    // Chart area with padding
    const pad = { top: 20, right: 50, bottom: 30, left: 0 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    // Determine scales
    const maxTime = Math.max(...wpmHistory.map((s) => s.time), 1);
    const maxWpm = Math.max(...wpmHistory.map((s) => s.wpm), wpm, 40);
    const yMax = Math.ceil(maxWpm / 10) * 10 + 10;

    const xScale = (t: number) => pad.left + (t / maxTime) * chartW;
    const yScale = (w: number) => pad.top + chartH - (w / yMax) * chartH;

    // Background
    ctx.fillStyle = "transparent";
    ctx.fillRect(0, 0, width, height);

    // Grid lines (horizontal)
    ctx.strokeStyle = "rgba(255,255,255,0.05)";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const yVal = (yMax / 4) * i;
      const y = yScale(yVal);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();
    }

    // Grid lines (vertical)
    for (let i = 0; i <= 4; i++) {
      const tVal = (maxTime / 4) * i;
      const x = xScale(tVal);
      ctx.beginPath();
      ctx.moveTo(x, pad.top);
      ctx.lineTo(x, height - pad.bottom);
      ctx.stroke();
    }

    // Y-axis labels
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.font = "10px 'JetBrains Mono', monospace";
    ctx.textAlign = "left";
    for (let i = 0; i <= 4; i++) {
      const yVal = Math.round((yMax / 4) * i);
      ctx.fillText(String(yVal), width - pad.right + 6, yScale(yVal) + 3);
    }

    // X-axis labels
    ctx.textAlign = "center";
    for (let i = 0; i <= 4; i++) {
      const tVal = Math.round((maxTime / 4) * i);
      ctx.fillText(`${tVal}s`, xScale(tVal), height - pad.bottom + 16);
    }

    // Y-axis title
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.font = "9px 'Inter', sans-serif";
    ctx.translate(8, pad.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = "center";
    ctx.fillText("Words per Minute", 0, 0);
    ctx.restore();

    // Smooth WPM line (cubic bezier through points)
    ctx.beginPath();
    ctx.strokeStyle = t.accent;
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";

    const points = wpmHistory.map((s) => ({ x: xScale(s.time), y: yScale(s.wpm) }));

    if (points.length > 0) {
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const cpx = (prev.x + curr.x) / 2;
        ctx.bezierCurveTo(cpx, prev.y, cpx, curr.y, curr.x, curr.y);
      }
    }
    ctx.stroke();

    // Fill under the curve (gradient)
    if (points.length > 0) {
      ctx.lineTo(points[points.length - 1].x, yScale(0));
      ctx.lineTo(points[0].x, yScale(0));
      ctx.closePath();
      const grad = ctx.createLinearGradient(0, pad.top, 0, height - pad.bottom);
      grad.addColorStop(0, t.accent + "30");
      grad.addColorStop(1, t.accent + "05");
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Dashed average line
    const avgWpm = wpmHistory.length > 0 ? wpmHistory.reduce((s, v) => s + v.wpm, 0) / wpmHistory.length : wpm;
    ctx.beginPath();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = "rgba(255,255,255,0.25)";
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, yScale(avgWpm));
    ctx.lineTo(width - pad.right, yScale(avgWpm));
    ctx.stroke();
    ctx.setLineDash([]);

    // Error markers (red x)
    ctx.fillStyle = "#ef4444";
    ctx.font = "bold 12px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    wpmHistory.forEach((s) => {
      if (s.errors > 0) {
        const ex = xScale(s.time);
        const ey = yScale(s.wpm);
        ctx.fillText("✕", ex, ey - 8);
      }
    });

    // Dots on the WPM line
    ctx.fillStyle = t.accent;
    points.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [wpmHistory, wpm, t.accent, containerRef.current?.getBoundingClientRect().width]);

  const langLabels: Record<string, string> = { en: "english", uz: "uzbek", ru: "russian" };

  return (
    <div className="flex flex-col items-center gap-5 w-full max-w-3xl animate-fade-in">
      {/* Main layout: left stats + right chart (like Monkeytype) */}
      <div className="flex flex-col md:flex-row items-stretch gap-6 w-full">
        {/* Left panel: big stats */}
        <div className="flex flex-row md:flex-col gap-6 md:gap-4 md:w-32 flex-shrink-0 justify-center md:justify-start">
          <div className="text-center md:text-left animate-pop-in">
            <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">wpm</div>
            <div
              className="text-5xl md:text-6xl font-bold leading-none"
              style={{ color: t.accent, fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            >
              {wpm}
            </div>
          </div>
          <div className="text-center md:text-left animate-pop-in" style={{ animationDelay: "60ms" }}>
            <div className="text-[10px] md:text-xs text-gray-500 uppercase tracking-widest mb-1">acc</div>
            <div
              className="text-5xl md:text-6xl font-bold leading-none text-white"
              style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}
            >
              {accuracy}%
            </div>
          </div>
        </div>

        {/* Right: WPM chart */}
        <div ref={containerRef} className="flex-1 min-w-0">
          <canvas ref={canvasRef} className="w-full rounded-lg" style={{ height: 220 }} />
        </div>
      </div>

      {/* Bottom stats row */}
      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm">
        <div className="text-center animate-pop-in" style={{ animationDelay: "100ms" }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">test type</div>
          <div className="text-gray-300 font-medium">
            {duration === "∞" ? "time" : `words ${Math.round((typeof duration === "number" ? duration : 15) * (wpm / 60))}`}
            <br />
            <span className="text-gray-400 text-xs">{langLabels[lang] || lang}</span>
          </div>
        </div>

        <div className="text-center animate-pop-in" style={{ animationDelay: "140ms" }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">raw</div>
          <div className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
            {raw}
          </div>
        </div>

        <div className="text-center animate-pop-in" style={{ animationDelay: "180ms" }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">characters</div>
          <div className="text-gray-300 font-mono text-xs">
            <span style={{ color: t.accent }}>{correctChars}</span>
            <span className="text-gray-600">/</span>
            <span className="text-red-400">{missed}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-400">{extra}</span>
            <span className="text-gray-600">/</span>
            <span className="text-gray-500">0</span>
          </div>
        </div>

        <div className="text-center animate-pop-in" style={{ animationDelay: "220ms" }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">consistency</div>
          <div className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
            {consistency}%
          </div>
        </div>

        <div className="text-center animate-pop-in" style={{ animationDelay: "260ms" }}>
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-0.5">time</div>
          <div className="text-white font-bold" style={{ fontFamily: "'JetBrains Mono','Fira Code',monospace" }}>
            {time}s
            <div className="text-[9px] text-gray-600 font-normal mt-0.5">
              00:{String(time).padStart(2, "0")} session
            </div>
          </div>
        </div>
      </div>

      {/* XP and coins earned */}
      <div className="flex items-center gap-4 text-sm text-gray-400 animate-row">
        <span>
          XP <strong style={{ color: "#f59e0b" }}>+{xp}</strong>
        </span>
        <span>
          🪙 <strong className="text-yellow-300">+{coins}</strong>
        </span>
        {maxCombo > 0 && (
          <span>
            Combo <strong style={{ color: "#f59e0b" }}>×{maxCombo}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
