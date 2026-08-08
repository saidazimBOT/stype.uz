"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiEye, FiGift, FiTrash2, FiXCircle } from "react-icons/fi";
import { FaUserCheck } from "react-icons/fa6";
import { LANG_FLAGS } from "../../data/texts";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, SearchInput, Modal, ConfirmDialog,
  AvatarDot, RoleBadge, PrimaryBtn, GhostBtn, SmallBtn, Badge, timeAgo, fmtDateTime, TextArea, TextInput, Field,
} from "./adminUi";
import { achievementIcon } from "./achievementIcons";
import type { AdminUser, UserProfile } from "./types";
import { errMsg } from "./useAdminProfile";

export default function UsersSection({
  t,
  myRole,
}: {
  t: ThemeColors;
  myRole: string;
}) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [profile, setProfile] = useState<AdminUser | null>(null);
  const [gift, setGift] = useState<AdminUser | null>(null);
  const [confirm, setConfirm] = useState<null | { type: "ban" | "unban" | "delete"; user: AdminUser }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const users = useQuery(api.admin.listUsers, { search: debounced || undefined, limit: 200 }) as AdminUser[] | undefined;
  const banUser = useMutation(api.admin.setUserBan);
  const deleteUser = useMutation(api.admin.deleteUser);
  const giftCoins = useMutation(api.admin.giftCoins);

  const isOwner = myRole === "owner";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      setConfirm(null);
      setProfile((p) => (p ? { ...p } : p)); // trigger re-render; data refreshes via reactivity
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FaUserCheck}
        title="Foydalanuvchilar"
        subtitle={users ? `${users.length} ta` : "..."}
        actions={<SearchInput t={t} value={search} onChange={setSearch} placeholder="Username yoki ID qidirish..." className="w-56" />}
      />
      <ErrorBox message={error} onRetry={() => setError("")} />

      <Card t={t} className="p-2">
        {!users ? (
          <Spinner t={t} />
        ) : users.length === 0 ? (
          <EmptyState t={t} title="Foydalanuvchi topilmadi" desc="Boshqa qidiruv so'zini sinab ko'ring." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Foydalanuvchi</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3 text-right">Coins</th>
                  <th className="py-2.5 px-3 text-right">XP</th>
                  <th className="py-2.5 px-3 text-right">WPM</th>
                  <th className="py-2.5 px-3 text-right">Janglar</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Oxirgi faol</th>
                  <th className="py-2.5 px-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarDot avatar={u.avatar} size={30} />
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate max-w-[140px]">{u.username || "(nomsiz)"}</div>
                          <div className="text-[10px] text-gray-600">{u._id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#f59e0b" }}>{u.coins}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#a78bfa" }}>{u.xp}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: t.accent }}>{u.bestWpm || 0}</td>
                    <td className="py-2.5 px-3 text-right text-gray-400">{u.races}</td>
                    <td className="py-2.5 px-3">
                      {u.banned ? (
                        <Badge t={t} color="#ef4444">Ban</Badge>
                      ) : u.role === "owner" ? (
                        <Badge t={t} color="#f59e0b">Owner</Badge>
                      ) : (
                        <Badge t={t} color="#22c55e">Faol</Badge>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap" title={fmtDateTime(u.lastSeen)}>
                      {timeAgo(u.lastSeen)}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <SmallBtn t={t} color={t.accent} onClick={() => setProfile(u)}>
                          <span className="flex items-center gap-1"><FiEye size={11} /> Profil</span>
                        </SmallBtn>
                        <SmallBtn t={t} color="#f59e0b" onClick={() => setGift(u)}>
                          <span className="flex items-center gap-1"><FiGift size={11} /> Gift</span>
                        </SmallBtn>
                        {u.role !== "owner" && (
                          u.banned ? (
                            <SmallBtn t={t} color="#22c55e" onClick={() => setConfirm({ type: "unban", user: u })}>
                              <FaUserCheck size={11} /> Unban
                            </SmallBtn>
                          ) : (
                            <SmallBtn t={t} color="#ef4444" onClick={() => setConfirm({ type: "ban", user: u })}>
                              <FiXCircle size={11} /> Ban
                            </SmallBtn>
                          )
                        )}
                        {(!u.banned || isOwner) && (
                          <SmallBtn t={t} color="#f87171" onClick={() => setConfirm({ type: "delete", user: u })}>
                            <FiTrash2 size={11} />
                          </SmallBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {profile && (
        <UserProfileModal
          t={t}
          userId={profile._id}
          myRole={myRole}
          onClose={() => setProfile(null)}
          onChanged={() => setProfile(null)}
        />
      )}

      {gift && (
        <GiftModal
          t={t}
          user={gift}
          giftCoins={giftCoins}
          onClose={() => setGift(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          t={t}
          danger={confirm.type !== "unban"}
          title={confirm.type === "ban" ? "Ban qilish" : confirm.type === "unban" ? "Ban bekor qilish" : "Foydalanuvchini o'chirish"}
          message={
            confirm.type === "ban"
              ? `${confirm.user.username || "Bu foydalanuvchi"} ni ban qilasizmi? Ban qilingan foydalanuvchi saytga kira olmaydi.`
              : confirm.type === "unban"
              ? `${confirm.user.username || "Bu foydalanuvchi"} ga kirishni qaytarasizmi?`
              : `"${confirm.user.username || "Bu foydalanuvchi"}" hisobi butunlay o'chiriladi (profil, natijalar, yutuqlar, tranzaksiyalar). Bu amalni ortga qaytarib bo'lmaydi!`
          }
          confirmLabel={confirm.type === "delete" ? "O'chirish" : "Tasdiqlash"}
          busy={busy}
          onCancel={() => setConfirm(null)}
          onConfirm={() =>
            run(async () => {
              if (confirm.type === "delete") await deleteUser({ userId: confirm.user._id });
              else await banUser({ userId: confirm.user._id, banned: confirm.type === "ban" });
            })
          }
        />
      )}
    </div>
  );
}

// ── Profil oynasi ───────────────────────────────────────────────────────
function UserProfileModal({
  t,
  userId,
  myRole,
  onClose,
  onChanged,
}: {
  t: ThemeColors;
  userId: string;
  myRole: string;
  onClose: () => void;
  onChanged: () => void;
}) {
  const profile = useQuery(api.admin.getUserProfile, { userId }) as UserProfile | undefined;
  const setRole = useMutation(api.admin.setUserRole);
  const [roleBusy, setRoleBusy] = useState(false);
  const [roleError, setRoleError] = useState("");
  const isOwner = myRole === "owner";

  const changeRole = async (role: string) => {
    setRoleBusy(true);
    setRoleError("");
    try {
      await setRole({ userId, role: role as "user" | "admin" | "owner" });
    } catch (e) {
      setRoleError(errMsg(e));
    } finally {
      setRoleBusy(false);
    }
  };

  return (
    <Modal t={t} title="Foydalanuvchi profili" onClose={onClose} wide>
      {!profile ? (
        <Spinner t={t} />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <AvatarDot avatar={profile.user.avatar} size={52} />
            <div className="flex-1 min-w-0">
              <div className="text-base font-bold text-white flex items-center gap-2">
                {profile.user.username || "(nomsiz)"}
                <RoleBadge t={t} role={profile.user.role} />
                {profile.user.banned && <Badge t={t} color="#ef4444">Ban: {profile.user.bannedReason || "sababsiz"}</Badge>}
              </div>
              <div className="text-[11px] text-gray-500">
                Ro'yxatdan o'tgan: {fmtDateTime(profile.user.createdAt)} · Oxirgi faol: {timeAgo(profile.user.lastSeen)}
              </div>
            </div>
          </div>

          {roleError && <ErrorBox message={roleError} />}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { label: "Coins", value: profile.user.coins, color: "#f59e0b" },
              { label: "XP", value: profile.user.xp, color: "#a78bfa" },
              { label: "Best WPM", value: profile.user.bestWpm || 0, color: t.accent },
              { label: "Janglar", value: `${profile.user.wins}W / ${profile.user.losses}L / ${profile.user.draws}D`, color: "#38bdf8" },
            ].map((s) => (
              <div key={s.label} className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                <div className="text-lg font-bold" style={{ color: s.color }}>{s.value}</div>
                <div className="text-[10px] text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rol o'zgartirish */}
          <div className="p-3.5 rounded-xl" style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}>
            <div className="text-xs font-medium text-gray-300 mb-2">Rol o'zgartirish</div>
            <div className="flex gap-1.5 flex-wrap">
              {(["user", "admin", "owner"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => changeRole(r)}
                  disabled={roleBusy || (r === "owner" && !isOwner) || profile.user.role === r}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 disabled:opacity-40"
                  style={{
                    background: profile.user.role === r ? (r === "owner" ? "#f59e0b" : r === "admin" ? "#38bdf8" : "#ffffff1a") : "#ffffff0a",
                    color: profile.user.role === r ? "#000" : "#9ca3af",
                    border: `1px solid ${profile.user.role === r ? "transparent" : "#ffffff14"}`,
                  }}
                >
                  {r === "owner" ? "Owner" : r === "admin" ? "Admin" : "User"}
                </button>
              ))}
            </div>
            {!isOwner && (
              <div className="text-[10px] text-gray-600 mt-1.5">Owner rolini faqat owner o'zgartira oladi.</div>
            )}
          </div>

          {/* Yutuqlar */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-2">Yutuqlar ({profile.achievements.length})</div>
            {profile.achievements.length === 0 ? (
              <div className="text-[11px] text-gray-600">Hozircha yutuq ochilmagan.</div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {profile.achievements.map((a) => {
                  const Icon = achievementIcon(a.icon);
                  return (
                    <div key={a.key} className="flex items-center gap-2 p-2 rounded-xl" style={{ background: "#ffffff06" }} title={`${a.title} · ${fmtDateTime(a.unlockedAt)}`}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: a.color + "1f", color: a.color }}>
                        <Icon size={15} />
                      </span>
                      <span className="text-[11px] text-gray-300 truncate">{a.title}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* So'nggi natijalar */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-2">So'nggi type testlar ({profile.results.length})</div>
            {profile.results.length === 0 ? (
              <div className="text-[11px] text-gray-600">Hozircha natija yo'q.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-gray-600 uppercase tracking-widest text-[9px]">
                      <th className="py-1.5 pr-3">Vaqt</th>
                      <th className="py-1.5 pr-3">WPM</th>
                      <th className="py-1.5 pr-3">Aniqlik</th>
                      <th className="py-1.5 pr-3">Xatolar</th>
                      <th className="py-1.5 pr-3">Til</th>
                      <th className="py-1.5">Davr</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profile.results.map((r, i) => (
                      <tr key={i} className="border-t border-white/5">
                        <td className="py-1.5 pr-3 text-gray-500 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                        <td className="py-1.5 pr-3 font-bold" style={{ color: t.accent }}>{r.wpm}</td>
                        <td className="py-1.5 pr-3" style={{ color: r.accuracy >= 95 ? "#22c55e" : r.accuracy >= 80 ? "#f59e0b" : "#ef4444" }}>{r.accuracy}%</td>
                        <td className="py-1.5 pr-3 text-gray-400">{r.errors}</td>
                        <td className="py-1.5 pr-3"><span className="px-1.5 py-0.5 rounded text-[9px]" style={{ background: "#ffffff0d", color: "#9ca3af" }}>{LANG_FLAGS[r.lang] || "🏳️"} {r.lang.toUpperCase()}</span></td>
                        <td className="py-1.5">{r.duration ? `${r.duration}s` : "∞"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tranzaksiyalar */}
          <div>
            <div className="text-xs font-medium text-gray-300 mb-2">Tranzaksiyalar ({profile.transactions.length})</div>
            {profile.transactions.length === 0 ? (
              <div className="text-[11px] text-gray-600">Hozircha tranzaksiya yo'q.</div>
            ) : (
              <div className="space-y-1.5">
                {profile.transactions.map((tr, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className={`font-bold ${tr.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {tr.amount >= 0 ? "+" : ""}{tr.amount} {tr.kind === "coins" ? "🪙" : "⚡"}
                    </span>
                    <span className="text-gray-400 truncate flex-1">{tr.reason}</span>
                    <span className="text-gray-600 whitespace-nowrap">{fmtDateTime(tr.createdAt)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
            <GhostBtn t={t} onClick={onClose}>Yopish</GhostBtn>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── Coin sovg'a (padarka) oynasi ────────────────────────────────────────
function GiftModal({
  t,
  user,
  giftCoins,
  onClose,
}: {
  t: ThemeColors;
  user: AdminUser;
  giftCoins: (args: { userId: string; amount: number; message?: string }) => Promise<unknown>;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const amt = Math.round(Number(amount) || 0);
  const invalid = amt <= 0;

  const submit = async () => {
    setBusy(true);
    setError("");
    setOk("");
    try {
      await giftCoins({ userId: user._id, amount: amt, message: message.trim() || undefined });
      setOk(`✓ ${amt} 🪙 ${user.username || "foydalanuvchi"} ga yuborildi!`);
      setAmount("");
      setMessage("");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal t={t} title="🎁 Coin sovg'a (padarka)" onClose={busy ? () => {} : onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#ffffff06" }}>
          <AvatarDot avatar={user.avatar} size={38} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{user.username || "(nomsiz)"}</div>
            <div className="text-[11px] text-gray-500">
              Joriy balans: <span className="font-bold text-yellow-400">🪙 {user.coins}</span>
            </div>
          </div>
          <RoleBadge t={t} role={user.role} />
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[10, 50, 100, 500, 1000, 5000].map((n) => (
            <button
              key={n}
              onClick={() => setAmount(String(n))}
              className="px-2 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
              style={{
                background: Number(amount) === n ? "#f59e0b33" : "#22c55e1a",
                color: Number(amount) === n ? "#fbbf24" : "#4ade80",
                border: `1px solid ${Number(amount) === n ? "#f59e0b66" : "#22c55e44"}`,
              }}
            >
              +{n}
            </button>
          ))}
        </div>

        <Field t={t} label="Miqdor (🪙)">
          <TextInput t={t} value={amount} onChange={setAmount} type="number" placeholder="masalan: 100" accent autoFocus />
        </Field>
        <Field t={t} label="Xabar (ixtiyoriy)" hint="Masalan: saytimizga kirganingiz uchun rahmat!">
          <TextInput t={t} value={message} onChange={setMessage} placeholder="Tabrik matni..." />
        </Field>

        {error && <ErrorBox message={error} />}
        {ok && (
          <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
            {ok}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <GhostBtn t={t} onClick={onClose}>Yopish</GhostBtn>
          <PrimaryBtn t={t} onClick={submit} disabled={busy || invalid}>
            <FiGift size={12} /> {busy ? "Yuborilmoqda..." : `Sovg'a qilish (+${amt || 0} 🪙)`}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
