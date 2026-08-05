"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { ThemeColors } from "../../types";
import { FiSettings, FiSave } from "react-icons/fi";
import {
  Card, SectionHeader, Spinner, ErrorBox, TextInput, TextArea, Toggle, PrimaryBtn, fmtDateTime,
} from "./adminUi";
import type { AdminSettings } from "./types";
import { errMsg } from "./useAdminProfile";

export default function SettingsSection({ t }: { t: ThemeColors }) {
  const settings = useQuery(api.admin.getSettings) as AdminSettings | null | undefined;
  const update = useMutation(api.admin.updateSettings);

  const [siteName, setSiteName] = useState("");
  const [logo, setLogo] = useState("");
  const [maintenance, setMaintenance] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [registration, setRegistration] = useState(true);
  const [announcements, setAnnouncements] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  // Sozlamalar kelganda formani to'ldiramiz
  useEffect(() => {
    if (!settings) return;
    setSiteName(settings.siteName);
    setLogo(settings.logo);
    setMaintenance(settings.maintenanceMode);
    setMaintenanceMsg(settings.maintenanceMessage);
    setRegistration(settings.registrationOpen);
    setAnnouncements(settings.announcementsEnabled);
  }, [settings]);

  const save = async () => {
    setBusy(true);
    setError("");
    setOkMsg("");
    try {
      await update({
        siteName,
        logo,
        maintenanceMode: maintenance,
        maintenanceMessage: maintenanceMsg,
        registrationOpen: registration,
        announcementsEnabled: announcements,
      });
      setOkMsg("Sozlamalar saqlandi ✓");
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (!settings) {
    return (
      <Card t={t}>
        <Spinner t={t} />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiSettings} title="Sayt sozlamalari" />
      {okMsg && (
        <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30 animate-pop-in">
          {okMsg}
        </div>
      )}
      <ErrorBox message={error} onRetry={() => setError("")} />

      <div className="grid lg:grid-cols-2 gap-4 items-start">
        <Card t={t} className="p-5">
          <div className="text-sm font-medium text-gray-300 mb-4">Umumiy</div>
          <div>
            <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Sayt nomi</label>
            <TextInput t={t} value={siteName} onChange={setSiteName} placeholder="STypeUz" accent />
          </div>
          <div className="mt-3">
            <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">Logo manzili (URL)</label>
            <TextInput t={t} value={logo} onChange={setLogo} placeholder="https://.../logo.png" />
            <div className="text-[10px] text-gray-600 mt-1">Bo'sh qoldirilsa standart logo ishlatiladi</div>
          </div>
          <div className="mt-4 space-y-2.5">
            <Toggle
              t={t}
              checked={registration}
              onChange={setRegistration}
              label="Ro'yxatdan o'tish"
              hint="Yopiq bo'lsa yangi hisoblar yaratilmaydi (hozircha anonymous auth ishlaydi)"
            />
            <Toggle
              t={t}
              checked={announcements}
              onChange={setAnnouncements}
              label="E'lonlar"
              hint="O'chirilgan bo'lsa barcha e'lonlar foydalanuvchilarga ko'rinmaydi"
            />
          </div>
        </Card>

        <Card t={t} className="p-5">
          <div className="text-sm font-medium text-gray-300 mb-4">Texnik xizmat (maintenance)</div>
          <div className="mb-3">
            <Toggle
              t={t}
              checked={maintenance}
              onChange={setMaintenance}
              label="Texnik xizmat rejimi"
              hint="Yoqilganda sayt oddiy foydalanuvchilarga yopiladi, faqat adminlar ko'radi"
            />
          </div>
          {maintenance && (
            <div>
              <label className="block text-[11px] text-gray-500 uppercase tracking-widest mb-1.5">
                Xabar (foydalanuvchilarga ko'rinadi)
              </label>
              <TextArea
                t={t}
                value={maintenanceMsg}
                onChange={setMaintenanceMsg}
                rows={3}
                placeholder="Saytda texnik ishlar olib borilmoqda. Tez orada qaytamiz!"
              />
            </div>
          )}
          <div className="mt-4 p-3 rounded-xl text-[11px] text-gray-500 leading-relaxed" style={{ background: "#ffffff06" }}>
            <FiSettings size={12} className="inline mr-1" style={{ color: t.accent }} />
            Sozlamalar Convex bazasida saqlanadi va saytning barcha foydalanuvchilariga bir xil qo'llaniladi.
            {settings.updatedAt > 0 && (
              <div className="mt-1 text-gray-600">
                Oxirgi yangilanish: {fmtDateTime(settings.updatedAt)} — {settings.updatedByName}
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="flex justify-end">
        <PrimaryBtn t={t} onClick={save} disabled={busy}>
          <FiSave size={13} /> {busy ? "Saqlanmoqda..." : "Saqlash"}
        </PrimaryBtn>
      </div>
    </div>
  );
}
