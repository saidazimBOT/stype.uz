"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiFlag, FiEye } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, EmptyState, ErrorBox, Modal, StatusBadge, Badge,
  PrimaryBtn, GhostBtn, SmallBtn, TextArea, fmtDateTime,
} from "./adminUi";
import type { ReportItem, ReportStatus } from "./types";
import { errMsg } from "./useAdminProfile";

const TABS: { key: ReportStatus | "all"; label: string; color: string }[] = [
  { key: "all", label: "Barchasi", color: "#9ca3af" },
  { key: "pending", label: "Pending", color: "#f59e0b" },
  { key: "reviewed", label: "Reviewed", color: "#38bdf8" },
  { key: "resolved", label: "Resolved", color: "#22c55e" },
];

const REASONS: Record<string, string> = {
  cheating: "Aldash (cheat)",
  abuse: "Haqorat / yomon so'z",
  spam: "Spam",
  impersonation: "Boshqa odam nomidan yurish",
  other: "Boshqa",
};

export default function ReportsSection({ t }: { t: ThemeColors }) {
  const [status, setStatus] = useState<ReportStatus | "all">("pending");
  const [viewing, setViewing] = useState<ReportItem | null>(null);
  const [error, setError] = useState("");

  const reports = useQuery(api.admin.listReports, { status: status === "all" ? undefined : status }) as ReportItem[] | undefined;
  const pendingCount = useQuery(api.admin.listReports, { status: "pending" }) as ReportItem[] | undefined;

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiFlag}
        title="Foydalanuvchi hisobotlari"
        subtitle={pendingCount ? `${pendingCount.length} kutilmoqda` : "..."}
      />
      <ErrorBox message={error} onRetry={() => setError("")} />

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((tb) => (
          <button
            key={tb.key}
            onClick={() => setStatus(tb.key)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{
              background: status === tb.key ? tb.color + "22" : "#ffffff0a",
              color: status === tb.key ? tb.color : "#6b7280",
              border: `1px solid ${status === tb.key ? tb.color + "55" : "#ffffff14"}`,
            }}
          >
            {tb.label}
          </button>
        ))}
      </div>

      <Card t={t} className="p-2">
        {!reports ? (
          <Spinner t={t} />
        ) : reports.length === 0 ? (
          <EmptyState t={t} icon={FiFlag} title="Hisobotlar yo'q" desc="Bu bo'limda hisobotlar ko'rinadi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Kimdan</th>
                  <th className="py-2.5 px-3">Kimga</th>
                  <th className="py-2.5 px-3">Sabab</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Sana</th>
                  <th className="py-2.5 px-3 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r._id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 text-gray-200">{r.reporterName}</td>
                    <td className="py-2.5 px-3 font-medium" style={{ color: t.accent }}>{r.targetName}</td>
                    <td className="py-2.5 px-3 text-gray-400 max-w-[160px] truncate" title={r.reason}>
                      {REASONS[r.reason] || r.reason}
                    </td>
                    <td className="py-2.5 px-3"><StatusBadge t={t} status={r.status} /></td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex justify-end">
                        <SmallBtn t={t} color={t.accent} onClick={() => setViewing(r)}>
                          <FiEye size={11} /> Ko'rish
                        </SmallBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {viewing && <ReportModal t={t} item={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

// ── Hisobot tafsiloti + status boshqaruvi ──────────────────────────────
function ReportModal({
  t,
  item,
  onClose,
}: {
  t: ThemeColors;
  item: ReportItem;
  onClose: () => void;
}) {
  const [note, setNote] = useState(item.adminNote);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const update = useMutation(api.admin.updateReportStatus);

  const setStatus = async (status: ReportStatus) => {
    setBusy(true);
    setError("");
    try {
      await update({ id: item._id, status, note: note || undefined });
      onClose();
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal t={t} title="Hisobot tafsiloti" onClose={onClose}>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
            <div className="text-[10px] text-gray-500 mb-0.5">Kimdan</div>
            <div className="text-sm text-white">{item.reporterName}</div>
          </div>
          <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
            <div className="text-[10px] text-gray-500 mb-0.5">Kimga</div>
            <div className="text-sm font-bold" style={{ color: t.accent }}>{item.targetName}</div>
          </div>
        </div>

        <div className="p-3 rounded-xl" style={{ background: "#ffffff06" }}>
          <div className="text-[10px] text-gray-500 mb-1">Sabab</div>
          <div className="text-sm text-white">{REASONS[item.reason] || item.reason}</div>
          {item.details && (
            <div className="text-[11px] text-gray-400 mt-2 leading-relaxed">{item.details}</div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">Yuborilgan:</span>
          <span className="text-[11px] text-gray-400">{fmtDateTime(item.createdAt)}</span>
          <StatusBadge t={t} status={item.status} />
        </div>

        <div>
          <label className="block text-[11px] text-gray-500 mb-1.5">Admin izohi</label>
          <TextArea t={t} value={note} onChange={setNote} rows={2} placeholder="Izoh (foydalanuvchiga ko'rinmaydi)..." />
        </div>

        {error && <ErrorBox message={error} />}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/5">
          <div className="flex gap-1.5 flex-wrap">
            <SmallBtn t={t} color="#38bdf8" onClick={() => setStatus("reviewed")} disabled={busy || item.status === "reviewed"}>
              Reviewed
            </SmallBtn>
            <SmallBtn t={t} color="#22c55e" onClick={() => setStatus("resolved")} disabled={busy || item.status === "resolved"}>
              Resolved
            </SmallBtn>
            <SmallBtn t={t} color="#f59e0b" onClick={() => setStatus("pending")} disabled={busy || item.status === "pending"}>
              Pending
            </SmallBtn>
          </div>
          <GhostBtn t={t} onClick={onClose}>Yopish</GhostBtn>
        </div>
      </div>
    </Modal>
  );
}
