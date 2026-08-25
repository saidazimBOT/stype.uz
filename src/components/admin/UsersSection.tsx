"use client";

import { useEffect, useState } from "react";
import type { ThemeColors } from "../../types";
import { FiEye, FiGift, FiTrash2, FiXCircle } from "react-icons/fi";
import { FaUserCheck } from "react-icons/fa6";
import { LANG_FLAGS } from "../../data/texts";
import { Card, SectionHeader, Spinner, EmptyState, ErrorBox, SearchInput, Modal, ConfirmDialog, AvatarDot, RoleBadge, PrimaryBtn, GhostBtn, SmallBtn, Badge, timeAgo, fmtDateTime, TextArea, TextInput, Field } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAllProfiles, getProfileById, getUserResults, addCoins, logAdminAction, updateProfile } from "../../lib/db";
import type { ProfileRow, TypingResultRow } from "../../lib/db";
import { supabase } from "../../lib/supabase";

export default function UsersSection({ t, myRole }: { t: ThemeColors; myRole: string }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [gift, setGift] = useState<ProfileRow | null>(null);
  const [confirm, setConfirm] = useState<null | { type: "ban" | "unban" | "delete"; user: ProfileRow }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const { data: users, loading, refetch } = useSupabaseQuery(() => listAllProfiles(debounced || undefined), [debounced]);
  const isOwner = myRole === "owner";

  const run = async (fn: () => Promise<unknown>) => {
    setBusy(true); setError("");
    try { await fn(); setConfirm(null); refetch(); }
    catch (e) { setError((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FaUserCheck} title="Foydalanuvchilar" subtitle={users ? `${users.length} ta` : "..."}
        actions={<SearchInput t={t} value={search} onChange={setSearch} placeholder="Qidirish..." className="w-56" />} />
      <ErrorBox message={error} onRetry={() => setError("")} />
      <Card t={t} className="p-2">
        {!users ? <Spinner t={t} /> : users.length === 0 ? (
          <EmptyState t={t} title="Foydalanuvchi topilmadi" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Foydalanuvchi</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3 text-right">Coins</th>
                  <th className="py-2.5 px-3 text-right">WPM</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Oxirgi faol</th>
                  <th className="py-2.5 px-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarDot avatar={u.avatar} size={30} />
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate max-w-[140px]">{u.username || u.first_name || "(nomsiz)"}</div>
                          <div className="text-[10px] text-gray-600">{u.email || u.id.slice(-8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: "#f59e0b" }}>{u.coins}</td>
                    <td className="py-2.5 px-3 text-right font-bold" style={{ color: t.accent }}>{u.best_wpm || 0}</td>
                    <td className="py-2.5 px-3">
                      {u.banned ? <Badge t={t} color="#ef4444">Ban</Badge> : <Badge t={t} color="#22c55e">Faol</Badge>}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{timeAgo(u.last_seen || 0)}</td>
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
                            <SmallBtn t={t} color="#22c55e" onClick={() => run(async () => {
                              await supabase!.from("profiles").update({ banned: false, banned_reason: null }).eq("id", u.id);
                              await logAdminAction("unban", u.username || "?");
                            })}>
                              <FaUserCheck size={11} /> Unban
                            </SmallBtn>
                          ) : (
                            <SmallBtn t={t} color="#ef4444" onClick={() => setConfirm({ type: "ban", user: u })}>
                              <FiXCircle size={11} /> Ban
                            </SmallBtn>
                          )
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

      {gift && (
        <GiftModal t={t} user={gift} onClose={() => { setGift(null); refetch(); }} />
      )}

      {confirm && (
        <ConfirmDialog t={t} danger title={confirm.type === "ban" ? "Ban qilish" : "Ban bekor qilish"}
          message={`${confirm.user.username || "Bu foydalanuvchi"} ni ${confirm.type === "ban" ? "ban" : "unban"} qilasizmi?`}
          busy={busy} onCancel={() => setConfirm(null)}
          onConfirm={() => run(async () => {
            await supabase!.from("profiles").update({ banned: confirm.type === "ban", banned_reason: confirm.type === "ban" ? "Admin tomonidan" : null }).eq("id", confirm.user.id);
            await logAdminAction(confirm.type === "ban" ? "ban" : "unban", confirm.user.username || "?");
          })} />
      )}
    </div>
  );
}

function GiftModal({ t, user, onClose }: { t: ThemeColors; user: ProfileRow; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState("");
  const amt = Math.round(Number(amount) || 0);

  const submit = async () => {
    setBusy(true);
    try {
      await addCoins(user.id, amt, "🎁 Admin sovg'a", "admin");
      setOk(`✓ ${amt} 🪙 yuborildi!`);
      setTimeout(onClose, 1500);
    } catch (e) { alert((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <Modal t={t} title="🎁 Coin sovg'a" onClose={busy ? () => {} : onClose}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#ffffff06" }}>
          <AvatarDot avatar={user.avatar} size={38} />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-white truncate">{user.username || user.first_name}</div>
            <div className="text-[11px] text-gray-500">Balans: <span className="font-bold text-yellow-400">🪙 {user.coins}</span></div>
          </div>
        </div>
        <Field t={t} label="Miqdor">
          <TextInput t={t} value={amount} onChange={setAmount} type="number" placeholder="100" accent autoFocus />
        </Field>
        {ok && <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30">{ok}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <GhostBtn t={t} onClick={onClose}>Yopish</GhostBtn>
          <PrimaryBtn t={t} onClick={submit} disabled={busy || amt <= 0}>
            <FiGift size={12} /> {busy ? "..." : `Sovg'a (+${amt} 🪙)`}
          </PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
