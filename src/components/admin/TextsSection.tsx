"use client";
import { useState } from "react";
import type { ThemeColors } from "../../types";
import { FiEdit3, FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, SearchInput, PrimaryBtn, GhostBtn, TextInput, TextArea, Field, Select, Toggle, Modal, ConfirmDialog, DifficultyBadge } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listTypingTexts, saveTypingText, deleteTypingText } from "../../lib/db";
import type { TypingTextRow } from "../../lib/db";

export default function TextsSection({ t }: { t: ThemeColors }) {
  const [search, setSearch] = useState("");
  const [lang, setLang] = useState("");
  const [diff, setDiff] = useState("");
  const { data: texts, loading, refetch } = useSupabaseQuery(() => listTypingTexts(lang || undefined, diff || undefined, search || undefined), [lang, diff, search]);
  const [edit, setEdit] = useState<Partial<TypingTextRow> | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiEdit3} title="Matnlar bazasi" subtitle={texts ? `${texts.length} ta` : "..."}
        actions={
          <div className="flex items-center gap-2">
            <SearchInput t={t} value={search} onChange={setSearch} placeholder="Qidirish..." className="w-44" />
            <PrimaryBtn t={t} onClick={() => setEdit({ text: "", lang: "en", difficulty: "medium", category: "general", enabled: true })}>
              <FiPlus size={12} /> Yangi
            </PrimaryBtn>
          </div>
        } />
      <Card t={t} className="p-2">
        {!texts ? <Spinner t={t} /> : texts.length === 0 ? (
          <EmptyState t={t} title="Matn yo'q" action={<PrimaryBtn t={t} onClick={() => setEdit({ text: "", lang: "en", difficulty: "medium", category: "general", enabled: true })}><FiPlus size={12} /> Matn qo'shish</PrimaryBtn>} />
        ) : (
          <div className="space-y-2 p-2">
            {texts.map((tx) => (
              <div key={tx.id} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-white truncate max-w-md">{tx.text.slice(0, 100)}...</div>
                  <div className="flex items-center gap-2 mt-1">
                    <DifficultyBadge t={t} d={tx.difficulty} />
                    <span className="text-[10px] text-gray-500">{tx.lang} · {tx.category}</span>
                    {tx.enabled ? <span className="text-[10px] text-green-400">✓</span> : <span className="text-[10px] text-gray-600">o'chirilgan</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <GhostBtn t={t} onClick={() => setEdit(tx)}>✏️</GhostBtn>
                  <GhostBtn t={t} danger onClick={() => setDelId(tx.id)}>🗑</GhostBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {edit && <TextEditModal t={t} text={edit} onClose={() => { setEdit(null); refetch(); }} />}
      {delId && (
        <ConfirmDialog t={t} danger title="Matnni o'chirish" message="Bu matnni o'chirasizmi?" busy={busy}
          onCancel={() => setDelId(null)}
          onConfirm={async () => { setBusy(true); await deleteTypingText(delId); setDelId(null); setBusy(false); refetch(); }} />
      )}
    </div>
  );
}

function TextEditModal({ t, text, onClose }: { t: ThemeColors; text: Partial<TypingTextRow>; onClose: () => void }) {
  const [form, setForm] = useState({ text: text.text || "", lang: text.lang || "en", difficulty: text.difficulty || "medium", category: text.category || "general", enabled: text.enabled ?? true });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (form.text.trim().length < 10) { setError("Matn juda qisqa"); return; }
    setBusy(true);
    try {
      await saveTypingText({ id: text.id, ...form });
      onClose();
    } catch (e) { setError((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <Modal t={t} title={text.id ? "Matnni tahrirlash" : "Yangi matn"} onClose={onClose}>
      <div className="space-y-3">
        <Field t={t} label="Matn"><TextArea t={t} value={form.text} onChange={(v) => setForm({ ...form, text: v })} rows={4} /></Field>
        <div className="grid grid-cols-3 gap-3">
          <Field t={t} label="Til"><TextInput t={t} value={form.lang} onChange={(v) => setForm({ ...form, lang: v })} placeholder="en" /></Field>
          <Field t={t} label="Qiyinlik">
            <Select t={t} value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v as "easy" | "medium" | "hard" })}
              options={[{ value: "easy", label: "Easy" }, { value: "medium", label: "Medium" }, { value: "hard", label: "Hard" }]} />
          </Field>
          <Field t={t} label="Kategoriya"><TextInput t={t} value={form.category} onChange={(v) => setForm({ ...form, category: v })} placeholder="general" /></Field>
        </div>
        <Toggle t={t} checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Faol" />
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <GhostBtn t={t} onClick={onClose}>Bekor</GhostBtn>
          <PrimaryBtn t={t} onClick={save} disabled={busy}>{busy ? "..." : "Saqlash"}</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
