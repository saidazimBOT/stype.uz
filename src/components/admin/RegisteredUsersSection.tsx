"use client";
import type { ThemeColors } from "../../types";
import { FiUserPlus } from "react-icons/fi";
import { Card, SectionHeader, Spinner, EmptyState, AvatarDot, RoleBadge, Badge, timeAgo, fmtDateTime } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { listAllProfiles } from "../../lib/db";

export default function RegisteredUsersSection({ t, serverMode }: { t: ThemeColors; serverMode: boolean }) {
  const { data: users, loading } = useSupabaseQuery(() => listAllProfiles(), []);

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiUserPlus} title="Ro'yxatdan o'tganlar" subtitle={users ? `${users.length} ta` : "..."} />
      <Card t={t} className="p-2">
        {!users ? <Spinner t={t} /> : users.length === 0 ? (
          <EmptyState t={t} title="Ro'yxatdan o'tgan foydalanuvchi yo'q" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Ism</th>
                  <th className="py-2.5 px-3">Email</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Ro'yxatdan o'tgan</th>
                  <th className="py-2.5 px-3">Oxirgi faol</th>
                </tr>
              </thead>
              <tbody>
                {users.filter(u => u.first_name || u.username).map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <AvatarDot avatar={u.avatar} size={26} />
                        <span className="text-white">{u.first_name || u.username || "?"} {u.last_name || ""}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-gray-400">{u.email || "-"}</td>
                    <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                    <td className="py-2.5 px-3 text-gray-500">{fmtDateTime(new Date(u.created_at).getTime())}</td>
                    <td className="py-2.5 px-3 text-gray-500">{timeAgo(u.last_seen || 0)}</td>
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
