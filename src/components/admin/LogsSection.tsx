"use client";
import type { ThemeColors } from "../../types";
import { FiShield } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, fmtDateTime } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAdminLogs } from "../../lib/db";

export default function LogsSection({ t }: { t: ThemeColors }) {
  const { data: logs, loading } = useSupabaseQuery(() => listAdminLogs(200), []);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiShield} title="Admin harakatlar jurnali" subtitle={logs ? `${logs.length} ta` : "..."} />
      <Card t={t} className="p-2">
        {!logs ? <Spinner t={t} /> : logs.length === 0 ? (
          <EmptyState t={t} title="Jurnal bo'sh" />
        ) : (
          <div className="space-y-1 p-2">
            {logs.map((l) => (
              <div key={l.id} className="flex items-center gap-3 py-2 border-b border-white/5 text-[11px]">
                <span className="text-gray-600 w-32 flex-shrink-0">{fmtDateTime(l.created_at)}</span>
                <span className="text-blue-400 w-24 flex-shrink-0 font-mono">{l.action}</span>
                <span className="text-white flex-shrink-0">{l.admin_name}</span>
                {l.target && <span className="text-gray-400 truncate">{l.target}</span>}
                {l.details && <span className="text-gray-600 truncate flex-1">{l.details}</span>}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
