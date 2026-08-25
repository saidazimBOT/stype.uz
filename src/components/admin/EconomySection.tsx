"use client";
import { useState } from "react";
import type { ThemeColors } from "../../types";
import { FiDollarSign, FiGift, FiPlus } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, ErrorBox, SearchInput, PrimaryBtn, TextInput, Field } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAllProfiles, listTransactions, addCoins, logAdminAction } from "../../lib/db";

export default function EconomySection({ t }: { t: ThemeColors }) {
  const [search, setSearch] = useState("");
  const { data: users, loading: usersLoading, refetch } = useSupabaseQuery(() => listAllProfiles(search || undefined), [search]);
  const { data: txs } = useSupabaseQuery(() => listTransactions(), []);
  const [giftAll, setGiftAll] = useState(false);
  const [amount, setAmount] = useState("100");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const giftAllFn = async () => {
    if (!users || !amount) return;
    setBusy(true);
    let count = 0;
    for (const u of users) {
      if (u.banned) continue;
      try { await addCoins(u.id, Number(amount), "🎁 Barchaga sovg'a", "admin"); count++; } catch {}
    }
    setMsg(`✓ ${count} ta foydalanuvchiga +${amount} coin berildi`);
    setBusy(false);
    refetch();
    setTimeout(() => setMsg(""), 3000);
  };

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiDollarSign} title="Coins & XP boshqaruvi" />
      {msg && <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">{msg}</div>}

      <Card t={t} className="p-5">
        <SectionHeader t={t} icon={FiGift} title="Barchaga coin berish" />
        <div className="flex items-center gap-3 mt-3">
          <TextInput t={t} value={amount} onChange={setAmount} type="number" placeholder="100" className="w-32" accent />
          <PrimaryBtn t={t} onClick={giftAllFn} disabled={busy || !amount}>
            <FiPlus size={12} /> {busy ? "..." : "Barchaga berish"}
          </PrimaryBtn>
        </div>
      </Card>

      <SectionHeader t={t} icon={FiDollarSign} title="So'nggi tranzaksiyalar" subtitle={txs ? `${txs.length} ta` : "..."} />
      <Card t={t} className="p-2">
        {!txs ? <Spinner t={t} /> : txs.length === 0 ? (
          <EmptyState t={t} title="Tranzaksiya yo'q" />
        ) : (
          <div className="space-y-1 p-2">
            {txs.slice(0, 50).map((tx) => (
              <div key={tx.id} className="flex items-center gap-2 text-[11px] py-1.5 border-b border-white/5">
                <span className={`font-bold w-20 ${tx.amount >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {tx.amount >= 0 ? "+" : ""}{tx.amount} {tx.kind === "coins" ? "🪙" : "⚡"}
                </span>
                <span className="text-gray-400 truncate flex-1">{tx.username} — {tx.reason}</span>
                <span className="text-gray-600 whitespace-nowrap">{tx.admin_name ? `by ${tx.admin_name}` : ""}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
