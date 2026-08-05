"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiBell, FiEdit3, FiPlus, FiTrash2 } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, Modal, ConfirmDialog, StatusBadge,
  TextInput, TextArea, Toggle, PrimaryBtn, GhostBtn, SmallBtn, fmtDateTime,
} from "./adminUi";
import type { AnnouncementItem } from "./types";
import { errMsg } from "./useAdminProfile";

function announcementState(a: AnnouncementItem): "active" | "disabled" | "scheduled" | "expired" {
  if (!a.enabled) return "disabled";
  const now = Date.now();
  if (a.scheduledFor && a.scheduledFor > now) return "scheduled";
  if (a.expiresAt && a.expiresAt <= now) return "expired";
  return "active";
}

export default function AnnouncementsSection({ t }: { t: ThemeColors }) {
  const [editing, setEditing] = useState<AnnouncementItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<AnnouncementItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const items = useQuery(api.admin.listAnnouncements) as AnnouncementItem[] | undefined;
  const del = useMutation(api.admin.deleteAnnouncement);

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiBell}
        title="E'lonlar"
        subtitle={items ? `${items.length} ta` : "..."}
        actions={
          <PrimaryBtn t={t} onClick={() => setEditing("new")}>
            <FiPlus size={13} /> Yangi e'lon
          </PrimaryBtn>
        }
      />
      <ErrorBox message={error} onRetry={() => setError("")} />

      {!items ? (
        <Card t={t}>
          <Spinner t={t} />
        </Card>
      ) : items.length === 0 ? (
        <Card t={t}>
          <EmptyState
            t={t}
            icon={FiBell}
            title="E'lonlar yo'q"
            desc="E'lon yarating — u saytning yuqori qismida barcha foydalanuvchilarga ko'rinadi."
            action={
              <PrimaryBtn t={t} onClick={() => setEditing("new")}>
                <FiPlus size={13} /> Yangi e'lon
              </PrimaryBtn>
            }
          />
        </Card>
      ) : (
        <div className="space-y-2.5">
          {items.map((a) => {
            const st = announcementState(a);
            return (
              <Card key={a._id} t={t} className="p-4" style={{ opacity: st === "disabled" || st === "expired" ? 0.65 : 1 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-white">{a.title}</span>
                      <StatusBadge t={t} status={st} />
                    </div>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">{a.body}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-600 flex-wrap">
                      <span>Muallif: {a.createdByName}</span>
                      <span>Yaratilgan: {fmtDateTime(a.createdAt)}</span>
                      {a.scheduledFor && <span>Boshlanishi: {fmtDateTime(a.scheduledFor)}</span>}
                      {a.expiresAt && <span>Tugashi: {fmtDateTime(a.expiresAt)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <SmallBtn t={t} color={t.accent} onClick={() => setEditing(a)}>
                      <FiEdit3 size={11} />
                    </SmallBtn>
                    <SmallBtn t={t} color="#f87171" onClick={() => setDeleting(a)}>
                      <FiTrash2 size={11} />
                    </SmallBtn>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {editing && <AnnouncementFormModal t={t} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}

      {deleting && (
        <ConfirmDialog
          t={t}
          danger
          title="E'lonni o'chirish"
          message={`"${deleting.title}" e'loni o'chiriladi va foydalanuvchilarga ko'rinmay qoladi.`}
          confirmLabel="O'chirish"
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setBusy(true);
            setError("");
            del({ id: deleting._id })
              .then(() => setDeleting(null))
              .catch((e) => setError(errMsg(e)))
              .finally(() => setBusy(false));
          }}
        />
      )}
    </div>
  );
}

// ── E'lon formasi ───────────────────────────────────────────────────────
function AnnouncementFormModal({
  t,
  item,
  onClose,
}: {
  t: ThemeColors;
  item: AnnouncementItem | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(item?.title ?? "");
  const [body, setBody] = useState(item?.body ?? "");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [scheduledFor, setScheduledFor] = useState(item?.scheduledFor ? toLocalInput(item.scheduledFor) : "");
  const [expiresAt, setExpiresAt] = useState(item?.expiresAt ? toLocalInput(item.expiresAt) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = useMutation(api.admin.saveAnnouncement);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await save({
        id: item?._id,
        title,
        body,
        enabled,
        scheduledFor: scheduledFor ? new Date(scheduledFor).getTime() : undefined,
        expiresAt: expiresAt ? new Date(expiresAt).getTime() : undefined,
      });
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal t={t} title={item ? "E'lonni tahrirlash" : "Yangi e'lon"} onClose={onClose}>
      <div>
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Sarlavha</label>
        <TextInput t={t} value={title} onChange={setTitle} placeholder="Yangi yangilik!" accent />
      </div>
      <div className="mt-3">
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Matn</label>
        <TextArea t={t} value={body} onChange={setBody} rows={4} placeholder="E'lon matni..." />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
            Boshlanishi (ixtiyoriy)
          </label>
          <input
            type="datetime-local"
            value={scheduledFor}
            onChange={(e) => setScheduledFor(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#ffffff08", border: "1px solid #ffffff14", color: "#fff", colorScheme: "dark" }}
          />
          <div className="text-[10px] text-gray-600 mt-1">Rejalashtirilgan e'lon faqat shu vaqtdan keyin ko'rinadi</div>
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Tugashi (ixtiyoriy)</label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "#ffffff08", border: "1px solid #ffffff14", color: "#fff", colorScheme: "dark" }}
          />
          <div className="text-[10px] text-gray-600 mt-1">Shu vaqtdan keyin avtomatik yashirinadi</div>
        </div>
      </div>

      <div className="mt-3.5">
        <Toggle t={t} checked={enabled} onChange={setEnabled} label="Faol" hint="O'chirilgan e'lon hech kimga ko'rinmaydi" />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorBox message={error} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-white/5">
        <GhostBtn t={t} onClick={onClose}>Bekor qilish</GhostBtn>
        <PrimaryBtn t={t} onClick={submit} disabled={busy || !title.trim() || !body.trim()}>
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

function toLocalInput(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
