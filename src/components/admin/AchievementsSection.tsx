"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiAward, FiEdit3, FiPlus, FiTrash2, FiUsers } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, Modal, ConfirmDialog,
  TextInput, TextArea, Select, Toggle, PrimaryBtn, GhostBtn, SmallBtn, Badge, AvatarDot, fmtDateTime,
} from "./adminUi";
import { ACHIEVEMENT_ICONS, ACHIEVEMENT_ICON_KEYS, ACHIEVEMENT_COLORS, achievementIcon } from "./achievementIcons";
import type { AchievementItem, ReqType } from "./types";
import { errMsg } from "./useAdminProfile";

const REQ_LABELS: Record<ReqType, string> = {
  wpm: "WPM (eng yaxshi)",
  accuracy: "Aniqlik (%)",
  tests: "Testlar soni",
  races: "Janglar soni",
  coins: "Coins",
  xp: "XP",
};

export default function AchievementsSection({ t }: { t: ThemeColors }) {
  const [editing, setEditing] = useState<AchievementItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<AchievementItem | null>(null);
  const [unlockers, setUnlockers] = useState<AchievementItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const items = useQuery(api.admin.listAchievements) as AchievementItem[] | undefined;
  const del = useMutation(api.admin.deleteAchievement);

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiAward}
        title="Yutuqlar"
        subtitle={items ? `${items.length} ta` : "..."}
        actions={
          <PrimaryBtn t={t} onClick={() => setEditing("new")}>
            <FiPlus size={13} /> Yangi yutuq
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
            icon={FiAward}
            title="Yutuqlar yo'q"
            desc="Yutuq yarating — foydalanuvchilar test topshiriqlarini bajarishda avtomatik ochiladi."
            action={
              <PrimaryBtn t={t} onClick={() => setEditing("new")}>
                <FiPlus size={13} /> Yangi yutuq
              </PrimaryBtn>
            }
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {items.map((a) => {
            const Icon = achievementIcon(a.icon);
            return (
              <Card
                key={a._id}
                t={t}
                className="p-4 transition-all hover:scale-[1.02]"
                style={{ border: `1px solid ${a.enabled ? a.color + "33" : "#ffffff14"}`, opacity: a.enabled ? 1 : 0.55 }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: a.color + "1f", border: `1px solid ${a.color}55`, color: a.color }}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold text-white truncate">{a.title}</div>
                    <div className="text-[11px] text-gray-500 truncate">{a.desc}</div>
                    <div className="text-[10px] text-gray-600 mt-1.5">
                      {REQ_LABELS[a.reqType]} ≥ <span className="font-bold" style={{ color: a.color }}>{a.reqGoal}</span>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {a.xpReward > 0 && <>⚡ {a.xpReward} XP </>}
                      {a.coinReward > 0 && <>🪙 {a.coinReward}</>}
                      {a.xpReward === 0 && a.coinReward === 0 && "Mukofotsiz"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                  <div className="flex items-center gap-1.5">
                    {a.enabled ? <Badge t={t} color="#22c55e">Faol</Badge> : <Badge t={t} color="#6b7280">O'chiq</Badge>}
                    <SmallBtn t={t} color="#38bdf8" onClick={() => setUnlockers(a)}>
                      <FiUsers size={11} /> Ochganlar
                    </SmallBtn>
                  </div>
                  <div className="flex items-center gap-1.5">
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

      {editing && (
        <AchievementFormModal t={t} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          t={t}
          danger
          title="Yutuqni o'chirish"
          message={`"${deleting.title}" yutug'i va uni ochgan foydalanuvchilar ro'yxati o'chiriladi.`}
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

      {unlockers && <UnlockersModal t={t} item={unlockers} onClose={() => setUnlockers(null)} />}
    </div>
  );
}

// ── Yutuq formasi ───────────────────────────────────────────────────────
function AchievementFormModal({
  t,
  item,
  onClose,
}: {
  t: ThemeColors;
  item: AchievementItem | null;
  onClose: () => void;
}) {
  const [key, setKey] = useState(item?.key ?? "");
  const [title, setTitle] = useState(item?.title ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [icon, setIcon] = useState(item?.icon ?? "trophy");
  const [color, setColor] = useState(item?.color ?? ACHIEVEMENT_COLORS[0]);
  const [reqType, setReqType] = useState<ReqType>(item?.reqType ?? "wpm");
  const [reqGoal, setReqGoal] = useState(String(item?.reqGoal ?? 100));
  const [xpReward, setXpReward] = useState(String(item?.xpReward ?? 0));
  const [coinReward, setCoinReward] = useState(String(item?.coinReward ?? 0));
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [order, setOrder] = useState(String(item?.order ?? 0));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = useMutation(api.admin.saveAchievement);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await save({
        id: item?._id,
        key,
        title,
        desc,
        icon,
        color,
        reqType,
        reqGoal: Math.round(Number(reqGoal) || 0),
        xpReward: Math.round(Number(xpReward) || 0),
        coinReward: Math.round(Number(coinReward) || 0),
        enabled,
        order: Math.round(Number(order) || 0),
      });
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const Icon = achievementIcon(icon);

  return (
    <Modal t={t} title={item ? "Yutuqni tahrirlash" : "Yangi yutuq"} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4">
        <span className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: color + "1f", border: `1px solid ${color}55`, color }}>
          <Icon size={22} />
        </span>
        <div className="text-[11px] text-gray-500">
          Belgini va rangni tanlang — foydalanuvchilar profillarida shu ko'rinadi.
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Kalit (unikal)</label>
          <TextInput t={t} value={key} onChange={setKey} placeholder="speed_demon" accent />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Tartib</label>
          <TextInput t={t} value={order} onChange={setOrder} type="number" placeholder="0" />
        </div>
      </div>

      <div className="mt-3">
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Nomi</label>
        <TextInput t={t} value={title} onChange={setTitle} placeholder="Speed Demon" accent />
      </div>

      <div className="mt-3">
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Tavsif</label>
        <TextArea t={t} value={desc} onChange={setDesc} rows={2} placeholder="100 WPM ga erishing" />
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Belgi</label>
          <Select
            t={t}
            value={icon}
            onChange={setIcon}
            options={ACHIEVEMENT_ICON_KEYS.map((k) => ({ value: k, label: k }))}
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Rang</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {ACHIEVEMENT_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-6 h-6 rounded-full transition-all hover:scale-110"
                style={{
                  background: c,
                  border: color === c ? "2px solid #fff" : "2px solid transparent",
                  boxShadow: color === c ? `0 0 8px ${c}` : "none",
                }}
                aria-label={`Rang ${c}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Talab turi</label>
          <Select
            t={t}
            value={reqType}
            onChange={(v) => setReqType(v as ReqType)}
            options={(Object.keys(REQ_LABELS) as ReqType[]).map((r) => ({ value: r, label: REQ_LABELS[r] }))}
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Talab qiymati (≥)</label>
          <TextInput t={t} value={reqGoal} onChange={setReqGoal} type="number" placeholder="100" accent />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">XP mukofoti</label>
          <TextInput t={t} value={xpReward} onChange={setXpReward} type="number" placeholder="0" />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Coins mukofoti</label>
          <TextInput t={t} value={coinReward} onChange={setCoinReward} type="number" placeholder="0" />
        </div>
      </div>

      <div className="mt-3.5">
        <Toggle t={t} checked={enabled} onChange={setEnabled} label="Faol" hint="O'chirilgan yutuq foydalanuvchilarga ochilmaydi" />
      </div>

      {error && (
        <div className="mt-3">
          <ErrorBox message={error} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-3 mt-3 border-t border-white/5">
        <GhostBtn t={t} onClick={onClose}>Bekor qilish</GhostBtn>
        <PrimaryBtn t={t} onClick={submit} disabled={busy || !title.trim()}>
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}

// ── Ochgan foydalanuvchilar ─────────────────────────────────────────────
function UnlockersModal({
  t,
  item,
  onClose,
}: {
  t: ThemeColors;
  item: AchievementItem;
  onClose: () => void;
}) {
  const unlockers = useQuery(api.admin.achievementUnlockers, { id: item._id }) as
    | { username: string; avatar: string; unlockedAt: number }[]
    | undefined;
  const Icon = achievementIcon(item.icon);

  return (
    <Modal t={t} title={`${item.title} — ochganlar`} onClose={onClose}>
      <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: item.color + "0f", border: `1px solid ${item.color}33` }}>
        <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: item.color + "1f", color: item.color }}>
          <Icon size={17} />
        </span>
        <div className="text-[11px] text-gray-400">
          {REQ_LABELS[item.reqType]} ≥ {item.reqGoal}
          {item.xpReward > 0 && <> · ⚡ {item.xpReward} XP</>}
          {item.coinReward > 0 && <> · 🪙 {item.coinReward}</>}
        </div>
      </div>
      {!unlockers ? (
        <Spinner t={t} />
      ) : unlockers.length === 0 ? (
        <EmptyState t={t} title="Hali hech kim ochmagan" desc="Foydalanuvchilar talabni bajarganda avtomatik ochiladi." />
      ) : (
        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {unlockers.map((u, i) => (
            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-xl" style={{ background: "#ffffff06" }}>
              <span className="w-5 text-gray-500 text-xs font-bold text-center">{i + 1}</span>
              <AvatarDot avatar={u.avatar} size={28} />
              <span className="text-xs text-gray-200 flex-1 truncate">{u.username}</span>
              <span className="text-[10px] text-gray-500 whitespace-nowrap">{fmtDateTime(u.unlockedAt)}</span>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
