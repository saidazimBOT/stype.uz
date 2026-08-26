"use client";

import { Component, useEffect, useState, type ReactNode } from "react";
import {
  FiAward, FiBarChart2, FiBell, FiDatabase, FiDollarSign, FiEdit3, FiEye, FiFlag, FiLock,
  FiLogOut, FiRefreshCw, FiSearch, FiSettings, FiShield, FiUserPlus, FiUsers,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import useAdminProfile from "./useAdminProfile";
import type { ThemeColors, TestResult } from "../../types";
import { isSupabaseConfigured } from "../../lib/supabase";
import GscDashboard from "./GscDashboard";
import DashboardSection from "./DashboardSection";
import UsersSection from "./UsersSection";
import RegisteredUsersSection from "./RegisteredUsersSection";
import SupabaseUsersSection from "./SupabaseUsersSection";
import TextsSection from "./TextsSection";
import EconomySection from "./EconomySection";
import AchievementsSection from "./AchievementsSection";
import ReportsSection from "./ReportsSection";
import AnnouncementsSection from "./AnnouncementsSection";
import LogsSection from "./LogsSection";
import SettingsSection from "./SettingsSection";
import VisitorsSection from "./VisitorsSection";
import { Spinner } from "./adminUi";

const ADMIN_TELEGRAM_URL = "https://t.me/said_khujayev";

interface AdminPanelProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  xp: number;
}

type TabId =
  | "dashboard" | "users" | "registered" | "supabase" | "texts" | "economy"
  | "achievements" | "reports" | "announcements" | "logs" | "settings" | "visitors" | "gsc";

interface TabDef {
  id: TabId;
  label: string;
  icon: IconType;
  server?: boolean;
  supabase?: boolean;
}

const ALL_TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUsers, server: true },
  { id: "registered", label: "Ro'yxatdan o'tganlar", icon: FiUserPlus },
  { id: "supabase", label: "Supabase foydalanuvchilari", icon: FiDatabase, supabase: true },
  { id: "texts", label: "Texts", icon: FiEdit3, server: true },
  { id: "economy", label: "Coins & XP", icon: FiDollarSign, server: true },
  { id: "achievements", label: "Achievements", icon: FiAward, server: true },
  { id: "reports", label: "Reports", icon: FiFlag, server: true },
  { id: "announcements", label: "E'lonlar", icon: FiBell, server: true },
  { id: "logs", label: "Logs", icon: FiShield, server: true },
  { id: "settings", label: "Settings", icon: FiSettings, server: true },
  { id: "visitors", label: "Visitors", icon: FiEye },
  { id: "gsc", label: "Google Search", icon: FiSearch },
];

// ── Error Boundary ───────────────────────────────────────────────────
class AdminErrorBoundary extends Component<
  { t: ThemeColors; onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="text-center max-w-md animate-pop-in">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: "#ef444422", color: "#f87171", border: "1px solid #ef444444" }}>
              <FiShield size={30} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Admin panelda xatolik</h2>
            <p className="text-[11px] text-red-400/80 font-mono break-words mb-5">
              {String(this.state.error.message || this.state.error)}
            </p>
            <button onClick={() => { this.setState({ error: null }); this.props.onClose(); }}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
              style={{ background: this.props.t.accent, color: "#000" }}>
              ← Saytga qaytish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── Main Export ───────────────────────────────────────────────────────
export default function AdminPanel(props: AdminPanelProps) {
  return (
    <AdminErrorBoundary t={props.t} onClose={props.onClose}>
      <AdminPanelInner {...props} />
    </AdminErrorBoundary>
  );
}

const ADMIN_PASSWORD = "admin0550";

function AdminPanelInner({ t, onClose, history, xp }: AdminPanelProps) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const [authenticated, setAuthenticated] = useState(() => {
    try { return sessionStorage.getItem("admin_authed") === "1"; } catch { return false; }
  });

  // Server-side admin panel uchun Supabase profil (serverga yozish kerak bo'lsa)
  const { me } = useAdminProfile();
  const isServerAdmin = me?.role === "admin" || me?.role === "owner";
  const serverAdmin = isSupabaseConfigured() && isServerAdmin;

  // Refresh interval — hook'larni shartlardan oldin chaqiramiz
  useEffect(() => {
    const iv = window.setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => window.clearInterval(iv);
  }, []);

  // Parol tekshirilmagan — login ekranini ko'rsatish
  if (!authenticated) {
    return (
      <AdminLoginScreen
        t={t} onClose={onClose}
        onLogin={() => {
          setAuthenticated(true);
          try { sessionStorage.setItem("admin_authed", "1"); } catch {}
        }}
      />
    );
  }

  const tabs = ALL_TABS.filter(
    (tb) => (!tb.server || serverAdmin) && (!tb.supabase || isSupabaseConfigured())
  );
  const active = tabs.some((tb) => tb.id === tab) ? tab : "dashboard";

  const renderTab = () => {
    switch (active) {
      case "dashboard": return <DashboardSection t={t} serverAdmin={serverAdmin} history={history} xp={xp} />;
      case "users": return <UsersSection t={t} myRole={me?.role ?? ""} />;
      case "registered": return <RegisteredUsersSection t={t} serverMode={serverAdmin} />;
      case "supabase": return <SupabaseUsersSection t={t} />;
      case "texts": return <TextsSection t={t} />;
      case "economy": return <EconomySection t={t} />;
      case "achievements": return <AchievementsSection t={t} />;
      case "reports": return <ReportsSection t={t} />;
      case "announcements": return <AnnouncementsSection t={t} />;
      case "logs": return <LogsSection t={t} />;
      case "settings": return <SettingsSection t={t} />;
      case "visitors": return <VisitorsSection t={t} refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />;
      case "gsc": return <GscDashboard t={t} />;
      default: return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 admin-shell">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-white/5 p-3 gap-0.5 overflow-y-auto"
        style={{ background: t.surface + "55" }}>
        <div className="flex items-center gap-2.5 px-2.5 py-3 mb-2">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 admin-shield"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
            <FiShield size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight">Admin Panel</div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              STypeUz
              {serverAdmin && (
                <span className="px-1 py-px rounded text-[8px] font-bold" style={{ background: "#22c55e22", color: "#22c55e" }}>DB</span>
              )}
            </div>
          </div>
        </div>
        <nav className="space-y-0.5 flex-1">
          {tabs.map((tb) => {
            const isActive = tb.id === active;
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left"
                style={{
                  background: isActive ? t.accent + "1f" : "transparent",
                  color: isActive ? t.accent : "#9ca3af",
                  border: `1px solid ${isActive ? t.accent + "44" : "transparent"}`,
                }}>
                <tb.icon size={15} className="flex-shrink-0" />
                <span className="truncate">{tb.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
          <button onClick={() => setRefreshKey((k) => k + 1)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5 transition-all">
            <FiRefreshCw size={14} /> Yangilash
          </button>
          <button onClick={async () => {
            try { const { signOutSupabase } = await import("../../lib/supabaseService"); await signOutSupabase(); } catch {}
            setAuthenticated(false);
            onClose();
          }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: t.accent }}>
            <FiLogOut size={14} /> Chiqish (Logout)
          </button>
          <button onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-white/5 transition-all">
            ← Saytga qaytish
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiShield size={16} style={{ color: t.accent }} />
            <span className="text-sm font-bold text-white">Admin Panel</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setRefreshKey((k) => k + 1)} className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-all" title="Yangilash">
              <FiRefreshCw size={14} />
            </button>
            <button onClick={onClose} className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 transition-all">
              ← Orqaga
            </button>
          </div>
        </div>
        <div className="md:hidden flex gap-1.5 overflow-x-auto px-4 py-2 border-b border-white/5 flex-shrink-0">
          {tabs.map((tb) => {
            const isActive = tb.id === active;
            return (
              <button key={tb.id} onClick={() => setTab(tb.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all"
                style={{
                  background: isActive ? t.accent + "22" : "#ffffff08",
                  color: isActive ? t.accent : "#9ca3af",
                  border: `1px solid ${isActive ? t.accent + "44" : "#ffffff14"}`,
                }}>
                <tb.icon size={12} />
                {tb.label}
              </button>
            );
          })}
        </div>
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <div key={active} className="admin-content">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Login Screen — Parol bilan kirish ────────────────────────────────
function AdminLoginScreen({
  t, onClose, onLogin,
}: {
  t: ThemeColors; onClose: () => void; onLogin: () => void;
}) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      onLogin();
    } else {
      setError("Noto'g'ri parol!");
      setPassword("");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-y-auto admin-shell">
      <div
        className="w-full max-w-sm p-8 rounded-3xl animate-pop-in"
        style={{ background: t.surface, border: `1px solid ${t.accent}33`, boxShadow: `0 0 60px ${t.accent}22` }}>
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
            <FiShield size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">Admin parolni kiriting</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(""); }}
              placeholder="••••••••"
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition-all focus:ring-2"
              style={{ background: "#ffffff0d", border: `1px solid ${error ? "#ef4444" : "#ffffff22"}`, color: "#fff" }}
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
              {error}
            </div>
          )}

          <button type="submit"
            className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
            style={{ background: t.accent, color: "#000" }}>
            Kirish
          </button>
        </form>

        <button type="button" onClick={onClose}
          className="w-full mt-4 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all">
          ← Saytga qaytish
        </button>
      </div>
    </div>
  );
}
