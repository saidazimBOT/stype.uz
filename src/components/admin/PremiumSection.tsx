"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThemeColors } from "../../types";
import {
  FiRefreshCw, FiSearch, FiShield, FiX, FiCheck,
} from "react-icons/fi";
import { FaCrown } from "react-icons/fa6";
import {
  AvatarDot, Badge, Card, EmptyState, Field, GhostBtn, Modal, PrimaryBtn,
  SearchInput, SectionHeader, Spinner, TextInput, fmtDateTime, timeAgo,
} from "./adminUi";
import { isSupabaseConfigured } from "../../lib/supabase";
import {
  activatePremium, revokePremium, fetchAdminUsers, getMyProfile,
  isAdminRole, signInWithEmail, signOutSupabase, planToMonths,
  type SupabaseProfileRow, type PremiumPlan,
} from "../../lib/supabaseService";

const PLAN_OPTIONS: { id: PremiumPlan; label: string; months: number; color: string; price: string }[] = [
  { id: "1month", label: "1 oylik", months: 1, color: "#f59e0b", price: "$1" },
  { id: "2month", label: "2 oylik", months: 2, color: "#ec4899", price: "$2" },
  { id: "1year", label: "1 yillik", months: 12, color: "#22c55e", price: "$5" },
];

function fullName(u: SupabaseProfileRow): string {
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
}

function displayName(u: SupabaseProfileRow): string {
  return fullName(u) || u.username || "(nomsiz)";
}

// ── Bosh komponent ────────────────────────────────────────────────────
export default function PremiumSection({ t }: { t: ThemeColors }) {
  if (!isSupabaseConfigured()) return <SetupGuide t={t} />;
  return <SectionBody t={t} />;
}

// ── Asosiy bo'lim ────────────────────────────────────────────────────
function SectionBody({ t }: { t: ThemeColors }) {
  const [phase, setPhase] = useState<"checking" | "signin" | "denied" | "list">("checking");
  const [users, setUsers] = useState<SupabaseProfileRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signInBusy, setSignInBusy] = useState(false);
  const [activatingUser, setActivatingUser] = useState<SupabaseProfileRow | null>(null);

  const checkAccess = useCallback(async () => {
    try {
      const me = await getMyProfile();
      if (!me) { setPhase("signin"); return; }
      if (!isAdminRole(me.role)) { setPhase("denied"); return; }
      setPhase("list");
    } catch { setPhase("signin"); }
  }, []);

  useEffect(() => { void checkAccess(); }, [checkAccess]);

  const loadUsers = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const list = await fetchAdminUsers(s);
      setUsers(list);
      setError("");
    } catch (e) {
      setError((e as Error)?.message || "Ro'yxat yuklanmadi");
      setUsers([]);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (phase !== "list") return;
    const id = window.setTimeout(() => void loadUsers(debounced), 250);
    return () => window.clearTimeout(id);
  }, [debounced, phase, loadUsers]);

  useEffect(() => {
    if (phase !== "list") return;
    const iv = window.setInterval(() => void loadUsers(debounced), 30_000);
    return () => window.clearInterval(iv);
  }, [phase, debounced, loadUsers]);

  if (phase === "checking") return <Spinner t={t} label="Tekshirilmoqda..." />;

  if (phase === "signin") {
    return (
      <SignInCard
        t={t} busy={signInBusy} error={error}
        onSignIn={async (email, password) => {
          setSignInBusy(true); setError("");
          try { await signInWithEmail(email, password); await checkAccess(); }
          catch (e) {
            const msg = (e as Error)?.message?.toLowerCase() || "";
            setError(msg.includes("invalid") || msg.includes("credentials")
              ? "Email yoki parol noto'g'ri!" : (e as Error)?.message || "Kirishda xatolik");
          } finally { setSignInBusy(false); }
        }}
      />
    );
  }

  if (phase === "denied") {
    return (
      <Card t={t} className="p-8 text-center max-w-md mx-auto mt-10">
        <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: "#ef444422", color: "#f87171", border: "1px solid #ef444444" }}>
          <FiShield size={26} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Ruxsat yo'q</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          Bu bo'lim faqat administratorlar uchun.
        </p>
        <GhostBtn t={t} danger onClick={() => { void signOutSupabase(); setPhase("signin"); }}>
          Boshqa hisob bilan kirish
        </GhostBtn>
      </Card>
    );
  }

  const now = Date.now();
  const premiumUsers = users?.filter((u) => u.premium_until && new Date(u.premium_until) > new Date()) ?? [];
  const expiredUsers = users?.filter((u) => u.premium_until && new Date(u.premium_until) <= new Date() && u.role === "admin") ?? [];

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FaCrown}
        title="Premium boshqaruv"
        subtitle={premiumUsers.length > 0 ? `${premiumUsers.length} ta faol premium` : "Premium foydalanuvchilar"}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput t={t} value={search} onChange={setSearch}
              placeholder="Ism, username yoki email..." className="w-60" />
            <button onClick={() => void loadUsers(debounced)}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-all"
              title="Yangilash">
              <FiRefreshCw size={14} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        }
      />

      {/* Premium statistika */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard t={t} icon="👑" label="Faol Premium" value={premiumUsers.length} color="#22c55e" />
        <StatCard t={t} icon="⏰" label="Muddati tugagan" value={expiredUsers.length} color="#f59e0b" />
        <StatCard t={t} icon="👥" label="Jami foydalanuvchi" value={users?.length ?? 0} color="#38bdf8" />
        <StatCard t={t} icon="💎" label="1 yillik" value={premiumUsers.filter((u) => u.premium_plan === "1year").length} color="#a78bfa" />
      </div>

      {/* Premium foydalanuvchilar ro'yxati */}
      {premiumUsers.length > 0 && (
        <Card t={t}>
          <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
            <FaCrown size={14} style={{ color: "#4ade80" }} />
            <span className="text-xs font-bold text-white">Faol Premium foydalanuvchilar</span>
          </div>
          <div className="divide-y divide-white/5">
            {premiumUsers.map((u) => (
              <PremiumUserRow key={u.id} t={t} user={u} onRevoke={async () => {
                try { await revokePremium(u.id); void loadUsers(debounced); }
                catch (e) { setError((e as Error)?.message || "Xatolik"); }
              }} />
            ))}
          </div>
        </Card>
      )}

      {/* Barcha foydalanuvchilar — premium aktivatsiya qilish */}
      <Card t={t}>
        <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
          <FaCrown size={14} style={{ color: "#fbbf24" }} />
          <span className="text-xs font-bold text-white">Premiumga yangilash</span>
        </div>
        <div className="divide-y divide-white/5">
          {users?.filter((u) => !u.premium_until || new Date(u.premium_until) <= new Date()).map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: u.role === 'owner' ? '#f59e0b22' : u.role === 'admin' ? '#22c55e22' : '#ffffff11', color: u.role === 'owner' ? '#f59e0b' : u.role === 'admin' ? '#22c55e' : '#6b7280' }}>
          {u.role === 'owner' ? '👑' : u.role === 'admin' ? '⭐' : '👤'}
        </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-white truncate">{displayName(u)}</div>
                  <div className="text-[10px] text-gray-500 truncate">{u.username || u.email}</div>
                </div>
              </div>
              <button
                onClick={() => setActivatingUser(u)}
                className="px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
                style={{ background: "#fbbf2422", color: "#fbbf24", border: "1px solid #fbbf2444" }}
              >
                <FaCrown size={11} /> Premium qilish
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Premium aktivatsiya oynasi */}
      {activatingUser && (
        <ActivatePremiumModal
          t={t} user={activatingUser}
          onClose={() => setActivatingUser(null)}
          onActivated={() => { setActivatingUser(null); void loadUsers(debounced); }}
        />
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30">
          {error}
          <button onClick={() => setError("")} className="ml-2 text-gray-500 hover:text-white"><FiX size={12} /></button>
        </div>
      )}
    </div>
  );
}

// ── Premium foydalanuvchi qatori ──────────────────────────────────────
function PremiumUserRow({ t, user, onRevoke }: { t: ThemeColors; user: SupabaseProfileRow; onRevoke: () => void }) {
  const until = user.premium_until ? new Date(user.premium_until) : null;
  const isExpired = until ? until <= new Date() : false;
  const daysLeft = until ? Math.max(0, Math.ceil((until.getTime() - Date.now()) / 86400000)) : 0;

  return (
    <div className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: isExpired ? "#f59e0b22" : "#22c55e22", color: isExpired ? "#f59e0b" : "#4ade80" }}
        >
          {isExpired ? "⏰" : "👑"}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-medium text-white truncate">{displayName(user)}</div>
          <div className="text-[10px] text-gray-500">
            {user.premium_plan === "1year" ? "1 yillik" : user.premium_plan === "2month" ? "2 oylik" : "1 oylik"}
            {" · "}
            {isExpired ? (
              <span className="text-amber-400">Muddati tugagan</span>
            ) : (
              <span className="text-green-400">{daysLeft} kun qoldi</span>
            )}
          </div>
        </div>
      </div>
      <GhostBtn t={t} danger onClick={onRevoke} className="text-[10px]">
        <FiX size={10} /> Bekor qilish
      </GhostBtn>
    </div>
  );
}

// ── Premium aktivatsiya oynasi ────────────────────────────────────────
function ActivatePremiumModal({
  t, user, onClose, onActivated,
}: {
  t: ThemeColors; user: SupabaseProfileRow;
  onClose: () => void; onActivated: () => void;
}) {
  const [plan, setPlan] = useState<PremiumPlan>("1month");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      await activatePremium(user.id, plan);
      setMsg({ ok: true, text: `${displayName(user)} Premium qilindi! (${planToMonths(plan)} oy)` });
      window.setTimeout(onActivated, 1200);
    } catch (e) {
      setMsg({ ok: false, text: (e as Error)?.message || "Xatolik" });
    } finally { setBusy(false); }
  };

  return (
    <Modal t={t} title={`Premiumga yangilash — ${displayName(user)}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-xs text-gray-400">
          Foydalanuvchi <span className="text-white font-medium">{displayName(user)}</span> ni Premium (admin) qilasizmi?
        </div>

        <div className="space-y-2">
          {PLAN_OPTIONS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPlan(p.id)}
              className="w-full flex items-center justify-between p-3 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                background: plan === p.id ? `${p.color}15` : "#ffffff06",
                border: `1px solid ${plan === p.id ? `${p.color}55` : "#ffffff0f"}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ background: `${p.color}22`, color: p.color }}>
                  {p.id === "1year" ? "💎" : p.id === "2month" ? "⭐" : "🔷"}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{p.label}</div>
                  <div className="text-[10px] text-gray-500">{p.months} oy davomida admin huquqi</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-extrabold" style={{ color: p.color }}>{p.price}</div>
                {plan === p.id && <FiCheck size={12} style={{ color: p.color, marginLeft: "auto" }} />}
              </div>
            </button>
          ))}
        </div>

        {msg && (
          <div className={`px-3 py-2.5 rounded-xl text-xs animate-pop-in ${msg.ok ? "text-green-400" : "text-red-400"}`}
            style={{ background: msg.ok ? "#22c55e11" : "#ef444411", border: `1px solid ${msg.ok ? "#22c55e33" : "#ef444433"}` }}>
            {msg.text}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <GhostBtn t={t} onClick={onClose} disabled={busy}>Bekor qilish</GhostBtn>
          <PrimaryBtn t={t} onClick={() => void submit()} disabled={busy || !!msg?.ok}>
            <FaCrown size={12} /> {busy ? "Faollashtirilmoqda..." : "Premium qilish"}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}

// ── Statistika kartochkasi ────────────────────────────────────────────
function StatCard({ t, icon, label, value, color }: {
  t: ThemeColors; icon: string; label: string; value: number; color: string;
}) {
  return (
    <div className="p-3 rounded-xl" style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-base">{icon}</span>
        <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-xl font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

// ── Supabase kirish kartochkasi ──────────────────────────────────────
function SignInCard({ t, busy, error, onSignIn }: {
  t: ThemeColors; busy: boolean; error: string;
  onSignIn: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  return (
    <Card t={t} className="p-6 max-w-md mx-auto mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
          <FaCrown size={18} />
        </span>
        <div>
          <div className="text-sm font-bold text-white">Premium boshqaruvga kirish</div>
          <p className="text-[11px] text-gray-500">Admin hisob bilan kiring</p>
        </div>
      </div>
      <div className="space-y-3">
        <Field t={t} label="Email">
          <TextInput t={t} type="email" value={email} onChange={setEmail} placeholder="admin@example.com" autoFocus accent />
        </Field>
        <Field t={t} label="Parol">
          <TextInput t={t} type="password" value={password} onChange={setPassword} placeholder="••••••••" accent />
        </Field>
        {error && (
          <div className="px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30">{error}</div>
        )}
        <PrimaryBtn t={t} className="w-full justify-center" disabled={busy || !email.trim() || !password}
          onClick={() => void onSignIn(email.trim(), password)}>
          <FiShield size={13} /> {busy ? "Kirilmoqda..." : "Kirish"}
        </PrimaryBtn>
      </div>
    </Card>
  );
}

// ── Backend sozlanmagan yo'l-yo'riq ────────────────────────────────────
function SetupGuide({ t }: { t: ThemeColors }) {
  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FaCrown} title="Premium boshqaruv" subtitle="backend kutilmoqda" />
      <Card t={t} className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}>
            <FaCrown size={18} />
          </span>
          <div>
            <div className="text-sm font-bold text-white">Premium tizimini sozlang</div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Supabase kalitlarini .env.local ga qo'shing, so'ng supabase/premium.sql faylini SQL Editor'da ishga tushiring.
            </p>
          </div>
        </div>
        <pre className="px-3 py-2 rounded-lg font-mono text-[10px] whitespace-pre-wrap break-words"
          style={{ background: "#0b1626", border: "1px solid #ffffff14", color: "#e5e7eb" }}>
          {"-- 1. supabase/premium.sql ni SQL Editor'da ishga tushiring\n-- 2. Admin panel → Premium boshqaruv bo'limiga o'ting\n-- 3. Foydalanuvchilarni Premiumga yangilang"}
        </pre>
      </Card>
    </div>
  );
}
