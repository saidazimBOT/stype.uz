"use client";
import { useState } from "react";
import type { ThemeColors } from "../../types";
import { FiBell, FiPlus, FiTrash2 } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, PrimaryBtn, GhostBtn, TextInput, TextArea, Field, Toggle, Modal, ConfirmDialog, timeAgo } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAnnouncements, saveAnnouncement, deleteAnnouncement } from "../../lib/db";
import type { AnnouncementRow } from "../../lib/db";

export default function AnnouncementsSection({ t }: { t: ThemeColors }) {
  const { data: items, loading, refetch } = useSupabaseQuery(() => listAnnouncements(), []);
  const [edit, setEdit] = useState<Partial<AnnouncementRow> | null>(null);
  const [delId, setDelId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiBell} title="E'lonlar" subtitle={items ? `${items.length} ta` : "..."}
        actions={<PrimaryBtn t={t} onClick={() => setEdit({ title: "", body: "", enabled: true })}>
          <FiPlus size={12} /> Yangi
        </PrimaryBtn>} />
      <Card t={t} className="p-2">
        {!items ? <Spinner t={t} /> : items.length === 0 ? (
          <EmptyState t={t} title="E'lon yo'q" />
        ) : (
          <div className="space-y-2 p-2">
            {items.map((a) => (
              <div key={a.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs font-bold text-white">{a.title}</div>
                  {a.enabled ? <Badge t={t} color="#22c55e">Faol</Badge> : <Badge t={t} color="#6b7280">O'chirilgan</Badge>}
                </div>
                <div className="text-[11px] text-gray-400 mb-1">{a.body.slice(0, 120)}...</div>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-600">{timeAgo(a.created_at)}</span>
                  <GhostBtn t={t} onClick={() => setEdit(a)}>✏️</GhostBtn>
                  <GhostBtn t={t} danger onClick={() => setDelId(a.id)}>🗑</GhostBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      {edit && <AnnouncementEditModal t={t} item={edit} onClose={() => { setEdit(null); refetch(); }} />}
      {delId && (
        <ConfirmDialog t={t} danger title="E'lonni o'chirish" message="Bu e'lonni o'chirasizmi?" busy={busy}
          onCancel={() => setDelId(null)}
          onConfirm={async () => { setBusy(true); await deleteAnnouncement(delId); setDelId(null); setBusy(false); refetch(); }} />
      )}
    </div>
  );
}

function AnnouncementEditModal({ t, item, onClose }: { t: ThemeColors; item: Partial<AnnouncementRow>; onClose: () => void }) {
  const [form, setForm] = useState({ title: item.title || "", body: item.body || "", enabled: item.enabled ?? true });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try { await saveAnnouncement({ id: item.id, ...form }); onClose(); }
    catch (e) { alert((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <Modal t={t} title={item.id ? "E'lonni tahrirlash" : "Yangi e'lon"} onClose={onClose}>
      <div className="space-y-3">
        <Field t={t} label="Sarlavha"><TextInput t={t} value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></Field>
        <Field t={t} label="Matn"><TextArea t={t} value={form.body} onChange={(v) => setForm({ ...form, body: v })} rows={3} /></Field>
        <Toggle t={t} checked={form.enabled} onChange={(v) => setForm({ ...form, enabled: v })} label="Faol" />
        <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
          <GhostBtn t={t} onClick={onClose}>Bekor</GhostBtn>
          <PrimaryBtn t={t} onClick={save} disabled={busy}>{busy ? "..." : "Saqlash"}</PrimaryBtn>
        </div>
      </div>
    </Modal>
  );
}
