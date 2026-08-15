"use client";

import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  FiAward, FiBarChart2, FiBell, FiCopy, FiDollarSign, FiEdit3, FiEye, FiFlag, FiLock,
  FiLogOut, FiRefreshCw, FiSearch, FiSettings, FiShield, FiUser, FiUserPlus, FiUsers, FiZap,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { getConvexClient } from "../../lib/battle";
import { useAdminProfile, errMsg } from "./useAdminProfile";
import type { ThemeColors, TestResult } from "../../types";
import GscDashboard from "./GscDashboard";
import DashboardSection from "./DashboardSection";
import UsersSection from "./UsersSection";
import RegisteredUsersSection from "./RegisteredUsersSection";
import TextsSection from "./TextsSection";
import EconomySection from "./EconomySection";
import AchievementsSection from "./AchievementsSection";
import ReportsSection from "./ReportsSection";
import AnnouncementsSection from "./AnnouncementsSection";
import LogsSection from "./LogsSection";
import SettingsSection from "./SettingsSection";
import VisitorsSection from "./VisitorsSection";
import { Spinner, ErrorBox, PrimaryBtn, Badge } from "./adminUi";

interface AdminPanelProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  xp: number;
}

// ── TABS ────────────────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "registered" | "texts" | "economy" | "achievements" | "reports"
  | "announcements" | "logs" | "settings" | "visitors" | "gsc";

interface TabDef {
  id: TabId;
  label: string;
  icon: IconType;
  server?: boolean;
}

const ALL_TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUsers, server: true },
  // Ro'yxatdan o'tganlar — Convex orqali sign up qilganlar
  { id: "registered", label: "Ro'yxatdan o'tganlar", icon: FiUserPlus },
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

// ══════════════════════════════════════════════════════════════════════
// ENTRY — Convex haqiqatan sozlanganmi?
// ══════════════════════════════════════════════════════════════════════
export default function AdminPanel(props: AdminPanelProps) {
  // Server rejim Convex URL o'rnatilgan bo'lsa yoqiladi.
  // DIQQAT: Convex 1.4x runtime'da `api` har doim `anyApi` proksi bo'ladi — har qanday
  // kirish obyekt qaytaradi, shuning uchun `typeof api.users.me === "function"`
  // HECh QACHON true bo'lmaydi. URL borligini tekshiramiz.
  const configured = useMemo(() => getConvexClient() != null, []);
  return (
    <AdminErrorBoundary t={props.t} onClose={props.onClose}>
      {configured ? <ServerAdminPanel {...props} /> : <ConvexNotConfigured t={props.t} onClose={props.onClose} />}
    </AdminErrorBoundary>
  );
}

// ── Xatolik himoyasi: admin bo'limidagi istalgan xato butun saytni qulatmasligi uchun ──
class AdminErrorBoundary extends Component<
  { t: ThemeColors; onClose: () => void; children: ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <div className="text-center max-w-md animate-pop-in">
            <div
              className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
              style={{ background: "#ef444422", color: "#f87171", border: "1px solid #ef444444" }}
            >
              <FiShield size={30} />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Admin panelda xatolik</h2>
            <p className="text-xs text-gray-500 mb-1">
              Kutilmagan xato yuz berdi — qolgan sayt ishlashda davom etadi.
            </p>
            <p className="text-[11px] text-red-400/80 font-mono break-words mb-5">
              {String(this.state.error.message || this.state.error)}
            </p>
            <button
              onClick={() => {
                this.setState({ error: null });
                this.props.onClose();
              }}
              className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
              style={{ background: this.props.t.accent, color: "#000" }}
            >
              ← Saytga qaytish
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════════════════════
// CONVEX SOZLANMAGAN — yo'l-yo'riq
// ══════════════════════════════════════════════════════════════════════
function ConvexNotConfigured({ t, onClose }: { t: ThemeColors; onClose: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10">
      <div className="text-center max-w-md animate-pop-in">
        <div
          className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
        >
          <FiShield size={30} />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Convex sozlanmagan</h2>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed">
          Admin panel Convex backend orqali ishlaydi. <span className="font-mono text-gray-400">NEXT_PUBLIC_CONVEX_URL</span>{" "}
          o'rnatilmagan — .env.local ga yozing va saytni qayta build qiling.
        </p>
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105 active:scale-95"
          style={{ background: t.accent, color: "#000" }}
        >
          ← Saytga qaytish
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SERVER MODE (Convex ulangan) — admin gate + shell
// ══════════════════════════════════════════════════════════════════════
function ServerAdminPanel({ t, onClose, history, xp }: AdminPanelProps) {
  const { authLoading, isAuthenticated, me, myToken, isServerAdmin, signIn, signOut, claimAdmin, loginWithPassword } =
    useAdminProfile();

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner t={t} label="Ulanish tekshirilmoqda..." />
      </div>
    );
  }

  if (!isServerAdmin) {
    return (
      <AdminGate
        t={t}
        onClose={onClose}
        isAuthenticated={isAuthenticated}
        myToken={myToken}
        signIn={signIn}
        claimAdmin={claimAdmin}
        loginWithPassword={loginWithPassword}
      />
    );
  }

  return (
    <AdminShell
      t={t}
      onClose={onClose}
      onLogout={() => void signOut().catch(() => {})}
      serverAdmin={isServerAdmin}
      myRole={me?.role ?? ""}
      history={history}
      xp={xp}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════
// ACCESS GATE (server rejim)
// ══════════════════════════════════════════════════════════════════════
function AdminGate({
  t,
  onClose,
  isAuthenticated,
  myToken,
  signIn,
  claimAdmin,
  loginWithPassword,
}: {
  t: ThemeColors;
  onClose: () => void;
  isAuthenticated: boolean;
  myToken: string | null;
  signIn: () => Promise<unknown>;
  claimAdmin: () => Promise<unknown>;
  loginWithPassword: (password: string) => Promise<unknown>;
}) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  // Parol bilan kirish
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  const doPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setPwError("Parolni kiriting");
      return;
    }
    setPwBusy(true);
    setPwError("");
    try {
      // Anonymous sign-in shart — parolni shu hisobga biriktiramiz
      if (!isAuthenticated) await signIn();
      await loginWithPassword(password);
    } catch (err) {
      setPwError(errMsg(err));
    } finally {
      setPwBusy(false);
    }
  };

  const doClaim = async () => {
    setBusy(true);
    setError("");
    try {
      await claimAdmin();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const doSignIn = async () => {
    setBusy(true);
    setError("");
    try {
      await signIn();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const copyToken = () => {
    if (!myToken) return;
    navigator.clipboard?.writeText(myToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-10 flex items-start justify-center admin-shell">
      <div className="w-full max-w-md space-y-4 animate-pop-in">
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center mb-4"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, boxShadow: `0 0 40px ${t.accent}22` }}
          >
            <FiShield size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">Faqat administratorlar uchun</p>
        </div>

        {/* Parol bilan kirish — asosiy usul (parol serverda tekshiriladi) */}
        <form
          onSubmit={doPasswordLogin}
          className="p-5 rounded-2xl"
          style={{ background: t.surface, border: `1px solid ${t.accent}33` }}
        >
          <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
            <FiLock size={13} style={{ color: t.accent }} />
            Parol bilan kirish
          </div>
          <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
            Admin parolini kiriting. Parol faqat serverda tekshiriladi va frontend kodida ko'rinmaydi.
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full px-4 py-2.5 rounded-xl text-sm mb-3 outline-none transition-all"
            style={{
              background: "#ffffff08",
              border: `1px solid ${password ? t.accent + "55" : "#ffffff14"}`,
              color: "#fff",
            }}
          />
          {pwError && (
            <div className="mb-3 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
              {pwError}
            </div>
          )}
          <PrimaryBtn t={t} className="w-full justify-center" disabled={pwBusy}>
            <FiLock size={13} /> {pwBusy ? "Tekshirilmoqda..." : "Kirish"}
          </PrimaryBtn>
        </form>

        {!isAuthenticated ? (
          <div className="p-5 rounded-2xl" style={{ background: t.surface, border: `1px solid ${t.accent}33` }}>
            <div className="text-sm font-medium text-white mb-1">Convex hisob bilan kirish</div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Saytning admin tizimi Convex orqali ishlaydi. Avval hisobga kiring, so'ng admin
              rolini so'rang — yoki yuqoridagi parol bilan kiring.
            </p>
            <PrimaryBtn t={t} className="w-full justify-center" onClick={() => void doSignIn()} disabled={busy}>
              <FiZap size={13} /> {busy ? "Kirilmoqda..." : "Convex hisob bilan kirish"}
            </PrimaryBtn>
          </div>
        ) : (
          <div className="p-5 rounded-2xl" style={{ background: t.surface, border: `1px solid ${t.accent}33` }}>
            <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
              <span className="w-2 h-2 rounded-full bg-green-400 admin-live-dot" style={{ color: "#22c55e" }} />
              Siz tizimga kirgansiz
            </div>
            <p className="text-[11px] text-gray-500 mb-4 leading-relaxed">
              Sizning hisobingizda hali admin roli yo'q. Owner bo'lish uchun rol so'rang.
            </p>
            <PrimaryBtn t={t} className="w-full justify-center" onClick={doClaim} disabled={busy}>
              <FiShield size={13} /> {busy ? "So'ralmoqda..." : "Owner rolini so'rash"}
            </PrimaryBtn>
            {error && (
              <div className="mt-3">
                <ErrorBox message={error} />
              </div>
            )}
            {myToken && (
              <button
                onClick={copyToken}
                className="mt-4 w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-left transition-all hover:bg-white/5"
                style={{ background: "#ffffff06", border: "1px solid #ffffff14" }}
                title="Nusxalash"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] text-gray-600 uppercase tracking-widest mb-0.5">Sizning token (ADMIN_TOKENS env uchun)</div>
                  <div className="text-[10px] text-gray-400 font-mono truncate">{myToken}</div>
                </div>
                <span className="text-[10px] text-gray-500 flex items-center gap-1 whitespace-nowrap">
                  {copied ? "✓" : <FiCopy size={12} />} {copied ? "Nusxalandi" : "Nusxalash"}
                </span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          ← Saytga qaytish
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// SHELL — sidebar + content
// ══════════════════════════════════════════════════════════════════════
function AdminShell({
  t,
  onClose,
  onLogout,
  serverAdmin,
  myRole,
  history,
  xp,
}: {
  t: ThemeColors;
  onClose: () => void;
  onLogout: () => void;
  serverAdmin: boolean;
  myRole: string;
  history: TestResult[];
  xp: number;
}) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const tabs = ALL_TABS.filter((tb) => !tb.server || serverAdmin);
  const active = tabs.some((tb) => tb.id === tab) ? tab : "dashboard";

  // Avvalgi panel kabi: har 30 soniyada avtomatik yangilash
  useEffect(() => {
    const iv = window.setInterval(() => setRefreshKey((k) => k + 1), 30_000);
    return () => window.clearInterval(iv);
  }, []);

  const renderTab = () => {
    switch (active) {
      case "dashboard":
        return <DashboardSection t={t} serverAdmin={serverAdmin} history={history} xp={xp} />;
      case "users":
        return <UsersSection t={t} myRole={myRole} />;
      case "registered":
        return <RegisteredUsersSection t={t} serverMode={serverAdmin} />;
      case "texts":
        return <TextsSection t={t} />;
      case "economy":
        return <EconomySection t={t} />;
      case "achievements":
        return <AchievementsSection t={t} />;
      case "reports":
        return <ReportsSection t={t} />;
      case "announcements":
        return <AnnouncementsSection t={t} />;
      case "logs":
        return <LogsSection t={t} />;
      case "settings":
        return <SettingsSection t={t} />;
      case "visitors":
        return <VisitorsSection t={t} refreshKey={refreshKey} onRefresh={() => setRefreshKey((k) => k + 1)} />;
      case "gsc":
        return <GscDashboard t={t} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row min-h-0 admin-shell">
      {/* ── Sidebar (desktop) ── */}
      <aside
        className="hidden md:flex flex-col w-56 flex-shrink-0 border-r border-white/5 p-3 gap-0.5 overflow-y-auto"
        style={{ background: t.surface + "55" }}
      >
        <div className="flex items-center gap-2.5 px-2.5 py-3 mb-2">
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 admin-shield"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44`, boxShadow: `0 0 16px ${t.accent}33` }}
          >
            <FiShield size={17} />
          </span>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white leading-tight admin-title">Admin Panel</div>
            <div className="text-[10px] text-gray-500 flex items-center gap-1">
              STypeUz
              {serverAdmin && (
                <span className="px-1 py-px rounded text-[8px] font-bold" style={{ background: "#22c55e22", color: "#22c55e" }}>
                  DB
                </span>
              )}
            </div>
          </div>
        </div>

        <nav className="space-y-0.5 flex-1">
          {tabs.map((tb) => {
            const isActive = tb.id === active;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left admin-tab ${isActive ? "active" : ""}`}
                style={{
                  background: isActive ? t.accent + "1f" : "transparent",
                  color: isActive ? t.accent : "#9ca3af",
                  border: `1px solid ${isActive ? t.accent + "44" : "transparent"}`,
                  // @ts-ignore -- custom property for admin-tab glow
                  "--tab-glow": t.accent,
                }}
              >
                <tb.icon size={15} className="flex-shrink-0" />
                <span className="truncate">{tb.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-3 mt-3 border-t border-white/5 space-y-1">
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-400 hover:bg-white/5 transition-all"
          >
            <FiRefreshCw size={14} /> Yangilash
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all"
            style={{ color: t.accent }}
          >
            <FiLogOut size={14} /> Chiqish
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-500 hover:bg-white/5 transition-all"
          >
            ← Saytga qaytish
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2">
            <FiShield size={16} style={{ color: t.accent }} />
            <span className="text-sm font-bold text-white">Admin Panel</span>
            {serverAdmin && <Badge t={t} color="#22c55e">DB</Badge>}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="p-2 rounded-lg text-gray-400 hover:bg-white/5 transition-all"
              title="Yangilash"
            >
              <FiRefreshCw size={14} />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-lg transition-all"
              style={{ color: t.accent }}
              title="Chiqish"
            >
              <FiLogOut size={14} />
            </button>
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 rounded-lg text-xs text-gray-400 hover:bg-white/5 transition-all"
            >
              ← Orqaga
            </button>
          </div>
        </div>

        {/* Mobile tabs */}
        <div className="md:hidden flex gap-1.5 overflow-x-auto px-4 py-2 border-b border-white/5 flex-shrink-0">
          {tabs.map((tb) => {
            const isActive = tb.id === active;
            return (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all admin-tab-mobile ${isActive ? "active" : ""}`}
                style={{
                  background: isActive ? t.accent + "22" : "#ffffff08",
                  color: isActive ? t.accent : "#9ca3af",
                  border: `1px solid ${isActive ? t.accent + "44" : "#ffffff14"}`,
                }}
              >
                <tb.icon size={12} />
                {tb.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5">
          <div key={active} className="admin-content">
            {renderTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
