"use client";

import { useMemo, useState } from "react";
import type { ThemeColors } from "../../types";
import { FiEdit3, FiEye, FiMonitor, FiSend, FiSmartphone, FiTrash2 } from "react-icons/fi";
import {
  readVisits, clearVisits, readTypingLog, clearTypingLog,
} from "../../hooks/useVisitTracker";
import { Card, SectionHeader, EmptyState, fmtTime } from "./adminUi";

const DEVICE_ICONS: Record<string, typeof FiMonitor> = {
  Mobile: FiSmartphone,
  Tablet: FiSmartphone,
  Desktop: FiMonitor,
};

function referrerHost(url: string): string {
  if (!url) return "—";
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "—";
  }
}

function formatDuration(sec: number): string {
  if (!sec || sec < 0) return "—";
  if (sec < 60) return `${sec} sek`;
  return `${Math.floor(sec / 60)} daq`;
}

interface Props {
  t: ThemeColors;
  refreshKey: number;
  onRefresh: () => void;
}

export default function VisitorsSection({ t, refreshKey, onRefresh }: Props) {
  const [localKey, setLocalKey] = useState(0);

  const data = useMemo(() => {
    // refreshKey va localKey o'zgarishida qayta o'qiymiz
    void refreshKey;
    void localKey;
    const raw = readVisits();
    const rows = raw.map((v) => ({
      id: v.id,
      time: new Date(v.time).toLocaleString("en-GB", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
      device: v.device,
      deviceType: v.deviceType,
      browser: v.browser,
      lang: v.lang.toUpperCase(),
      theme: v.theme,
      screen: v.screen,
      referrer: v.referrer ?? "",
      country: v.country ?? "",
      city: v.city ?? "",
      flag: v.flag ?? "🌍",
      duration: v.duration ?? 0,
    }));
    const typingRaw = readTypingLog();
    const typingRows = typingRaw.map((ty) => ({
      id: ty.id,
      time: new Date(ty.time).toLocaleString("en-GB", {
        day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
      }),
      wpm: ty.wpm,
      accuracy: ty.accuracy,
      errors: ty.errors,
      lang: ty.lang.toUpperCase(),
      browser: ty.browser,
      device: ty.device,
      deviceType: ty.deviceType,
    }));
    return { rows, typingRows };
  }, [refreshKey, localKey]);

  const reRead = () => {
    onRefresh();
    setLocalKey((k) => k + 1);
  };

  return (
    <div className="space-y-4">
      {/* Visitors log */}
      <Card t={t} className="p-5">
        <SectionHeader
          t={t}
          icon={FiEye}
          title="Tashriflar jurnali"
          subtitle={`${data.rows.length}`}
          actions={
            <button
              onClick={() => {
                clearVisits();
                reRead();
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
            >
              <FiTrash2 size={11} /> Tozalash
            </button>
          }
        />
        {data.rows.length === 0 ? (
          <EmptyState t={t} title="Hozircha tashriflar yo'q" desc="Saytga kirganlar shu yerda ko'rinadi." />
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2 pr-3">Vaqt</th>
                  <th className="py-2 pr-3">Qurilma</th>
                  <th className="py-2 pr-3">Brauzer</th>
                  <th className="py-2 pr-3">Manzil</th>
                  <th className="py-2 pr-3">Til</th>
                  <th className="py-2 pr-3">Tema</th>
                  <th className="py-2 pr-3">Ekran</th>
                  <th className="py-2 pr-3">Qayerdan</th>
                  <th className="py-2">Saytda</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.slice(0, 40).map((v, i) => {
                  const Icon = DEVICE_ICONS[v.deviceType] || FiMonitor;
                  return (
                    <tr key={v.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors row-in" style={{ animationDelay: `${Math.min(i, 20) * 35}ms` }}>
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{v.time}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon size={11} style={{ color: t.accent }} />
                          {v.device}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-300">{v.browser}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm leading-none">{v.flag}</span>
                          <span className="text-gray-300">{v.city ? `${v.city}, ` : ""}{v.country || "Noma'lum"}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#ffffff0d", color: "#9ca3af" }}>
                          {v.lang}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-gray-400">{v.theme}</td>
                      <td className="py-2 pr-3 text-gray-600 whitespace-nowrap">{v.screen}</td>
                      <td className="py-2 pr-3 text-gray-500 whitespace-nowrap" title={v.referrer || undefined}>
                        {referrerHost(v.referrer)}
                      </td>
                      <td className="py-2 text-gray-500 whitespace-nowrap">{formatDuration(v.duration)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Typing log */}
      <Card t={t} className="p-5">
        <SectionHeader
          t={t}
          icon={FiEdit3}
          title="Type qilganlar jurnali"
          subtitle={`${data.typingRows.length}`}
          actions={
            <button
              onClick={() => {
                clearTypingLog();
                reRead();
              }}
              className="text-[11px] px-2.5 py-1 rounded-lg text-red-400 hover:bg-red-500/10 transition-all flex items-center gap-1"
            >
              <FiTrash2 size={11} /> Tozalash
            </button>
          }
        />
        {data.typingRows.length === 0 ? (
          <EmptyState t={t} title="Hozircha type qilingan testlar yo'q" desc="Foydalanuvchilar test tugatganda shu yerda ko'rinadi." />
        ) : (
          <div className="overflow-x-auto -mx-2 px-2">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-gray-600 uppercase tracking-widest text-[10px]">
                  <th className="py-2 pr-3">Vaqt</th>
                  <th className="py-2 pr-3">Qurilma</th>
                  <th className="py-2 pr-3">Til</th>
                  <th className="py-2 pr-3">WPM</th>
                  <th className="py-2 pr-3">Aniqlik</th>
                  <th className="py-2">Xatolar</th>
                </tr>
              </thead>
              <tbody>
                {data.typingRows.slice(0, 40).map((ty) => {
                  const Icon = DEVICE_ICONS[ty.deviceType] || FiMonitor;
                  return (
                    <tr key={ty.id} className="border-t border-white/5 hover:bg-white/[0.03] transition-colors">
                      <td className="py-2 pr-3 text-gray-400 whitespace-nowrap">{ty.time}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Icon size={11} style={{ color: t.accent }} />
                          {ty.device} · {ty.browser}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#ffffff0d", color: "#9ca3af" }}>
                          {ty.lang}
                        </span>
                      </td>
                      <td className="py-2 pr-3 font-bold" style={{ color: t.accent }}>{ty.wpm}</td>
                      <td className="py-2 pr-3">
                        <span style={{ color: ty.accuracy >= 95 ? "#22c55e" : ty.accuracy >= 80 ? "#f59e0b" : "#ef4444" }}>
                          {ty.accuracy}%
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">{ty.errors}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Email note (original) */}
      <div className="p-5 rounded-2xl text-sm leading-relaxed" style={{ background: "#ffffff05", border: "1px solid #f59e0b33" }}>
        <div className="flex items-center gap-2 font-medium mb-2" style={{ color: "#f59e0b" }}>
          <FiEye size={15} />
          Foydalanuvchilar emaili haqida
        </div>
        <p className="text-gray-400">
          Saytda ro'yxatdan o'tish tizimi yo'q, shuning uchun tashrif buyuruvchilarning email
          manzillarini yig'ib bo'lmaydi. Hozircha tashriflar soni, qurilma, brauzer va type
          faolligi kuzatilmoqda. <span className="text-gray-300">Real email yig'ish</span> uchun
          Supabase database yoki Simple Analytics xizmatini ulash kerak bo'ladi.
        </p>
        <p className="text-gray-500 mt-3 flex items-center gap-1.5">
          <FiSend size={12} style={{ color: "#5fb8e8" }} />
          Savol yoki admin ruxsati uchun:{" "}
          <a href="https://t.me/said_khujayev" target="_blank" rel="noopener noreferrer" className="font-medium hover:underline" style={{ color: "#5fb8e8" }}>
            @said_khujayev
          </a>
        </p>
      </div>
    </div>
  );
}

