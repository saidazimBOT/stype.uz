"use client";
import { useState } from "react";
import type { ThemeColors } from "../../types";
import { FiFlag } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, PrimaryBtn, GhostBtn, TextArea, Badge, StatusBadge, timeAgo, fmtDateTime } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listReports, updateReportStatus } from "../../lib/db";

export default function ReportsSection({ t }: { t: ThemeColors }) {
  const [status, setStatus] = useState<string>("");
  const { data: reports, loading, refetch } = useSupabaseQuery(() => listReports(status || undefined), [status]);
  const [busy, setBusy] = useState(false);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiFlag} title="Shikoyatlar" subtitle={reports ? `${reports.length} ta` : "..."}
        actions={
          <div className="flex gap-1.5">
            {["", "pending", "reviewed", "resolved"].map((s) => (
              <button key={s} onClick={() => setStatus(s)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all"
                style={{ background: status === s ? t.accent + "22" : "transparent", color: status === s ? t.accent : "#6b7280", border: `1px solid ${status === s ? t.accent + "44" : "transparent"}` }}>
                {s || "Hammasi"}
              </button>
            ))}
          </div>
        } />
      <Card t={t} className="p-2">
        {!reports ? <Spinner t={t} /> : reports.length === 0 ? (
          <EmptyState t={t} title="Shikoyat yo'q" />
        ) : (
          <div className="space-y-2 p-2">
            {reports.map((r) => (
              <div key={r.id} className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-white font-medium">{r.reporter_name} → {r.target_name}</div>
                  <StatusBadge t={t} status={r.status} />
                </div>
                <div className="text-[11px] text-gray-400 mb-1">{r.reason}</div>
                {r.details && <div className="text-[10px] text-gray-600">{r.details}</div>}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] text-gray-600">{fmtDateTime(r.created_at)}</span>
                  {r.status === "pending" && (
                    <>
                      <GhostBtn t={t} onClick={async () => { setBusy(true); await updateReportStatus(r.id, "reviewed"); refetch(); setBusy(false); }}>
                        Ko'rib chiqildi
                      </GhostBtn>
                      <PrimaryBtn t={t} onClick={async () => { setBusy(true); await updateReportStatus(r.id, "resolved"); refetch(); setBusy(false); }}>
                        Hal qilindi
                      </PrimaryBtn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
