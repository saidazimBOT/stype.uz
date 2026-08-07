"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiDollarSign, FiGift, FiMinus, FiPlus } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, SearchInput, AvatarDot, RoleBadge,
  PrimaryBtn, GhostBtn, TextInput, TextArea, Select, Badge, fmtDateTime,
} from "./adminUi";
import type { AdminUser, TxItem } from "./types";
import { errMsg } from "./useAdminProfile";

export default function EconomySection({ t }: { t: ThemeColors }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const [kind, setKind] = useState<"coins" | "xp">("coins");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const users = useQuery(api.admin.listUsers, { search: debounced || undefined, limit: 40 }) as AdminUser[] | undefined;
  const transactions = useQuery(api.admin.listTransactions, { search: debounced || undefined, limit: 60 }) as TxItem[] | undefined;
  const adjust = useMutation(api.admin.adjustBalance);
  const giftAll = useMutation(api.admin.giftCoinsToAll);

  // ── Barchaga sovg'a (mass gift) ──
  const [giftAmount, setGiftAmount] = useState("");
  const [giftMessage, setGiftMessage] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const [giftError, setGiftError] = useState("");
  const [giftOk, setGiftOk] = useState("");

  const giftAmt = Math.round(Number(giftAmount) || 0);
  const giftInvalid = giftAmt <= 0;

  const submitGiftAll = async () => {
    setGiftBusy(true);
    setGiftError("");
    setGiftOk("");
    try {
      const res = (await giftAll({ amount: giftAmt, message: giftMessage.trim() || undefined })) as { count: number };
      setGiftOk(`✓ ${res.count} ta foydalanuvchiga +${giftAmt} 🪙 yuborildi!`);
      setGiftAmount("");
      setGiftMessage("");
    } catch (e) {
      setGiftError(errMsg(e));
    } finally {
      setGiftBusy(false);
    }
  };

  const amt = Math.round(Number(amount) || 0);
  const current = selected ? (kind === "coins" ? selected.coins : selected.xp) : 0;
  const projected = current + amt;
  const invalid = !selected || amt === 0 || projected < 0;

  const submit = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      await adjust({ userId: selected._id, kind, amount: amt, reason });
      setOkMsg(`${amt > 0 ? "+" : ""}${amt} ${kind} qo'shildi → ${selected.username}`);
      setAmount("");
      setReason("");
      // Yangilangan balansni darhol ko'rsatish
      setSelected((prev) =>
        prev
          ? kind === "coins"
            ? { ...prev, coins: Math.max(0, prev.coins + amt) }
            : { ...prev, xp: Math.max(0, prev.xp + amt) }
          : prev
      );
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
        icon={FiDollarSign}
        title="Coins & XP boshqaruvi"
        subtitle="Salbiy balans taqiqlangan"
        actions={
          <SearchInput
            t={t}
            value={search}
            onChange={(v) => {
              setSearch(v);
              if (!v) setSelected(null);
            }}
            placeholder="Foydalanuvchi yoki tranzaksiya..."
            className="w-56"
          />
        }
      />

      {okMsg && (
        <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
          ✓ {okMsg}
        </div>
      )}
      <ErrorBox message={error} onRetry={() => setError("")} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        {/* Foydalanuvchi tanlash */}
        <Card t={t} className="p-5">
          <div className="text-sm font-medium text-gray-300 mb-3">1. Foydalanuvchini tanlang</div>
          {!users ? (
            <Spinner t={t} />
          ) : users.length === 0 ? (
            <EmptyState t={t} title="Foydalanuvchi topilmadi" />
          ) : (
            <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
              {users.map((u) => (
                <button
                  key={u._id}
                  onClick={() => setSelected(u)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all text-left ${
                    selected?._id === u._id ? "" : "hover:bg-white/[0.03]"
                  }`}
                  style={{
                    background: selected?._id === u._id ? t.accent + "1a" : "transparent",
                    border: `1px solid ${selected?._id === u._id ? t.accent + "55" : "transparent"}`,
                  }}
                >
                  <AvatarDot avatar={u.avatar} size={30} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-white truncate">{u.username || "(nomsiz)"}</div>
                    <div className="text-[10px] text-gray-500">
                      🪙 {u.coins} · ⚡ {u.xp} XP
                    </div>
                  </div>
                  <RoleBadge t={t} role={u.role} />
                </button>
              ))}
            </div>
          )}
        </Card>

        {/* Balans sozlash */}
        <Card t={t} className="p-5">
          <div className="text-sm font-medium text-gray-300 mb-3">2. Balansni sozlash</div>
          {!selected ? (
            <EmptyState t={t} title="Avval foydalanuvchini tanlang" desc="Chapdagi ro'yxatdan kimnidir tanlang." />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#ffffff06" }}>
                <AvatarDot avatar={selected.avatar} size={38} />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-white">{selected.username}</div>
                  <div className="text-[11px] text-gray-500">
                    Coins: <span className="font-bold text-yellow-400">{selected.coins}</span> · XP:{" "}
                    <span className="font-bold" style={{ color: "#a78bfa" }}>{selected.xp}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setKind("coins")}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: kind === "coins" ? "#f59e0b22" : "#ffffff06",
                    color: kind === "coins" ? "#fbbf24" : "#9ca3af",
                    border: `1px solid ${kind === "coins" ? "#f59e0b55" : "#ffffff14"}`,
                  }}
                >
                  🪙 Coins
                </button>
                <button
                  onClick={() => setKind("xp")}
                  className="px-3 py-2.5 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: kind === "xp" ? "#a78bfa22" : "#ffffff06",
                    color: kind === "xp" ? "#a78bfa" : "#9ca3af",
                    border: `1px solid ${kind === "xp" ? "#a78bfa55" : "#ffffff14"}`,
                  }}
                >
                  ⚡ XP
                </button>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[10, 50, 100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAmount(String(Number(amount) + n))}
                    className="px-2 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "#22c55e1a", color: "#4ade80", border: "1px solid #22c55e44" }}
                  >
                    <FiPlus size={10} className="inline mr-0.5" />{n}
                  </button>
                ))}
                {[-10, -50, -100].map((n) => (
                  <button
                    key={n}
                    onClick={() => setAmount(String(Number(amount) + n))}
                    className="px-2 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105"
                    style={{ background: "#ef44441a", color: "#f87171", border: "1px solid #ef444444" }}
                  >
                    <FiMinus size={10} className="inline mr-0.5" />{Math.abs(n)}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-500 mb-1">Miqdor (+/-)</label>
                  <TextInput t={t} value={amount} onChange={setAmount} type="number" placeholder="masalan: 50" accent />
                </div>
                <div className="flex items-end">
                  <div
                    className={`w-full px-3.5 py-2.5 rounded-xl text-sm font-bold ${
                      projected < 0 ? "text-red-400" : projected > current ? "text-green-400" : "text-gray-300"
                    }`}
                    style={{ background: "#ffffff08", border: "1px solid #ffffff14" }}
                  >
                    {current} → {projected}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-500 mb-1">Sabab (tranzaksiya tarixida ko'rinadi)</label>
                <TextInput t={t} value={reason} onChange={setReason} placeholder="masalan: dizayn tanlovi g'olibi" accent />
              </div>

              {projected < 0 && (
                <div className="px-3 py-2 rounded-lg text-[11px] text-red-400 bg-red-500/10 border border-red-500/30">
                  ⚠️ Salbiy balansga yo'l qo'yilmaydi. Balans 0 dan past bo'lolmaydi.
                </div>
              )}

              <div className="flex justify-end gap-2">
                <GhostBtn t={t} onClick={() => { setAmount(""); setReason(""); }}>Tozalash</GhostBtn>
                <PrimaryBtn t={t} onClick={submit} disabled={busy || invalid}>
                  {busy ? "..." : `${amt > 0 ? "Qo'shish" : "Ayirish"}`}
                </PrimaryBtn>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Barchaga sovg'a yuborish */}
      <Card t={t} className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <FiGift size={15} style={{ color: "#f59e0b" }} />
          <div className="text-sm font-medium text-gray-300">Barchaga sovg'a yuborish</div>
        </div>
        <p className="text-[11px] text-gray-500 mb-4">
          Hamma ro'yxatdan o'tgan (ban qilinmagan) foydalanuvchilarga bir xil coin beradi.
        </p>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Miqdor (🪙)</label>
            <TextInput t={t} value={giftAmount} onChange={setGiftAmount} type="number" placeholder="masalan: 50" accent />
          </div>
          <div>
            <label className="block text-[11px] text-gray-500 mb-1">Xabar (ixtiyoriy)</label>
            <TextInput t={t} value={giftMessage} onChange={setGiftMessage} placeholder="masalan: Barchaga rahmat!" />
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {[10, 50, 100, 500].map((n) => (
            <button
              key={n}
              onClick={() => setGiftAmount(String(n))}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105"
              style={{
                background: giftAmt === n ? "#f59e0b33" : "#22c55e1a",
                color: giftAmt === n ? "#fbbf24" : "#4ade80",
                border: `1px solid ${giftAmt === n ? "#f59e0b66" : "#22c55e44"}`,
              }}
            >
              +{n}
            </button>
          ))}
        </div>

        {giftError && <ErrorBox message={giftError} />}
        {giftOk && (
          <div className="mt-3 px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
            {giftOk}
          </div>
        )}

        <div className="flex justify-end mt-3">
          <PrimaryBtn t={t} onClick={submitGiftAll} disabled={giftBusy || giftInvalid}>
            <FiGift size={12} /> {giftBusy ? "Yuborilmoqda..." : `Hammaga +${giftAmt || 0} 🪙 yuborish`}
          </PrimaryBtn>
        </div>
      </Card>

      {/* Tranzaksiya tarixi */}
      <Card t={t} className="p-5">
        <div className="text-sm font-medium text-gray-300 mb-3">Tranzaksiya tarixi ({transactions?.length ?? "..."})</div>
        {!transactions ? (
          <Spinner t={t} />
        ) : transactions.length === 0 ? (
          <EmptyState t={t} title="Tranzaksiyalar yo'q" desc="Balans o'zgarishlari shu yerda ko'rinadi." />
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2 pr-3">Vaqt</th>
                  <th className="py-2 pr-3">Foydalanuvchi</th>
                  <th className="py-2 pr-3">Turi</th>
                  <th className="py-2 pr-3 text-right">Miqdor</th>
                  <th className="py-2 pr-3 text-right">Balans</th>
                  <th className="py-2 pr-3">Sabab</th>
                  <th className="py-2">Admin</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tr) => (
                  <tr key={tr._id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2 pr-3 text-gray-500 whitespace-nowrap">{fmtDateTime(tr.createdAt)}</td>
                    <td className="py-2 pr-3 text-gray-200 font-medium">{tr.username}</td>
                    <td className="py-2 pr-3">
                      <Badge t={t} color={tr.kind === "coins" ? "#f59e0b" : "#a78bfa"}>
                        {tr.kind === "coins" ? "🪙 Coins" : "⚡ XP"}
                      </Badge>
                    </td>
                    <td className={`py-2 pr-3 text-right font-bold ${tr.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                      {tr.amount >= 0 ? "+" : ""}{tr.amount}
                    </td>
                    <td className="py-2 pr-3 text-right text-gray-400">{tr.balanceAfter}</td>
                    <td className="py-2 pr-3 text-gray-400 max-w-[200px] truncate" title={tr.reason}>{tr.reason}</td>
                    <td className="py-2 text-gray-500">{tr.adminName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
