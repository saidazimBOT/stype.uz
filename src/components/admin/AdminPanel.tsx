"use client";

import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  FiAward, FiBarChart2, FiBell, FiCopy, FiDatabase, FiDollarSign, FiEdit3, FiEye, FiFlag, FiLock,
  FiLogOut, FiRefreshCw, FiSearch, FiSettings, FiShield, FiUser, FiUserPlus, FiUsers, FiZap,
} from "react-icons/fi";
import type { IconType } from "react-icons";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import { getConvexClient } from "../../lib/battle";
import { useAdminProfile, errMsg } from "./useAdminProfile";
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
import { Spinner, ErrorBox, PrimaryBtn, GhostBtn, Badge } from "./adminUi";

// ── LEGACY OWNER CREDENTIALS (asosiy kirish — saqlanib qoladi) ──────────
const ADMIN_TELEGRAM = "@said_khujayev";
const ADMIN_TELEGRAM_URL = "https://t.me/said_khujayev";
const ADMIN_LOGIN = "adminstype@gmail.com";
const ADMIN_EMAIL = "adminstype@gmail.com";
const ADMIN_PASSWORD = "admin0550";
const SESSION_KEY = "typeuz_admin_session";

interface AdminPanelProps {
  t: ThemeColors;
  onClose: () => void;
  history: TestResult[];
  xp: number;
}

// ── TABS ────────────────────────────────────────────────────────────────
type TabId =
  | "dashboard" | "users" | "registered" | "supabase" | "texts" | "economy" | "achievements" | "reports"
  | "announcements" | "logs" | "settings" | "visitors" | "gsc";

interface TabDef {
  id: TabId;
  label: string;
  icon: IconType;
  server?: boolean;
  /** Faqat Supabase sozlangan bo'lsa ko'rinadi */
  supabase?: boolean;
}

const ALL_TABS: TabDef[] = [
  { id: "dashboard", label: "Dashboard", icon: FiBarChart2 },
  { id: "users", label: "Users", icon: FiUsers, server: true },
  // Ro'yxatdan o'tganlar — har ikkala rejimda ko'rinadi (statik rejimda yo'l-yo'riq ko'rsatadi)
  { id: "registered", label: "Ro'yxatdan o'tganlar", icon: FiUserPlus },
  // Supabase haqiqiy foydalanuvchilar bazasi (faqat kalit sozlangan bo'lsa)
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

// ══════════════════════════════════════════════════════════════════════
// ENTRY — Convex haqiqatan sozlanganmi?
// ══════════════════════════════════════════════════════════════════════
export default function AdminPanel(props: AdminPanelProps) {
  // Server rejim Convex URL o'rnatilgan bo'lsa yoqiladi.
  // DIQQAT: Convex 1.4x runtime'da `api` har doim `anyApi` proksi bo'ladi — har qanday
  // kirish obyekt qaytaradi, shuning uchun `typeof api.users.me === "function"`
  // HECh QACHON true bo'lmaydi va server rejim o'chib qolardi. URL borligini
  // tekshiramiz; backend ishlamasa AdminGate xatoni ko'rsatadi va legacy rejimga
  // o'tishni taklif qiladi.
  const configured = useMemo(() => getConvexClient() != null, []);
  return (
    <AdminErrorBoundary t={props.t} onClose={props.onClose}>
      {configured ? <ServerAdminPanel {...props} /> : <LegacyAdminPanel {...props} />}
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
// LEGACY MODE (Convex sozlanmagan) — avvalgi xatti-harakat saqlanadi
// ══════════════════════════════════════════════════════════════════════
function LegacyAdminPanel({ t, onClose, history, xp }: AdminPanelProps) {
  const [loggedIn, setLoggedIn] = useLocalStorage(SESSION_KEY, false);

  if (!loggedIn) {
    return (
      <LegacyLoginScreen
        t={t}
        onClose={onClose}
        onSuccess={() => setLoggedIn(true)}
      />
    );
  }
  return (
    <AdminShell
      t={t}
      onClose={onClose}
      onLogout={() => setLoggedIn(false)}
      serverAdmin={false}
      myRole=""
      history={history}
      xp={xp}
    />
  );
}

// ══════════════════════════════════════════════════════════════════════
// SERVER MODE (Convex ulangan) — admin gate + shell
// ══════════════════════════════════════════════════════════════════════
function ServerAdminPanel({ t, onClose, history, xp }: AdminPanelProps) {
  const { authLoading, isAuthenticated, me, myToken, isServerAdmin, signIn, signOut, claimAdmin, loginWithPassword } =
    useAdminProfile();
  const [legacyLoggedIn, setLegacyLoggedIn] = useLocalStorage(SESSION_KEY, false);
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  // Convex o'rnatilgan va legacy (owner parol) bilan kirilgan bo'lsa — Convex admin
  // sessiyasini avtomatik o'rnatamiz. Shunda "Ro'yxatdan o'tganlar" va boshqa server
  // bo'limlari REAL ma'lumotlarni ko'rsatadi (backend kutilmoqda shablon o'rniga).
  const handlersRef = useRef({ signIn, claimAdmin });
  handlersRef.current = { signIn, claimAdmin };
  // Eng oxirgi isServerAdmin holati — signIn'dan keyin allaqachon admin ekanini tekshirish uchun
  const serverAdminRef = useRef(isServerAdmin);
  serverAdminRef.current = isServerAdmin;

  useEffect(() => {
    if (authLoading || !legacyLoggedIn || isServerAdmin) return;
    let cancelled = false;
    setConnecting(true);
    setConnectError("");
    (async () => {
      try {
        // Anonymous provider — agar hali kirilmagan bo'lsa kirgizadi (idempotent)
        await handlersRef.current.signIn();
        // Agar sign-in'dan keyin allaqachon admin bo'lib chiqsa (avval claim qilingan) —
        // claimAdmin qayta chaqirilmaydi (aks holda "allaqachon mavjud" xatosi chiqadi)
        if (serverAdminRef.current) return;
        // Owner / admin rolini so'raymiz — birinchi so'rovchi owner bo'ladi
        await handlersRef.current.claimAdmin();
      } catch (e) {
        // Shunda admin bo'lib ulgursak (me query yuklandi) — bu xato emas:
        // claimAdmin allaqachon claim qilingan holatda "allaqachon mavjud" qaytaradi.
        if (!cancelled && !serverAdminRef.current) setConnectError(errMsg(e));
      } finally {
        if (!cancelled) setConnecting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, legacyLoggedIn, isServerAdmin, retryKey]);

  // Server admin bo'lgach, ulanish holatini tozalaymiz
  useEffect(() => {
    if (isServerAdmin) {
      setConnecting(false);
      setConnectError("");
    }
  }, [isServerAdmin]);

  if (authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner t={t} label="Ulanish tekshirilmoqda..." />
      </div>
    );
  }

  if (!isServerAdmin && !legacyLoggedIn) {
    return (
      <AdminGate
        t={t}
        onClose={onClose}
        isAuthenticated={isAuthenticated}
        myToken={myToken}
        signIn={signIn}
        claimAdmin={claimAdmin}
        loginWithPassword={loginWithPassword}
        onLegacy={() => setLegacyLoggedIn(true)}
      />
    );
  }

  // Legacy parol bilan kirilgan, lekin backendga ulanish hali davom etmoqda
  if (legacyLoggedIn && !isServerAdmin && connecting) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Spinner t={t} label="Backendga ulanmoqda..." />
      </div>
    );
  }

  return (
    <AdminShell
      t={t}
      onClose={onClose}
      onLogout={() => {
        setLegacyLoggedIn(false);
        if (isServerAdmin) void signOut().catch(() => {});
      }}
      serverAdmin={isServerAdmin}
      myRole={me?.role ?? ""}
      history={history}
      xp={xp}
      notice={connectError}
      onRetryConnect={() => {
        setConnectError("");
        setRetryKey((k) => k + 1);
      }}
      onUseGate={() => {
        // Convex kirish eshigiga o'tamiz — u yerda owner rolini qo'lda so'rash mumkin
        setConnectError("");
        setLegacyLoggedIn(false);
      }}
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
  onLegacy,
}: {
  t: ThemeColors;
  onClose: () => void;
  isAuthenticated: boolean;
  myToken: string | null;
  signIn: () => Promise<unknown>;
  claimAdmin: () => Promise<unknown>;
  loginWithPassword: (password: string) => Promise<unknown>;
  onLegacy: () => void;
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
              Saytning yangi admin tizimi Convex orqali ishlaydi. Avval hisobga kiring, so'ng
              admin rolini so'rang yoki quyida owner parolidan foydalaning.
            </p>
            <PrimaryBtn t={t} className="w-full justify-center" onClick={() => void doSignIn()} disabled={busy}>
              <FiZap size={13} /> {busy ? "Kirilmoqda..." : "Convex hisob bilan kirish"}
            </PrimaryBtn>
            <div className="my-3 flex items-center gap-3 text-[10px] text-gray-600">
              <div className="flex-1 h-px bg-white/5" /> yoki <div className="flex-1 h-px bg-white/5" />
            </div>
            <GhostBtn t={t} className="w-full justify-center" onClick={onLegacy}>
              <FiLock size={12} /> Owner paroli bilan (eski usul)
            </GhostBtn>
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
            <div className="my-3 flex items-center gap-3 text-[10px] text-gray-600">
              <div className="flex-1 h-px bg-white/5" /> yoki <div className="flex-1 h-px bg-white/5" />
            </div>
            <GhostBtn t={t} className="w-full justify-center" onClick={onLegacy}>
              <FiLock size={12} /> Owner paroli bilan (eski usul)
            </GhostBtn>
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
// LEGACY LOGIN SCREEN (avvalgi forma — o'zgartirilmagan)
// ══════════════════════════════════════════════════════════════════════
function LegacyLoginScreen({
  t,
  onClose,
  onSuccess,
}: {
  t: ThemeColors;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const login = email.trim().toLowerCase();
    if ((login === ADMIN_LOGIN || login === ADMIN_EMAIL) && password === ADMIN_PASSWORD) {
      setError("");
      setPassword("");
      onSuccess();
    } else {
      setError("Login yoki parol noto'g'ri!");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-10 overflow-y-auto admin-shell">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm p-8 rounded-3xl animate-pop-in"
        style={{ background: t.surface, border: `1px solid ${t.accent}33`, boxShadow: `0 0 60px ${t.accent}22` }}
      >
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FiShield size={30} />
          </div>
          <h2 className="text-xl font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">Faqat administratorlar uchun</p>
        </div>

        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Login</label>
        <input
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin"
          autoComplete="username"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm mb-4 outline-none transition-all"
          style={{
            background: "#ffffff08",
            border: `1px solid ${email ? t.accent + "55" : "transparent"}`,
            color: "#fff",
          }}
        />

        <label className="block text-xs text-gray-500 uppercase tracking-widest mb-1.5">Parol</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          className="w-full px-4 py-2.5 rounded-xl text-sm mb-5 outline-none transition-all"
          style={{
            background: "#ffffff08",
            border: `1px solid ${password ? t.accent + "55" : "transparent"}`,
            color: "#fff",
          }}
        />

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="w-full py-2.5 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
          style={{ background: t.accent, color: "#000" }}
        >
          <FiLock size={14} />
          Kirish
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full mt-3 py-2 rounded-xl text-xs text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-all"
        >
          ← Saytga qaytish
        </button>

        <a
          href={ADMIN_TELEGRAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-xs transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "#229ed918", border: "1px solid #229ed933", color: "#5fb8e8" }}
          title={`Telegram: ${ADMIN_TELEGRAM}`}
        >
          <FiZap size={13} />
          <span>
            Admin bo'lishni xohlaysizmi? <strong>Telegram: {ADMIN_TELEGRAM}</strong>
          </span>
        </a>
      </form>
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
  notice,
  onRetryConnect,
  onUseGate,
}: {
  t: ThemeColors;
  onClose: () => void;
  onLogout: () => void;
  serverAdmin: boolean;
  myRole: string;
  history: TestResult[];
  xp: number;
  notice?: string;
  onRetryConnect?: () => void;
  onUseGate?: () => void;
}) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const [refreshKey, setRefreshKey] = useState(0);
  const tabs = ALL_TABS.filter(
    (tb) => (!tb.server || serverAdmin) && (!tb.supabase || isSupabaseConfigured())
  );
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
      case "supabase":
        return <SupabaseUsersSection t={t} />;
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
        {/* Backendga ulanish xatosi haqida ogohlantirish */}
        {notice && (
          <div className="flex items-start gap-2 px-4 py-2.5 text-[11px] text-red-300 bg-red-500/10 border-b border-red-500/20">
            <FiShield size={13} className="mt-0.5 flex-shrink-0" />
            <span className="leading-relaxed">
              {notice}{" "}
              {onRetryConnect ? (
                <button
                  onClick={onRetryConnect}
                  className="underline hover:text-white transition-colors"
                >
                  Qayta urinish
                </button>
              ) : null}
              {onUseGate ? (
                <>
                  {" "}·{" "}
                  <button
                    onClick={onUseGate}
                    className="underline hover:text-white transition-colors"
                  >
                    Convex orqali kirish
                  </button>
                </>
              ) : null}
            </span>
          </div>
        )}
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
