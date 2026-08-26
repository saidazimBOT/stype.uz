"use client";
import { useState, useCallback, useEffect } from "react";
import type { ThemeColors } from "../../types";
import { FiUserPlus, FiX, FiDollarSign, FiAward, FiActivity, FiClock, FiTarget, FiZap, FiSend } from "react-icons/fi";
import { FaCrown, FaTrophy } from "react-icons/fa6";
import {
  Card, SectionHeader, Spinner, EmptyState, AvatarDot, RoleBadge, Badge,
  timeAgo, fmtDateTime, Modal, TextInput, PrimaryBtn, SmallBtn, Field,
} from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAllProfiles, getUserResults, listTransactions, getMyProfile } from "../../lib/db";
import type { ProfileRow, TypingResultRow, CoinTransactionRow } from "../../lib/db";
import { supabase } from "../../lib/supabase";

export default function RegisteredUsersSection({ t, serverMode }: { t: ThemeColors; serverMode: boolean }) {
  const [search, setSearch] = useState("");
  const { data: users, loading, refetch } = useSupabaseQuery(() => listAllProfiles(search || undefined), [search]);
  const [selectedUser, setSelectedUser] = useState<ProfileRow | null>(null);

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiUserPlus}
        title="Ro'yxatdan o'tganlar"
        subtitle={users ? `${users.length} ta` : "..."}
        actions={
          <PrimaryBtn t={t} onClick={() => refetch()}>↻ Yangilash</PrimaryBtn>
        }
      />

      {/* Qidirish */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism, email yoki username bo'yicha qidirish..."
          className="w-full pl-9 pr-3 py-2 rounded-xl text-xs outline-none"
          style={{ background: "#ffffff08", border: "1px solid #ffffff14", color: "#fff" }}
        />
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>

      <Card t={t} className="p-2">
        {!users ? <Spinner t={t} /> : users.length === 0 ? (
          <EmptyState t={t} title="Ro'yxatdan o'tgan foydalanuvchi yo'q" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Ism</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">WPM</th>
                  <th className="py-2.5 px-3 hidden sm:table-cell">Coins</th>
                  <th className="py-2.5 px-3">Ro'yxatdan o'tgan</th>
                  <th className="py-2.5 px-3">Oxirgi faol</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.first_name || u.username).map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="border-t border-white/5 hover:bg-white/[0.03] cursor-pointer transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <AvatarDot avatar={u.avatar} size={26} />
                        <span className="text-white">{u.first_name || u.username || "?"} {u.last_name || ""}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{u.email || "-"}</td>
                    <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                    <td className="py-2.5 px-3 text-gray-400 hidden sm:table-cell">{u.best_wpm ?? "-"}</td>
                    <td className="py-2.5 px-3 text-yellow-400 hidden sm:table-cell">{u.coins}</td>
                    <td className="py-2.5 px-3 text-gray-500">{fmtDateTime(new Date(u.created_at).getTime())}</td>
                    <td className="py-2.5 px-3 text-gray-500">{timeAgo(u.last_seen || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* User detail modal */}
      {selectedUser && (
        <UserDetailModal t={t} user={selectedUser} onClose={() => { setSelectedUser(null); refetch(); }} />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════
// USER DETAIL MODAL
// ═════════════════════════════════════════════════════════════════════════
function UserDetailModal({ t, user, onClose }: { t: ThemeColors; user: ProfileRow; onClose: () => void }) {
  const [profile, setProfile] = useState<ProfileRow>(user);
  const [results, setResults] = useState<TypingResultRow[]>([]);
  const [txs, setTxs] = useState<CoinTransactionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [coinAmount, setCoinAmount] = useState("100");
  const [coinReason, setCoinReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [tab, setTab] = useState<"stats" | "results" | "coins">("stats");

  // Yuklash
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [r, tData] = await Promise.all([
          getUserResults(user.id, 50),
          listTransactions(undefined, 200),
        ]);
        if (!alive) return;
        setResults(r);
        // Faqat shu user'ning tranzaksiyalari
        setTxs(tData.filter(tx => tx.user_id === user.id));
      } catch {}
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
  }, [user.id]);

  // Coin qo'shish (real-time)
  const handleAddCoins = useCallback(async () => {
    if (!coinAmount || busy) return;
    const amount = parseInt(coinAmount, 10);
    if (!amount || amount <= 0 || amount > 1000000) return;

    setBusy(true);
    setMsg("");
    try {
      // RPC orqali — server-side is_admin() tekshiruvi bilan
      if (supabase) {
        const { error } = await supabase.rpc("admin_add_coins", {
          target_id: user.id,
          amount,
        });
        if (error) throw error;
      }

      // Real-time: profile'ni qayta yuklash
      const updated = await getMyProfile();
      // Boshqa user'ning profilini olish kerak — listAllProfiles orqali
      const allUsers = await listAllProfiles();
      const freshProfile = allUsers.find(u => u.id === user.id);
      if (freshProfile) {
        setProfile(freshProfile);
      }

      // Tranzaksiya tarixini yangilash
      const freshTxs = await listTransactions(undefined, 200);
      setTxs(freshTxs.filter(tx => tx.user_id === user.id));

      setMsg(`✓ ${user.first_name || user.username || "?"} ga +${amount} coin berildi!`);
      setCoinAmount("100");
      setCoinReason("");
      setTimeout(() => setMsg(""), 3000);
    } catch (e) {
      setMsg(`✗ Xatolik: ${(e as Error).message || "Noma'lum xato"}`);
      setTimeout(() => setMsg(""), 4000);
    } finally {
      setBusy(false);
    }
  }, [coinAmount, coinReason, busy, user]);

  // Statistika
  const avgWpm = results.length ? Math.round(results.reduce((a, r) => a + r.wpm, 0) / results.length) : 0;
  const avgAcc = results.length ? Math.round(results.reduce((a, r) => a + r.accuracy, 0) / results.length) : 0;
  const bestWpm = results.length ? Math.max(...results.map(r => r.wpm)) : 0;
  const totalTests = results.length;

  return (
    <Modal t={t} title="Foydalanuvchi profili" onClose={onClose} wide>
      {/* Profil boshi */}
      <div className="flex items-start gap-4 mb-5 pb-5 border-b border-white/5">
        <AvatarDot avatar={profile.avatar} size={56} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white truncate">
              {profile.first_name || profile.username || "?"} {profile.last_name || ""}
            </h2>
            <RoleBadge t={t} role={profile.role} />
            {profile.banned && <Badge t={t} color="#ef4444">Bloklangan</Badge>}
          </div>
          <div className="text-xs text-gray-400 mt-1">{profile.email || "Email yo'q"}</div>
          <div className="text-[10px] text-gray-600 mt-0.5">
            ID: {profile.id.slice(0, 8)}... • Ro'yxatdan: {fmtDateTime(new Date(profile.created_at).getTime())}
          </div>
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex gap-1 mb-4 p-1 rounded-xl" style={{ background: "#ffffff06" }}>
        {[
          { id: "stats" as const, icon: FiActivity, label: "Statistika" },
          { id: "results" as const, icon: FaTrophy, label: `Natijalar (${totalTests})` },
          { id: "coins" as const, icon: FiDollarSign, label: "Coin berish" },
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setTab(tb.id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab === tb.id ? t.accent + "22" : "transparent",
              color: tab === tb.id ? t.accent : "#6b7280",
              border: `1px solid ${tab === tb.id ? t.accent + "44" : "transparent"}`,
            }}
          >
            <tb.icon size={13} />
            <span className="hidden sm:inline">{tb.label}</span>
          </button>
        ))}
      </div>

      {loading ? <Spinner t={t} /> : (
        <>
          {/* STATISTIKA */}
          {tab === "stats" && (
            <div className="space-y-4">
              {/* Asosiy ko'rsatkichlar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { icon: FaTrophy, label: "Eng yaxshi WPM", value: profile.best_wpm ?? 0, color: "#fbbf24" },
                  { icon: FiTarget, label: "O'rtacha WPM", value: avgWpm, color: "#38bdf8" },
                  { icon: FiActivity, label: "O'rtacha Aniqlik", value: `${avgAcc}%`, color: "#22c55e" },
                  { icon: FiZap, label: "Jami testlar", value: totalTests, color: "#a78bfa" },
                ].map((s, i) => (
                  <div key={i} className="p-3 rounded-xl" style={{ background: "#ffffff06", border: `1px solid ${s.color}22` }}>
                    <s.icon size={14} style={{ color: s.color }} className="mb-1.5" />
                    <div className="text-lg font-bold text-white">{s.value}</div>
                    <div className="text-[10px] text-gray-500">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Qo'shimcha ma'lumotlar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Coins</div>
                  <div className="text-sm font-bold text-yellow-400">🪙 {profile.coins.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">XP</div>
                  <div className="text-sm font-bold text-purple-400">⚡ {profile.xp.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">G'alaba / Mag'lubiyat</div>
                  <div className="text-sm font-bold text-white">
                    <span className="text-green-400">{profile.wins}</span>
                    <span className="text-gray-600 mx-1">/</span>
                    <span className="text-red-400">{profile.losses}</span>
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Dovonlar</div>
                  <div className="text-sm font-bold text-blue-400">{profile.races}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Durang</div>
                  <div className="text-sm font-bold text-gray-400">{profile.draws}</div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-1">Status</div>
                  <div className="text-sm font-bold">
                    <Badge t={t} color={profile.status === "active" ? "#22c55e" : "#ef4444"}>
                      {profile.status === "active" ? "Faol" : "Bloklangan"}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* So'nggi natijalar grafigi */}
              {results.length > 0 && (
                <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                  <div className="text-[10px] text-gray-500 mb-2">So'nggi WPM natijalari</div>
                  <div className="flex items-end gap-1 h-16">
                    {results.slice(0, 20).reverse().map((r, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-t transition-all"
                        style={{
                          height: `${Math.min(100, (r.wpm / 200) * 100)}%`,
                          background: r.wpm >= 80 ? "#22c55e" : r.wpm >= 50 ? "#f59e0b" : "#ef4444",
                          opacity: 0.7 + (i / 20) * 0.3,
                        }}
                        title={`${r.wpm} WPM — ${r.accuracy}%`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between text-[9px] text-gray-600 mt-1">
                    <span>Eski</span>
                    <span>Yangi</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* NATIJALAR */}
          {tab === "results" && (
            <div className="space-y-2">
              {results.length === 0 ? (
                <EmptyState t={t} title="Test natijalari yo'q" desc="Foydalanuvchi hali hech qanday test topshirmagan" />
              ) : (
                <div className="space-y-1.5">
                  {results.map((r) => (
                    <div key={r.id} className="flex items-center gap-3 py-2 px-3 rounded-xl text-xs" style={{ background: "#ffffff04" }}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold"
                          style={{
                            background: r.wpm >= 80 ? "#22c55e22" : r.wpm >= 50 ? "#f59e0b22" : "#ef444422",
                            color: r.wpm >= 80 ? "#22c55e" : r.wpm >= 50 ? "#f59e0b" : "#ef4444",
                          }}>
                          {r.wpm}
                        </div>
                        <div>
                          <div className="text-white font-medium">{r.wpm} WPM • {r.accuracy}% aniqlik</div>
                          <div className="text-[10px] text-gray-500">
                            {r.correct}/{r.total} belgi • {r.time}s • {r.lang}
                          </div>
                        </div>
                      </div>
                      <div className="text-[10px] text-gray-600 whitespace-nowrap">
                        {fmtDateTime(r.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* COIN BERISH */}
          {tab === "coins" && (
            <div className="space-y-4">
              {/* Joriy balans */}
              <div className="p-4 rounded-xl text-center" style={{ background: "#ffffff06", border: `1px solid ${t.accent}22` }}>
                <div className="text-[10px] text-gray-500 mb-1">Joriy balans</div>
                <div className="text-2xl font-bold text-yellow-400">🪙 {profile.coins.toLocaleString()}</div>
              </div>

              {/* Coin berish formasi */}
              <div className="p-4 rounded-xl space-y-3" style={{ background: "#ffffff06", border: `1px solid ${t.accent}22` }}>
                <div className="text-sm font-medium text-gray-300 flex items-center gap-2">
                  <FiDollarSign size={14} style={{ color: t.accent }} />
                  Coin berish
                </div>

                <Field t={t} label="Miqdor">
                  <div className="flex gap-2">
                    {[50, 100, 500, 1000].map((a) => (
                      <button
                        key={a}
                        onClick={() => setCoinAmount(String(a))}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: coinAmount === String(a) ? t.accent + "22" : "#ffffff08",
                          color: coinAmount === String(a) ? t.accent : "#6b7280",
                          border: `1px solid ${coinAmount === String(a) ? t.accent + "44" : "#ffffff14"}`,
                        }}
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                  <TextInput t={t} value={coinAmount} onChange={setCoinAmount} type="number" placeholder="100" accent className="mt-2" />
                </Field>

                <Field t={t} label="Sabab (ixtiyoriy)">
                  <TextInput t={t} value={coinReason} onChange={setCoinReason} placeholder="Masalan:Bonus, sovg'a..." />
                </Field>

                {msg && (
                  <div className={`px-3 py-2 rounded-lg text-xs animate-pop-in ${
                    msg.startsWith("✓") ? "text-green-400 bg-green-500/10 border border-green-500/30" : "text-red-400 bg-red-500/10 border border-red-500/30"
                  }`}>
                    {msg}
                  </div>
                )}

                <PrimaryBtn t={t} onClick={handleAddCoins} disabled={busy || !coinAmount}>
                  <FiSend size={12} />
                  {busy ? "Yuborilmoqda..." : `+${coinAmount || 0} coin yuborish`}
                </PrimaryBtn>
              </div>

              {/* Tranzaksiya tarixi */}
              <div>
                <div className="text-xs text-gray-500 mb-2">Tranzaksiya tarixi ({txs.length})</div>
                {txs.length === 0 ? (
                  <div className="text-[11px] text-gray-600 py-4 text-center">Tranzaksiya yo'q</div>
                ) : (
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {txs.map((tx) => (
                      <div key={tx.id} className="flex items-center gap-2 py-1.5 px-3 rounded-lg text-[11px]" style={{ background: "#ffffff04" }}>
                        <span className={`font-bold w-20 ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount} {tx.kind === "coins" ? "🪙" : "⚡"}
                        </span>
                        <span className="text-gray-400 flex-1 truncate">{tx.reason || "—"}</span>
                        {tx.admin_name && <span className="text-gray-600">by {tx.admin_name}</span>}
                        <span className="text-gray-600 whitespace-nowrap">{fmtDateTime(tx.created_at)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
