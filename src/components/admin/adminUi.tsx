"use client";

import type { ReactNode, CSSProperties } from "react";
import type { IconType } from "react-icons";
import { FiAlertTriangle, FiSearch, FiX } from "react-icons/fi";
import type { ThemeColors } from "../../types";
import { getAvatarInfo } from "../../data/shop";

// ── Card ────────────────────────────────────────────────────────────────
export function Card({
  t,
  children,
  className = "",
  style,
}: {
  t: ThemeColors;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl animate-fade-in ${className}`}
      style={{ background: t.surface, border: `1px solid ${t.accent}1a`, ...style }}
    >
      {children}
    </div>
  );
}

// ── Stat card ───────────────────────────────────────────────────────────
export function StatCard({
  t,
  icon: Icon,
  label,
  value,
  color,
  sub,
  onClick,
}: {
  t: ThemeColors;
  icon: IconType;
  label: string;
  value: string | number;
  color?: string;
  sub?: string;
  onClick?: () => void;
}) {
  const c = color || t.accent;
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-2xl transition-all ${onClick ? "cursor-pointer hover:scale-[1.03]" : "hover:scale-[1.02]"}`}
      style={{ background: t.surface, border: `1px solid ${c}22` }}
      title={sub}
    >
      <Icon size={16} style={{ color: c }} className="mb-2" />
      <div className="text-2xl font-bold text-white truncate">{value}</div>
      <div className="text-xs text-gray-500 truncate">{label}</div>
      {sub && <div className="text-[10px] text-gray-600 mt-1 truncate">{sub}</div>}
    </div>
  );
}

// ── Section header ──────────────────────────────────────────────────────
export function SectionHeader({
  t,
  icon: Icon,
  title,
  subtitle,
  actions,
}: {
  t: ThemeColors;
  icon?: IconType;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-2 text-sm font-medium text-gray-300 min-w-0">
        {Icon && <Icon size={16} style={{ color: t.accent }} className="flex-shrink-0" />}
        <span className="truncate">{title}</span>
        {subtitle && (
          <span
            className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
            style={{ background: t.accent + "22", color: t.accent }}
          >
            {subtitle}
          </span>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap">{actions}</div>}
    </div>
  );
}

// ── Loading ─────────────────────────────────────────────────────────────
export function Spinner({ t, label = "Yuklanmoqda..." }: { t: ThemeColors; label?: string }) {
  return (
    <div className="py-14 flex flex-col items-center justify-center gap-3 text-center">
      <div
        className="w-8 h-8 rounded-full animate-spin"
        style={{ border: `3px solid ${t.accent}22`, borderTopColor: t.accent }}
      />
      <div className="text-xs text-gray-500 animate-pulse">{label}</div>
    </div>
  );
}

// ── Empty state ─────────────────────────────────────────────────────────
export function EmptyState({
  t,
  icon: Icon,
  title,
  desc,
  action,
}: {
  t: ThemeColors;
  icon?: IconType;
  title: string;
  desc?: string;
  action?: ReactNode;
}) {
  return (
    <div className="py-12 text-center animate-fade-in">
      {Icon && <Icon size={36} className="mx-auto mb-3" style={{ color: "#4b5563" }} />}
      <div className="text-sm text-white font-medium">{title}</div>
      {desc && (
        <div className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">{desc}</div>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}

// ── Error box ───────────────────────────────────────────────────────────
export function ErrorBox({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="mb-4 px-3 py-2.5 rounded-xl text-xs text-red-400 bg-red-500/10 border border-red-500/30 flex items-start gap-2 animate-pop-in">
      <FiAlertTriangle size={14} className="mt-0.5 flex-shrink-0" />
      <span className="flex-1 break-words">{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="text-red-400/80 hover:text-red-300 underline whitespace-nowrap">
          Qayta urinish
        </button>
      )}
    </div>
  );
}

// ── Modal ───────────────────────────────────────────────────────────────
export function Modal({
  t,
  title,
  onClose,
  children,
  wide,
}: {
  t: ThemeColors;
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className={`w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto rounded-2xl animate-pop-in`}
        style={{ background: t.surface, border: `1px solid ${t.accent}44`, boxShadow: `0 0 60px ${t.accent}1a` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b border-white/5 sticky top-0 z-10"
          style={{ background: t.surface }}
        >
          <h3 className="text-sm font-bold text-white truncate">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/10 transition-all"
            aria-label="Yopish"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ── Confirm dialog ──────────────────────────────────────────────────────
export function ConfirmDialog({
  t,
  title,
  message,
  confirmLabel = "Tasdiqlash",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: {
  t: ThemeColors;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={busy ? undefined : onCancel}
      role="alertdialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl p-5 animate-pop-in"
        style={{ background: t.surface, border: `1px solid ${danger ? "#ef444466" : t.accent + "44"}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-3" style={{ color: danger ? "#f87171" : t.accent }}>
          <FiAlertTriangle size={18} />
          <h3 className="text-sm font-bold text-white">{title}</h3>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed mb-5 whitespace-pre-line">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5 transition-all disabled:opacity-40"
          >
            Bekor qilish
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 disabled:opacity-50"
            style={{ background: danger ? "#ef4444" : t.accent, color: danger ? "#fff" : "#000" }}
          >
            {busy ? "..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Form elements ───────────────────────────────────────────────────────
export function Field({
  t,
  label,
  children,
  hint,
}: {
  t: ThemeColors;
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3.5">
      <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
      {hint && <div className="text-[10px] text-gray-600 mt-1">{hint}</div>}
    </div>
  );
}

const inputBase = (t: ThemeColors) =>
  ({
    background: "#ffffff08",
    border: "1px solid #ffffff14",
    color: "#fff",
    outline: "none",
  } as CSSProperties);

export function TextInput({
  t,
  value,
  onChange,
  placeholder,
  type = "text",
  accent,
  autoFocus,
  className = "",
}: {
  t: ThemeColors;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  accent?: boolean;
  autoFocus?: boolean;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none transition-all ${className}`}
      style={{
        ...inputBase(t),
        border: `1px solid ${accent && value ? t.accent + "66" : "#ffffff14"}`,
      }}
    />
  );
}

export function TextArea({
  t,
  value,
  onChange,
  placeholder,
  rows = 3,
  mono,
}: {
  t: ThemeColors;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full px-3.5 py-2.5 rounded-xl text-sm outline-none resize-y transition-all ${mono ? "font-mono text-[12px]" : ""}`}
      style={{ ...inputBase(t), border: "1px solid #ffffff14" }}
    />
  );
}

export function Select({
  t,
  value,
  onChange,
  options,
}: {
  t: ThemeColors;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 rounded-xl text-sm outline-none appearance-none cursor-pointer"
      style={{ ...inputBase(t), border: "1px solid #ffffff14" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#0b1626] text-white">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  t,
  checked,
  onChange,
  label,
  hint,
}: {
  t: ThemeColors;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/[0.03] text-left"
      style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}
    >
      <span>
        <span className="block text-sm text-gray-200">{label}</span>
        {hint && <span className="block text-[10px] text-gray-500 mt-0.5">{hint}</span>}
      </span>
      <span
        className="relative rounded-full transition-all flex-shrink-0"
        style={{
          width: 40,
          height: 22,
          background: checked ? t.accent : "#ffffff1f",
          border: `1px solid ${checked ? t.accent : "#ffffff2e"}`,
        }}
      >
        <span
          className="absolute top-0.5 rounded-full bg-white transition-all"
          style={{
            width: 16,
            height: 16,
            left: checked ? 21 : 3,
            boxShadow: "0 1px 4px rgba(0,0,0,.4)",
          }}
        />
      </span>
    </button>
  );
}

// ── Badges ──────────────────────────────────────────────────────────────
export function Badge({
  t,
  color,
  children,
}: {
  t: ThemeColors;
  color: string;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap"
      style={{ background: color + "1f", color, border: `1px solid ${color}44` }}
    >
      {children}
    </span>
  );
}

export function RoleBadge({ t, role }: { t: ThemeColors; role: string }) {
  const map: Record<string, { label: string; color: string }> = {
    owner: { label: "Owner", color: "#f59e0b" },
    admin: { label: "Admin", color: "#38bdf8" },
    user: { label: "User", color: "#6b7280" },
  };
  const m = map[role] || map.user;
  return <Badge t={t} color={m.color}>{m.label}</Badge>;
}

export function DifficultyBadge({ t, d }: { t: ThemeColors; d: string }) {
  const map: Record<string, { label: string; color: string }> = {
    easy: { label: "Easy", color: "#22c55e" },
    medium: { label: "Medium", color: "#f59e0b" },
    hard: { label: "Hard", color: "#ef4444" },
  };
  const m = map[d] || { label: d, color: "#6b7280" };
  return <Badge t={t} color={m.color}>{m.label}</Badge>;
}

export function StatusBadge({ t, status }: { t: ThemeColors; status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "#f59e0b" },
    reviewed: { label: "Reviewed", color: "#38bdf8" },
    resolved: { label: "Resolved", color: "#22c55e" },
    active: { label: "Active", color: "#22c55e" },
    disabled: { label: "Disabled", color: "#6b7280" },
    scheduled: { label: "Scheduled", color: "#a78bfa" },
    expired: { label: "Expired", color: "#ef4444" },
  };
  const m = map[status] || { label: status, color: "#6b7280" };
  return <Badge t={t} color={m.color}>{m.label}</Badge>;
}

// ── Search input ────────────────────────────────────────────────────────
export function SearchInput({
  t,
  value,
  onChange,
  placeholder = "Qidirish...",
  className = "",
}: {
  t: ThemeColors;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none transition-all focus:border"
        style={{
          ...inputBase(t),
          border: `1px solid ${value ? t.accent + "55" : "#ffffff14"}`,
        }}
      />
    </div>
  );
}

// ── Avatar dot ──────────────────────────────────────────────────────────
export function AvatarDot({ avatar, size = 30 }: { avatar: string; size?: number }) {
  const info = getAvatarInfo(avatar);
  const Icon = info.icon;
  return (
    <span
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${info.color}, ${info.color}88)`,
        boxShadow: `0 0 8px ${info.color}55`,
      }}
    >
      <Icon size={Math.round(size * 0.45)} className="text-white" />
    </span>
  );
}

// ── Buttons ─────────────────────────────────────────────────────────────
export function PrimaryBtn({
  t,
  children,
  onClick,
  disabled,
  className = "",
}: {
  t: ThemeColors;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.04] active:scale-95 disabled:opacity-40 disabled:hover:scale-100 flex items-center gap-1.5 ${className}`}
      style={{ background: t.accent, color: "#000" }}
    >
      {children}
    </button>
  );
}

export function GhostBtn({
  t,
  children,
  onClick,
  disabled,
  danger,
  className = "",
}: {
  t: ThemeColors;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  className?: string;
}) {
  const c = danger ? "#f87171" : "#9ca3af";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5 disabled:opacity-40 flex items-center gap-1.5 ${className}`}
      style={{ color: c }}
    >
      {children}
    </button>
  );
}

export function SmallBtn({
  t,
  color,
  children,
  onClick,
  disabled,
}: {
  t: ThemeColors;
  color: string;
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all hover:scale-105 disabled:opacity-40 whitespace-nowrap"
      style={{ background: color + "1f", color, border: `1px solid ${color}44` }}
    >
      {children}
    </button>
  );
}

// ── Time helpers ────────────────────────────────────────────────────────
export function fmtTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function timeAgo(ts: number): string {
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return "hozir";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} daq. oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  return `${d} kun oldin`;
}
