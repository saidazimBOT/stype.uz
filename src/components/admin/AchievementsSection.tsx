"use client";
import { useState } from "react";
import type { ThemeColors } from "../../types";
import { FiAward, FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, PrimaryBtn, GhostBtn, TextInput, TextArea, Field, Select, Toggle, Modal, ConfirmDialog } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAchievements, saveAchievement, deleteAchievement, getUserAchievements } from "../../lib/db";
import type { AchievementRow } from "../../lib/db";

export default function AchievementsSection({ t }: { t: ThemeColors }) {
  const { data: items, loading, refetch } = useSupabaseQuery(() => listAchievements(), []);
  const [edit, setEdit] = useState<Partial<AchievementRow> | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiAward} title="Yutuqlar" subtitle={items ? `${items.length} ta` : "..."}
        actions={<PrimaryBtn t={t} onClick={() => setEdit({ key: "", title: "", description: "", icon: "🏆", color: "#fbbf24", req_type: "wpm", req_goal: 50, xp_reward: 10, coin_reward: 5, enabled: true, sort_order: 0 })}>
          <FiPlus size={12} /> Yangi
        </PrimaryBtn>} />
      <Card t={t} className="p-2">
        {!items ? <Spinner t={t} /> : items.length === 0 ? (
          <EmptyState t={t} title="Yutuq yo'q" />
        ) : (
          <div className="space-y-2 p-2">
            {items.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: a.color + "1f", color: a.color }}>
                  <span className="text-lg">{a.icon}</span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-white">{a.title}</div>
                  <div className="text-[10px] text-gray-500">{a.req_type} ≥ {a.req_goal} · +{a.xp_reward}xp +{a.coin_reward}🪙</div>
                </div>
                <div className="flex gap-1">
                  <GhostBtn t={t} onClick={() => setEdit(a)}>✏️</GhostBtn>
                  <GhostBtn t={t} danger onClick={() => setDelId(a.id)}>🗑</GhostBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {edit && <AchievementEditModal t={t} item={edit} onClose={() => { setEdit(null); refetch(); }} />}
      {delId && (
        <ConfirmDialog t={t} danger title="Yutuqni o'chirish" message="Bu yutuqni o'chirasizmi?" busy={busy}
          onCancel={() => setDelId(null)}
          onConfirm={async () => { setBusy(true); await deleteAchievement(delId); setDelId(null); setBusy(false); refetch(); }} />
      )}
    </div>
  );
}

function AchievementEditModal({ t, item, onClose }: { t: ThemeColors; item: Partial<AchievementRow>; onClose: () => void }) {
  const [form, setForm] = useState({
    key: item.key || "", title: item.title || "", description: item.description || "", icon: item.icon || "🏆",
    color: item.color || "#fbbf24", req_type: item.req_type || "wpm", req_goal: item.req_goal || 50,
    xp_reward: item.xp_reward || 0, coin_reward: item.coin_reward || 0, enabled: item.enabled ?? true, sort_order: item.sort_order || 0,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await saveAchievement({ id: item.id, ...form }); onClose(); }
    catch (e) { alert((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <Modal t={t} title={item.id ? "Yutuqni tahrirlash" : "Yangi yutuq"} onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field t={t} label="Kalit"><TextInput t={t} value={form.key} onChange={(v) => setForm({ ...form, key: v })} placeholder="first_test" /></Field>
          <Field t={t} label="Nomi"><TextInput t={t} value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></Field>
        </div>
        <Field t={t} label="Tavsif"><TextInput t={t} value={form.description} onChange={(v) => setForm({ ...form, description: v })} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field t={t} label="Ikonka"><TextInput t={t} value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} placeholder="🏆" /></Field>
          <Field t={t} label="Rang"><TextInput t={t} value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="#fbbf24" /></Field>
          <Field t={t} label="Talab">
            <Select t={t} value={form.req_type} onChange={(v) => setForm({ ...form, req_type: v as AchievementRow["req_type"] })}
              options={[{ value: "wpm", label: "WPM" }, { value: "accuracy", label: "Aniqlik" }, { value: "tests", label: "Testlar" }, { value: "races", label: "Janglar" }, { value: "coins", label: "Tangalar" }, { value: "xp", label: "XP" }]} />
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <Field t={t} label="Maqsad"><TextInput t={t} value={String(form.req_goal)} onChange={(v) => setForm({ ...form, req_goal: Number(v) || 0 })} type="number" /></Field>
          <Field t={t} label="XP mukofot"><TextInput t={t} value={String(form.xp_reward)} onChange={(v) => setForm({ ...form, xp_reward: Number(v) || 0 })} type="number" /></Field>
          <Field t={t} label="Coin mukofot"><TextInput t={t} value={String(form.coin_reward)} onChange={(v) => setForm({ ...form, coin_reward: Number(v) || 0 })} type="number" /></Field>
        </div>
        <Toggle t={t} checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Faol" />
        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <GhostBtn t={t} onClick={onClose}>Bekor</GhostBtn>
          <PrimaryBtn t={t} onClick={save} disabled={busy}>{busy ? "..." : "Saqlash"}</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
