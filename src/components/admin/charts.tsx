"use client";

import type { ThemeColors } from "../../types";

export interface ChartPoint {
  label: string;
  value: number;
  hint?: string;
}

// ── Chiziqli grafik (gradient maydon bilan) ─────────────────────────────
export function LineChart({
  t,
  data,
  color,
  height = 150,
  suffix = "",
}: {
  t: ThemeColors;
  data: ChartPoint[];
  color?: string;
  height?: number;
  suffix?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-600" style={{ height }}>
        Ma'lumot yo'q
      </div>
    );
  }
  const c = color || t.accent;
  const W = 640;
  const H = 220;
  const PL = 38;
  const PR = 10;
  const PT = 14;
  const PB = 26;
  const iw = W - PL - PR;
  const ih = H - PT - PB;
  const maxV = Math.max(...data.map((d) => d.value), 1) * 1.12;
  const x = (i: number) =>
    PL + (data.length === 1 ? iw / 2 : (i * iw) / (data.length - 1));
  const y = (v: number) => PT + ih - (v / maxV) * ih;
  const pts = data.map((d, i) => `${x(i).toFixed(1)},${y(d.value).toFixed(1)}`);
  const area = `M${pts[0]} L${pts.join(" L")} L${x(data.length - 1).toFixed(1)},${(PT + ih).toFixed(1)} L${x(0).toFixed(1)},${(PT + ih).toFixed(1)} Z`;
  const grid = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Grafik">
      <defs>
        <linearGradient id={`lg-${c.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c} stopOpacity="0.35" />
          <stop offset="100%" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      {grid.map((g) => {
        const gy = PT + ih - g * ih;
        return (
          <g key={g}>
            <line x1={PL} x2={W - PR} y1={gy} y2={gy} stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
            <text x={PL - 6} y={gy + 3} textAnchor="end" fontSize={9} fill="#6b7280">
              {Math.round(maxV * g)}
            </text>
          </g>
        );
      })}
      <path d={area} fill={`url(#lg-${c.replace("#", "")})`} />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={c}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.map((d, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(d.value)} r={3} fill={c} stroke="#0b1626" strokeWidth={1.5}>
            <title>{`${d.label}: ${d.value}${suffix}${d.hint ? ` (${d.hint})` : ""}`}</title>
          </circle>
        </g>
      ))}
      {data.length <= 10
        ? data.map((d, i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#6b7280">
              {d.label}
            </text>
          ))
        : [0, Math.floor((data.length - 1) / 2), data.length - 1].map((i) => (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize={9} fill="#6b7280">
              {data[i].label}
            </text>
          ))}
    </svg>
  );
}

// ── Ustunli grafik ──────────────────────────────────────────────────────
export function BarChart({
  t,
  data,
  color,
  height = 130,
}: {
  t: ThemeColors;
  data: ChartPoint[];
  color?: string;
  height?: number;
}) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center text-xs text-gray-600" style={{ height }}>
        Ma'lumot yo'q
      </div>
    );
  }
  const c = color || t.accent;
  const maxV = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex items-end gap-1.5" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1 group min-w-0">
          <div
            className="w-full rounded-t transition-all duration-300 group-hover:opacity-80"
            style={{
              height: `${Math.max((d.value / maxV) * 100, d.value > 0 ? 8 : 3)}%`,
              background: d.value > 0 ? c : "#ffffff12",
              opacity: d.value > 0 ? 0.55 + (d.value / maxV) * 0.45 : 1,
            }}
            title={`${d.label}: ${d.value}`}
          />
          <span className="text-[8px] text-gray-600 whitespace-nowrap overflow-hidden max-w-full">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}
