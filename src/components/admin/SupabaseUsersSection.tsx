"use client";

import { useCallback, useEffect, useState } from "react";
import type { ThemeColors } from "../../types";
import {
  FiAlertTriangle, FiDatabase, FiLogIn, FiRefreshCw, FiShield, FiUsers,
} from "react-icons/fi";
import {
  AvatarDot, Badge, Card, EmptyState, Field, GhostBtn, Modal, PrimaryBtn, RoleBadge, SearchInput,
  SectionHeader, Spinner, TextInput, fmtDateTime, timeAgo,
} from "./adminUi";
import { isSupabaseConfigured } from "../../lib/supabase";
import {
  adminAddCoins, fetchAdminUsers, getMyProfile, isAdminRole, signInWithEmail, signOutSupabase,
  type SupabaseProfileRow,
} from "../../lib/supabaseService";

const DAY = 24 * 60 * 60 * 1000;

function fullName(u: SupabaseProfileRow): string {
  return [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
}

function displayName(u: SupabaseProfileRow): string {
  return fullName(u) || u.username || "(nomsiz)";
}

function parseTs(v?: string | null): number | null {
  if (!v) return null;
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

// ── Bosh komponent: Supabase sozlanganmi? ──────────────────────────────
export default function SupabaseUsersSection({ t }: { t: ThemeColors }) {
  if (!isSupabaseConfigured()) return <SetupGuide t={t} />;
  return <SectionBody t={t} />;
}

// ── Asosiy bo'lim (sozlangan bo'lsa) ───────────────────────────────────
function SectionBody({ t }: { t: ThemeColors }) {
  const [phase, setPhase] = useState<"checking" | "signin" | "denied" | "list">("checking");
  const [users, setUsers] = useState<SupabaseProfileRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signInBusy, setSignInBusy] = useState(false);
  // ── Boshqalarga coin berish ──
  const [givingTo, setGivingTo] = useState<SupabaseProfileRow | null>(null);

  // Sessiya va rol tekshirish (RLS orqali admin ekanligi)
  const checkAccess = useCallback(async () => {
    try {
      const me = await getMyProfile();
      if (!me) {
        setPhase("signin");
        return;
      }
      if (!isAdminRole(me.role)) {
        setPhase("denied");
        return;
      }
      setPhase("list");
    } catch {
      setPhase("signin");
    }
  }, []);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  // Ro'yxatni yuklash (faqat admin bo'lsa ishlaydi — RLS himoya qiladi)
  const loadUsers = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const list = await fetchAdminUsers(s);
      setUsers(list);
      setError("");
    } catch (e) {
      setError((e as Error)?.message || "Ro'yxat yuklanmadi");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Qidiruv (debounce) + boshlang'ich yuklash
  useEffect(() => {
    if (phase !== "list") return;
    const id = window.setTimeout(() => void loadUsers(debounced), 250);
    return () => window.clearTimeout(id);
  }, [debounced, phase, loadUsers]);

  // Avtomatik yangilash — yangi ro'yxatdan o'tganlar ko'rinib turadi
  useEffect(() => {
    if (phase !== "list") return;
    const iv = window.setInterval(() => void loadUsers(debounced), 30_000);
    return () => window.clearInterval(iv);
  }, [phase, debounced, loadUsers]);

  if (phase === "checking") {
    return <Spinner t={t} label="Ulanish tekshirilmoqda..." />;
  }

  if (phase === "signin") {
    return (
      <SignInCard
        t={t}
        busy={signInBusy}
        error={error}
        onSignIn={async (email, password) => {
          setSignInBusy(true);
          setError("");
          try {
            await signInWithEmail(email, password);
            await checkAccess();
          } catch (e) {
            const msg = (e as Error)?.message?.toLowerCase() || "";
            setError(
              msg.includes("invalid") || msg.includes("credentials")
                ? "Email yoki parol noto'g'ri!"
                : (e as Error)?.message || "Kirishda xatolik"
            );
          } finally {
            setSignInBusy(false);
          }
        }}
      />
    );
  }

  if (phase === "denied") {
    return (
      <Card t={t} className="p-8 text-center max-w-md mx-auto mt-10">
        <div
          className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center mb-4"
          style={{ background: "#ef444422", color: "#f87171", border: "1px solid #ef444444" }}
        >
          <FiShield size={26} />
        </div>
        <h3 className="text-base font-bold text-white mb-1">Ruxsat yo'q</h3>
        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          Sizning hisobingizda admin roli yo'q. Bu bo'lim faqat administratorlar uchun.
          Oddiy foydalanuvchi faqat o'zini ko'ra oladi (RLS himoyasi).
        </p>
        <GhostBtn
          t={t}
          danger
          onClick={() => {
            void signOutSupabase();
            setPhase("signin");
          }}
        >
          <FiLogIn size={12} /> Boshqa hisob bilan kirish
        </GhostBtn>
      </Card>
    );
  }

  // ── ADMIN RO'YXATI ───────────────────────────────────────────────────
  const now = Date.now();
  const total = users?.length ?? 0;
  const today = users?.filter((u) => {
    const ts = parseTs(u.created_at);
    return ts !== null && ts >= new Date().setHours(0, 0, 0, 0);
  }).length ?? 0;
  const week = users?.filter((u) => {
    const ts = parseTs(u.created_at);
    return ts !== null && ts >= now - 7 * DAY;
  }).length ?? 0;

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiDatabase}
        title="Supabase foydalanuvchilari"
        subtitle={users ? `${total} ta` : "..."}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              t={t}
              value={search}
              onChange={setSearch}
              placeholder="Ism, username yoki email..."
              className="w-60"
            />
            <button
              onClick={() => void loadUsers(debounced)}
              disabled={loading}
              className="px-3 py-2 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-40"
              style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
            >
              <FiRefreshCw size={12} className={loading ? "animate-spin" : ""} />
              Yangilash
            </button>
          </div>
        }
      />

      {/* Xulosa statistikasi */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Jami ro'yxatdan o'tgan", value: total, color: t.accent },
          { label: "Bugun ro'yxatdan o'tgan", value: today, color: "#22c55e" },
          { label: "So'nggi 7 kun", value: week, color: "#38bdf8" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3.5 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: t.surface, border: `1px solid ${s.color}22` }}
          >
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Card t={t} className="p-2">
        {loading && !users ? (
          <Spinner t={t} label="Ro'yxat yuklanmoqda..." />
        ) : error && (!users || users.length === 0) ? (
          <div className="py-10 text-center">
            <FiAlertTriangle size={32} className="mx-auto mb-3" style={{ color: "#f87171" }} />
            <div className="text-sm text-white font-medium">Ro'yxat yuklanmadi</div>
            <div className="text-xs text-gray-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {error}
            </div>
          </div>
        ) : !users || users.length === 0 ? (
          <EmptyState
            t={t}
            icon={FiUsers}
            title={search ? "Hech narsa topilmadi" : "Hali ro'yxatdan o'tgan yo'q"}
            desc={
              search
                ? "Qidiruv so'zi bo'yicha foydalanuvchi topilmadi."
                : "Sayt orqali ro'yxatdan o'tgan har bir foydalanuvchi shu yerda avtomatik ko'rinadi."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Foydalanuvchi</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Holat</th>
                  <th className="py-2.5 px-3">Ro'yxatdan o'tgan</th>
                  <th className="py-2.5 px-3">Oxirgi kirish</th>
                  <th className="py-2.5 px-3">Tanga</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const created = parseTs(u.created_at);
                  const lastLogin = parseTs(u.last_login);
                  const blocked = u.status === "blocked";
                  return (
                    <tr
                      key={u.id}
                      className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
                    >
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <AvatarDot avatar={u.avatar_id || "avatar_default"} size={30} />
                          <div className="min-w-0">
                            <div className="text-white font-medium truncate max-w-[160px]">
                              {displayName(u)}
                            </div>
                            {u.username && (
                              <div className="text-[10px] text-gray-600">@{u.username}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 max-w-[200px] truncate">
                        {u.email || "—"}
                      </td>
                      <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                      <td className="py-2.5 px-3">
                        <Badge t={t} color={blocked ? "#ef4444" : "#22c55e"}>
                          {blocked ? "Bloklangan" : "Faol"}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap" title={created ? fmtDateTime(created) : undefined}>
                        {created ? timeAgo(created) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap" title={lastLogin ? fmtDateTime(lastLogin) : undefined}>
                        {lastLogin ? timeAgo(lastLogin) : "—"}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center gap-1 text-gray-300 font-medium">
                            <span style={{ color: "#f59e0b" }}>🪙</span>
                            {(u.coins ?? 0).toLocaleString()}
                          </span>
                          <button
                            onClick={() => setGivingTo(u)}
                            className="px-2 py-1 rounded-lg text-[10px] font-bold transition-all hover:scale-105 active:scale-95"
                            style={{ background: "#f59e0b22", color: "#fbbf24", border: "1px solid #f59e0b44" }}
                            title={`${displayName(u)} ga coin berish`}
                          >
                            + Coin
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {error && users && users.length > 0 && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-[11px] text-red-300 bg-red-500/10 border border-red-500/20">
          <FiAlertTriangle size={13} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-start gap-2 px-1 text-[11px] text-gray-600 leading-relaxed">
        <FiDatabase size={12} className="mt-0.5 flex-shrink-0" />
        <span>
          Ro'yxat <strong className="text-gray-400">haqiqiy</strong> — Supabase bazasidan to'g'ridan-to'g'ri
          o'qiladi. Har 30 soniyada va "Yangilash" tugmasi bilan yangilanadi. Ma'lumotlar RLS orqali himoyalangan.
        </span>
      </div>

      {/* ── Boshqa foydalanuvchiga coin berish ── */}
      {givingTo && (
        <GiveCoinsModal
          t={t}
          user={givingTo}
          onClose={() => setGivingTo(null)}
          onGiven={() => void loadUsers(debounced)}
        />
      )}
    </div>
  );
}

// ── Coin berish oynasi (faqat admin — RPC ichida is_admin() tekshiriladi) ──
function GiveCoinsModal({
  t,
  user,
  onClose,
  onGiven,
}: {
  t: ThemeColors;
  user: SupabaseProfileRow;
  onClose: () => void;
  onGiven: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(user.coins ?? 0);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    const n = parseInt(amount, 10);
    if (Number.isNaN(n) || n <= 0 || n > 1000000) {
      setMsg({ ok: false, text: "To'g'ri miqdor kiriting (1 – 1 000 000)" });
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      await adminAddCoins(user.id, n);
      setBalance((b) => b + n);
      setMsg({ ok: true, text: `${n.toLocaleString()} coin ${displayName(user)} ga qo'shildi!` });
      onGiven();
      // Muvaffaqiyatdan so'ng oynani yopamiz — ro'yxat yangilangan bo'ladi
      window.setTimeout(onClose, 1200);
    } catch (e) {
      const m = (e as Error)?.message?.toLowerCase() || "";
      setMsg({
        ok: false,
        text:
          m.includes("ruxsat") || m.includes("permission") || m.includes("denied")
            ? "Ruxsat yo'q — bu amal faqat admin/owner uchun (RLS himoyasi)."
            : (e as Error)?.message || "Xatolik yuz berdi",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal t={t} title={`Coin berish — ${displayName(user)}`} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}>
          <span className="text-xs text-gray-500">Joriy balans</span>
          <span className="text-sm font-bold text-white flex items-center gap-1.5">
            <span style={{ color: "#f59e0b" }}>🪙</span>
            {balance.toLocaleString()}
          </span>
        </div>

        <div>
          <div className="text-[11px] text-gray-500 uppercase tracking-widest mb-2">Tezkor miqdor</div>
          <div className="flex flex-wrap gap-2">
            {[100, 500, 1000, 5000].map((v) => (
              <button
                key={v}
                onClick={() => setAmount(String(v))}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: amount === String(v) ? "#f59e0b33" : "#ffffff0d",
                  color: amount === String(v) ? "#fbbf24" : "#9ca3af",
                  border: `1px solid ${amount === String(v) ? "#f59e0b66" : "#ffffff14"}`,
                }}
              >
                +{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        <Field t={t} label="O'z miqdor">
          <TextInput
            t={t}
            type="number"
            value={amount}
            onChange={setAmount}
            placeholder="masalan: 250"
            accent
          />
        </Field>

        {msg && (
          <div
            className={`px-3 py-2.5 rounded-xl text-xs animate-pop-in ${
              msg.ok ? "text-green-400" : "text-red-400"
            }`}
            style={{
              background: msg.ok ? "#22c55e11" : "#ef444411",
              border: `1px solid ${msg.ok ? "#22c55e33" : "#ef444433"}`,
            }}
          >
            {msg.text}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <GhostBtn t={t} onClick={onClose} disabled={busy}>Bekor qilish</GhostBtn>
          <PrimaryBtn
            t={t}
            onClick={() => void submit()}
            disabled={busy || !!msg?.ok}
          >
            <span style={{ color: "#000" }}>🪙</span>
            {busy ? "Qo'shilmoqda..." : "Coin berish"}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}

// ── Supabase hisob bilan kirish ────────────────────────────────────────
function SignInCard({
  t,
  busy,
  error,
  onSignIn,
}: {
  t: ThemeColors;
  busy: boolean;
  error: string;
  onSignIn: (email: string, password: string) => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <Card t={t} className="p-6 max-w-md mx-auto mt-8">
      <div className="flex items-center gap-3 mb-4">
        <span
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
        >
          <FiShield size={18} />
        </span>
        <div>
          <div className="text-sm font-bold text-white">Supabase hisob bilan kirish</div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Admin panelga Supabase orqali kiring — rol (admin/owner) RLS orqali tekshiriladi.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <Field t={t} label="Email">
          <TextInput
            t={t}
            type="email"
            value={email}
            onChange={setEmail}
            placeholder="admin@example.com"
            autoFocus
            accent
          />
        </Field>
        <Field t={t} label="Parol">
          <TextInput
            t={t}
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
            accent
          />
        </Field>
        {error && (
          <div className="px-3 py-2 rounded-lg text-xs text-red-400 bg-red-500/10 border border-red-500/30 animate-pop-in">
            {error}
          </div>
        )}
        <PrimaryBtn
          t={t}
          className="w-full justify-center"
          disabled={busy || !email.trim() || !password}
          onClick={() => void onSignIn(email.trim(), password)}
        >
          <FiLogIn size={13} /> {busy ? "Kirilmoqda..." : "Kirish"}
        </PrimaryBtn>
      </div>
    </Card>
  );
}

// ── Backend sozlanmagan yo'l-yo'riq ────────────────────────────────────
function SetupGuide({ t }: { t: ThemeColors }) {
  const steps = [
    {
      title: "Supabase loyihasini yarating",
      desc: "supabase.com da bepul hisob oching va yangi loyiha (project) yarating. Project settings → API bo'limida URL va anon key'ni ko'chirib oling.",
    },
    {
      title: "Kalitlarni .env.local ga yozing",
      desc: "NEXT_PUBLIC_SUPABASE_URL va NEXT_PUBLIC_SUPABASE_ANON_KEY qiymatlarini .env.local faylga qo'shing, so'ng saytni qayta build qiling.",
      cmd: "NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...",
    },
    {
      title: "SQL skriptni ishga tushiring",
      desc: "supabase/schema.sql faylidagi barcha so'rovlarni Supabase dashboard → SQL Editor'da ishga tushiring. Bu profiles jadvali, RLS va trigger'larni yaratadi.",
      cmd: "supabase/schema.sql",
    },
    {
      title: "O'zingizni admin qiling",
      desc: "Sayt orqali ro'yxatdan o'ting (email + parol), so'ng schema.sql dagi ko'rsatma bo'yicha o'z email'ingizga role = 'owner' bering. Shundan keyin shu yerda barcha foydalanuvchilar ko'rinadi.",
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiDatabase}
        title="Supabase foydalanuvchilari"
        subtitle="backend kutilmoqda"
      />

      <Card t={t} className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FiDatabase size={18} />
          </span>
          <div>
            <div className="text-sm font-bold text-white">Haqiqiy foydalanuvchilar bazasi uchun Supabase'ni ulang</div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Bu bo'lim Supabase orqali ro'yxatdan o'tgan barcha foydalanuvchilarni ko'rsatadi.
              Hozircha Supabase kalitlari sozlanmagan — quyidagi qadamlar bilan yoqasiz.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl transition-all hover:bg-white/[0.02]"
              style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: t.accent, color: "#000" }}
                >
                  {i + 1}
                </span>
                <div className="text-xs font-bold text-white">{s.title}</div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">{s.desc}</p>
              {s.cmd && (
                <pre
                  className="mt-2 px-3 py-2 rounded-lg font-mono text-[10px] whitespace-pre-wrap break-words"
                  style={{ background: "#0b1626", border: "1px solid #ffffff14", color: "#e5e7eb" }}
                >
                  {s.cmd}
                </pre>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
