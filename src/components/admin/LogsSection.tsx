"use client";

import { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiShield } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, EmptyState, SearchInput, Badge, fmtDateTime,
} from "./adminUi";
import type { LogItem } from "./types";

const ACTION_COLORS: Record<string, string> = {
  ban: "#ef4444",
  unban: "#22c55e",
  delete_user: "#ef4444",
  role_change: "#38bdf8",
  coins_adjust: "#f59e0b",
  xp_adjust: "#a78bfa",
  claim_admin: "#f59e0b",
  settings_update: "#38bdf8",
  text_create: "#22c55e",
  text_edit: "#38bdf8",
  text_delete: "#ef4444",
  text_import: "#22c55e",
  achievement_create: "#22c55e",
  achievement_edit: "#38bdf8",
  achievement_delete: "#ef4444",
  report_update: "#38bdf8",
  announcement_create: "#22c55e",
  announcement_edit: "#38bdf8",
  announcement_delete: "#ef4444",
};

export default function LogsSection({ t }: { t: ThemeColors }) {
  const [search, setSearch] = useState("");
  const logs = useQuery(api.admin.listAdminLogs, { limit: 300 }) as LogItem[] | undefined;

  const filtered = useMemo(() => {
    if (!logs) return undefined;
    const q = search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter(
      (l) =>
        l.adminName.toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        l.target.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiShield}
        title="Xavfsizlik / Admin jurnali"
        subtitle={logs ? `${logs.length} yozuv` : "..."}
        actions={<SearchInput t={t} value={search} onChange={setSearch} placeholder="Admin, amal, foydalanuvchi..." className="w-56" />}
      />

      <div className="text-[11px] text-gray-600 px-1 flex items-center gap-1.5">
        <FiShield size={12} style={{ color: "#22c55e" }} />
        Jurnalda faqat admin amallari saqlanadi — parollar, tokenlar va maxfiy kalitlar HECH QACHON yozilmaydi.
      </div>

      <Card t={t} className="p-2">
        {!filtered ? (
          <Spinner t={t} />
        ) : filtered.length === 0 ? (
          <EmptyState t={t} icon={FiShield} title="Jurnal bo'sh" desc="Admin amallari shu yerda qayd etiladi." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Sana va vaqt</th>
                  <th className="py-2.5 px-3">Admin</th>
                  <th className="py-2.5 px-3">Amal</th>
                  <th className="py-2.5 px-3">Maqsad</th>
                  <th className="py-2.5 px-3">Tafsilot</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 150).map((l) => (
                  <tr key={l._id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{fmtDateTime(l.createdAt)}</td>
                    <td className="py-2.5 px-3">
                      <span className="flex items-center gap-1.5 text-gray-200">
                        <FiShield size={11} style={{ color: t.accent }} />
                        {l.adminName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge t={t} color={ACTION_COLORS[l.action] || "#6b7280"}>{l.action}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-gray-300 max-w-[160px] truncate" title={l.target}>
                      {l.target || "—"}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 max-w-[280px] truncate" title={l.details}>
                      {l.details || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
