"use client";

import { useMemo, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiEdit3, FiPlus, FiTrash2 } from "react-icons/fi";
import { TEXTS, LANG_LABELS, LANG_FLAGS } from "../../data/texts";
import { RACE_TEXTS } from "../../../convex/raceTexts";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, SearchInput, Modal, ConfirmDialog,
  TextInput, TextArea, Select, Toggle, PrimaryBtn, GhostBtn, SmallBtn, DifficultyBadge, Badge,
} from "./adminUi";
import type { TextItem, Difficulty } from "./types";
import { errMsg } from "./useAdminProfile";

const LANGS = Object.keys(LANG_LABELS).sort();

function autoDifficulty(len: number): Difficulty {
  if (len < 90) return "easy";
  if (len < 160) return "medium";
  return "hard";
}

export default function TextsSection({ t }: { t: ThemeColors }) {
  const [lang, setLang] = useState("");
  const [diff, setDiff] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<TextItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<TextItem | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");

  const texts = useQuery(api.admin.listTypingTexts, {
    lang: lang || undefined,
    difficulty: (diff || undefined) as Difficulty | undefined,
    search: search || undefined,
  }) as TextItem[] | undefined;

  const saveText = useMutation(api.admin.saveTypingText);
  const deleteText = useMutation(api.admin.deleteTypingText);
  const importTexts = useMutation(api.admin.importDefaultTexts);

  const importDefaults = async () => {
    setImporting(true);
    setImportMsg("");
    setError("");
    try {
      const items: { text: string; lang: string; difficulty: Difficulty; category: string }[] = [];
      for (const l of Object.keys(TEXTS)) {
        for (const txt of TEXTS[l]) {
          items.push({ text: txt, lang: l, difficulty: autoDifficulty(txt.length), category: "general" });
        }
      }
      for (const txt of RACE_TEXTS) {
        items.push({ text: txt, lang: "en", difficulty: autoDifficulty(txt.length), category: "battle" });
      }
      const res = await importTexts({ items });
      setImportMsg(`${res.added} ta matn import qilindi`);
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setImporting(false);
    }
  };

  const langCount = useMemo(() => {
    if (!texts) return 0;
    return new Set(texts.map((x) => x.lang)).size;
  }, [texts]);

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiEdit3}
        title="Type matnlari"
        subtitle={texts ? `${texts.length} ta · ${langCount} til` : "..."}
        actions={
          <>
            <SmallBtn t={t} color="#22c55e" onClick={importDefaults} disabled={importing}>
              {importing ? "Import..." : "↧ Default matnlarni import"}
            </SmallBtn>
            <PrimaryBtn t={t} onClick={() => setEditing("new")}>
              <FiPlus size={13} /> Yangi matn
            </PrimaryBtn>
          </>
        }
      />

      {importMsg && (
        <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
          ✓ {importMsg}
        </div>
      )}
      <ErrorBox message={error} onRetry={() => setError("")} />

      <div className="flex flex-wrap gap-2">
        <Select
          t={t}
          value={lang}
          onChange={setLang}
          options={[{ value: "", label: "Barcha tillar" }, ...LANGS.map((l) => ({ value: l, label: `${LANG_FLAGS[l] || "🏳️"} ${LANG_LABELS[l]}` }))]}
        />
        <Select
          t={t}
          value={diff}
          onChange={setDiff}
          options={[
            { value: "", label: "Barcha qiyinlik" },
            { value: "easy", label: "Easy" },
            { value: "medium", label: "Medium" },
            { value: "hard", label: "Hard" },
          ]}
        />
        <SearchInput t={t} value={search} onChange={setSearch} placeholder="Matn yoki kategoriya..." className="flex-1 min-w-[160px]" />
      </div>

      <Card t={t} className="p-2">
        {!texts ? (
          <Spinner t={t} />
        ) : texts.length === 0 ? (
          <EmptyState
            t={t}
            icon={FiEdit3}
            title="Matnlar yo'q"
            desc="Yangi matn qo'shing yoki 'Default matnlarni import' tugmasini bosing."
            action={
              <PrimaryBtn t={t} onClick={() => setEditing("new")}>
                <FiPlus size={13} /> Yangi matn
              </PrimaryBtn>
            }
          />
        ) : (
          <div className="space-y-1.5">
            {texts.map((tx) => (
              <div
                key={tx._id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-gray-300 font-mono truncate max-w-full" title={tx.text}>
                    “{tx.text}”
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <Badge t={t} color={t.accent}>{LANG_FLAGS[tx.lang] || "🏳️"} {LANG_LABELS[tx.lang] || tx.lang.toUpperCase()}</Badge>
                    <DifficultyBadge t={t} d={tx.difficulty} />
                    <span className="text-[10px] text-gray-600">{tx.category}</span>
                    <span className="text-[10px] text-gray-700">{tx.text.length} belgi</span>
                    {!tx.enabled && <Badge t={t} color="#6b7280">o'chiq</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <SmallBtn t={t} color={t.accent} onClick={() => setEditing(tx)}>
                    <FiEdit3 size={11} /> Tahrir
                  </SmallBtn>
                  <SmallBtn t={t} color="#f87171" onClick={() => setDeleting(tx)}>
                    <FiTrash2 size={11} />
                  </SmallBtn>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {editing && (
        <TextFormModal t={t} item={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}

      {deleting && (
        <ConfirmDialog
          t={t}
          danger
          title="Matnni o'chirish"
          message={`"${deleting.text.slice(0, 60)}..." matnini o'chirasizmi?`}
          confirmLabel="O'chirish"
          busy={busy}
          onCancel={() => setDeleting(null)}
          onConfirm={() => {
            setBusy(true);
            setError("");
            deleteText({ id: deleting._id })
              .then(() => setDeleting(null))
              .catch((e) => setError(errMsg(e)))
              .finally(() => setBusy(false));
          }}
        />
      )}
    </div>
  );
}

// ── Matn formasi ────────────────────────────────────────────────────────
function TextFormModal({
  t,
  item,
  onClose,
}: {
  t: ThemeColors;
  item: TextItem | null;
  onClose: () => void;
}) {
  const [text, setText] = useState(item?.text ?? "");
  const [lang, setLang] = useState(item?.lang ?? "en");
  const [diff, setDiff] = useState<Difficulty>(item?.difficulty ?? "medium");
  const [category, setCategory] = useState(item?.category ?? "general");
  const [enabled, setEnabled] = useState(item?.enabled ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = useMutation(api.admin.saveTypingText);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await save({
        id: item?._id,
        text,
        lang,
        difficulty: diff,
        category,
        enabled,
      });
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal t={t} title={item ? "Matnni tahrirlash" : "Yangi matn"} onClose={onClose} wide>
      <div className="mb-3.5">
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Matn</label>
        <TextArea t={t} value={text} onChange={setText} rows={5} mono placeholder="Type uchun matn..." />
        <div className="text-[10px] text-gray-600 mt-1">{text.length} belgi · qiyinlik taklifi: {autoDifficulty(text.length)}</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Til</label>
          <Select
            t={t}
            value={lang}
            onChange={setLang}
            options={LANGS.map((l) => ({ value: l, label: `${LANG_FLAGS[l] || "🏳️"} ${LANG_LABELS[l]}` }))}
          />
        </div>
        <div>
          <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Qiyinlik</label>
          <Select
            t={t}
            value={diff}
            onChange={(v) => setDiff(v as Difficulty)}
            options={[
              { value: "easy", label: "Easy" },
              { value: "medium", label: "Medium" },
              { value: "hard", label: "Hard" },
            ]}
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Kategoriya</label>
        <TextInput t={t} value={category} onChange={setCategory} placeholder="general, battle, quotes..." />
      </div>
      <div className="mt-3.5">
        <Toggle t={t} checked={enabled} onChange={setEnabled} label="Faol" hint="O'chirilgan matnlar foydalanuvchilarga ko'rinmaydi" />
      </div>
      {error && (
        <div className="mt-3">
          <ErrorBox message={error} />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-3 mt-2 border-t border-white/5">
        <GhostBtn t={t} onClick={onClose}>Bekor qilish</GhostBtn>
        <PrimaryBtn t={t} onClick={submit} disabled={busy || text.trim().length < 10}>
          {busy ? "Saqlanmoqda..." : "Saqlash"}
        </PrimaryBtn>
      </div>
    </Modal>
  );
}
