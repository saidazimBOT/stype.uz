"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import {
  FiClipboard, FiDatabase, FiInfo, FiUserPlus, FiUsers,
} from "react-icons/fi";
import {
  AvatarDot, Card, EmptyState, RoleBadge, SearchInput, SectionHeader, Spinner,
  fmtDateTime, timeAgo,
} from "./adminUi";
import { isSupabaseConfigured } from "../../lib/supabase";
import SupabaseUsersSection from "./SupabaseUsersSection";
import type { RegisteredUser } from "./types";

const DAY = 24 * 60 * 60 * 1000;

function displayName(u: RegisteredUser): string {
  return [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || u.username || "(nomsiz)";
}

// ── Bosh komponent: qaysi backend ishlayapti? ───────────────────────────
// Convex yoqilgan bo'lsa — Convex ro'yxati. Aks holda Supabase sozlangan
// bo'lsa — Supabase real foydalanuvchilari. Hech biri yo'q bo'lsa — yo'l-yo'riq.
export default function RegisteredUsersSection({
  t,
  serverMode,
}: {
  t: ThemeColors;
  serverMode: boolean;
}) {
  if (serverMode) return <RegisteredList t={t} />;
  if (isSupabaseConfigured()) return <SupabaseUsersSection t={t} />;
  return <SetupGuide t={t} />;
}

// ── REAL ro'yxat (Convex ulangan) ───────────────────────────────────────
function RegisteredList({ t }: { t: ThemeColors }) {
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(search), 300);
    return () => window.clearTimeout(id);
  }, [search]);

  const users = useQuery(api.admin.listRegisteredUsers, {
    search: debounced || undefined,
    limit: 1000,
  }) as RegisteredUser[] | undefined;

  const total = users?.length ?? 0;
  const now = Date.now();
  const today = users?.filter((u) => u.signedUpAt >= new Date().setHours(0, 0, 0, 0)).length ?? 0;
  const week = users?.filter((u) => u.signedUpAt >= now - 7 * DAY).length ?? 0;

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiUserPlus}
        title="Ro'yxatdan o'tganlar"
        subtitle={users ? `${total} ta` : "..."}
        actions={
          <SearchInput
            t={t}
            value={search}
            onChange={setSearch}
            placeholder="Ism, familiya yoki username..."
            className="w-60"
          />
        }
      />

      {/* Xulosa statistikasi */}
      <div className="grid grid-cols-3 gap-2.5">
        {[
          { label: "Jami ro'yxatdan o'tgan", value: total, color: t.accent },
          { label: "Bugun ro'yxatdan o'tgan", value: today, color: "#22c55e" },
          { label: "So'nggi 7 kun", value: week, color: "#38bdf8" },
        ].map((s) => (
          <div
            key={s.label}
            className="p-3.5 rounded-2xl transition-all hover:scale-[1.02]"
            style={{ background: t.surface, border: `1px solid ${s.color}22` }}
          >
            <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <Card t={t} className="p-2">
        {!users ? (
          <Spinner t={t} label="Ro'yxat yuklanmoqda..." />
        ) : total === 0 ? (
          <EmptyState
            t={t}
            icon={FiUsers}
            title="Hali ro'yxatdan o'tgan yo'q"
            desc="Odamlar saytda ism va familiya bilan sign up qilganda shu yerda ko'rinadi."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2.5 px-3">Foydalanuvchi</th>
                  <th className="py-2.5 px-3">Rol</th>
                  <th className="py-2.5 px-3">Ro'yxatdan o'tgan</th>
                  <th className="py-2.5 px-3">Oxirgi faol</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-t border-white/5 hover:bg-white/[0.03] transition-colors"
                  >
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <AvatarDot avatar={u.avatar} size={30} />
                        <div className="min-w-0">
                          <div className="text-white font-medium truncate max-w-[180px]">
                            {displayName(u)}
                          </div>
                          {u.username && (
                            <div className="text-[10px] text-gray-600">@{u.username}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3"><RoleBadge t={t} role={u.role} /></td>
                    <td className="py-2.5 px-3 text-gray-400 whitespace-nowrap" title={fmtDateTime(u.signedUpAt)}>
                      {timeAgo(u.signedUpAt)}
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap" title={fmtDateTime(u.lastSeen)}>
                      {timeAgo(u.lastSeen)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="flex items-start gap-2 px-1 text-[11px] text-gray-600 leading-relaxed">
        <FiInfo size={12} className="mt-0.5 flex-shrink-0" />
        <span>
          Ro'yxat <strong className="text-gray-400">haqiqiy</strong> — har bir sign up qilgan odamning
          ism-familiyasi sayt bazasida saqlanadi va shu yerda yangilanib turadi.
        </span>
      </div>
    </div>
  );
}

// ── Backend yoqish yo'l-yo'rig'i (statik rejim) ─────────────────────────
function SetupGuide({ t }: { t: ThemeColors }) {
  const steps = [
    {
      title: "Convex backendni deploy qiling",
      desc: "Ro'yxatdan o'tganlar REAL ro'yxati server bazasida saqlanadi. Sayt kodida Convex uchun hammasi tayyor — faqat yoqish kerak. Deploy paytida bepul hisob ochiladi (convex.dev).",
      cmd: "npx convex deploy",
    },
    {
      title: "Convex URL ni .env.local ga yozing",
      desc: "Deploy tugagach Convex sizga URL beradi — shuni `.env.local` faylga NEXT_PUBLIC_CONVEX_URL=... qilib qo'shing.",
      cmd: "NEXT_PUBLIC_CONVEX_URL=https://...convex.cloud",
    },
    {
      title: "Saytni qayta build va deploy qiling",
      desc: "Endi har bir sign up qilgan odamning ism-familiyasi avtomatik shu bo'limda ko'rinadi — jami, bugun va haftalik statistika bilan.",
      cmd: "npm run build",
    },
  ];

  return (
    <div className="space-y-4">
      <SectionHeader
        t={t}
        icon={FiUserPlus}
        title="Ro'yxatdan o'tganlar"
        subtitle="backend kutilmoqda"
      />

      <Card t={t} className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <span
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: t.accent + "22", color: t.accent, border: `1px solid ${t.accent}44` }}
          >
            <FiDatabase size={18} />
          </span>
          <div>
            <div className="text-sm font-bold text-white">Real ro'yxat uchun backend yoqish kerak</div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Sayt hozir statik rejimda — har bir odamning ism-familiyasi faqat uning brauzerida
              saqlanadi va sizga yetib kelmaydi. Kodda backend (Convex) uchun hammasi tayyor,
              quyidagi 2 qadam bilan yoqasiz — shundan keyin ro'yxat <strong className="text-gray-300">haqiqiy</strong> bo'ladi.
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {steps.map((s, i) => (
            <div
              key={i}
              className="p-3.5 rounded-xl transition-all hover:bg-white/[0.02]"
              style={{ background: "#ffffff06", border: "1px solid #ffffff0f" }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{ background: t.accent, color: "#000" }}
                >
                  {i + 1}
                </span>
                <div className="text-xs font-bold text-white">{s.title}</div>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed mb-2.5">{s.desc}</p>
              {s.cmd && <CommandChip t={t} cmd={s.cmd} />}
            </div>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-2 text-[11px] text-gray-600 leading-relaxed">
          <FiClipboard size={12} className="mt-0.5 flex-shrink-0" />
          <span>
            Batafsil: <span className="font-mono text-gray-400">convex.dev</span> da bepul hisob
            oching, yuqoridagi buyruqlarni bajaring va saytni qayta yuklang.
          </span>
        </div>
      </Card>
    </div>
  );
}

// ── Buyruq nusxalash chipi ──────────────────────────────────────────────
function CommandChip({ t, cmd }: { t: ThemeColors; cmd: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(cmd).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  };

  return (
    <button
      onClick={copy}
      className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg font-mono text-[11px] text-left transition-all hover:bg-white/5 group"
      style={{ background: "#0b1626", border: "1px solid #ffffff14", color: "#e5e7eb" }}
      title="Nusxalash"
    >
      <span className="truncate">{cmd}</span>
      <span className="text-gray-500 group-hover:text-gray-300 flex items-center gap-1 text-[10px] whitespace-nowrap">
        {copied ? "✓ Nusxalandi" : "Nusxalash"}
      </span>
    </button>
  );
}
