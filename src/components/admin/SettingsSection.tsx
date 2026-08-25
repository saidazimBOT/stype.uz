"use client";
import { useState, useEffect } from "react";
import type { ThemeColors } from "../../types";
import { FiSettings } from "react-icons/fi";
import { Card, SectionHeader, PrimaryBtn, TextInput, Field, Toggle, Spinner } from "./adminUi";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { getSettings, updateSettings } from "../../lib/db";

export default function SettingsSection({ t }: { t: ThemeColors }) {
  const { data: settings, loading, refetch } = useSupabaseQuery(() => getSettings(), []);
  const [form, setForm] = useState({ siteName: "STypeUz", logo: "", maintenanceMode: false, maintenanceMessage: "", registrationOpen: true, announcementsEnabled: true });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.site_name, logo: settings.logo,
        maintenanceMode: settings.maintenance_mode, maintenanceMessage: settings.maintenance_message,
        registrationOpen: settings.registration_open, announcementsEnabled: settings.announcements_enabled,
      });
    }
  }, [settings]);

  const save = async () => {
    setBusy(true);
    try { await updateSettings(form); setMsg("✓ Saqlandi"); setTimeout(() => setMsg(""), 2000); }
    catch (e) { alert((e as Error)?.message || "Xatolik"); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-4">
      <SectionHeader t={t} icon={FiSettings} title="Sayt sozlamalari" />
      {loading ? <Card t={t}><Spinner t={t} /></Card> : (
        <Card t={t} className="p-5 space-y-3">
          <Field t={t} label="Sayt nomi"><TextInput t={t} value={form.siteName} onChange={(v) => setForm({ ...form, siteName: v })} /></Field>
          <Field t={t} label="Logo URL"><TextInput t={t} value={form.logo} onChange={(v) => setForm({ ...form, logo: v })} /></Field>
          <Toggle t={t} checked={form.maintenanceMode} onChange={(v) => setForm({ ...form, maintenanceMode: v })} label="Texnik xizmat rejimi" hint="Faqat adminlar kirishi mumkin" />
          {form.maintenanceMode && <Field t={t} label="Texnik xizmat xabari"><TextInput t={t} value={form.maintenanceMessage} onChange={(v) => setForm({ ...form, maintenanceMessage: v })} placeholder="Sayt vaqtincha ishlamayapti..." /></Field>}
          <Toggle t={t} checked={form.registrationOpen} onChange={(v) => setForm({ ...form, registrationOpen: v })} label="Ro'yxatdan o'tish ochiq" />
          <Toggle t={t} checked={form.announcementsEnabled} onChange={(v) => setForm({ ...form, announcementsEnabled: v })} label="E'lonlar yoqilgan" />
          {msg && <div className="px-3 py-2 rounded-xl text-xs text-green-400 bg-green-500/10 border border-green-500/30">{msg}</div>}
          <div className="flex justify-end pt-2 border-t border-white/5">
            <PrimaryBtn t={t} onClick={save} disabled={busy}>{busy ? "..." : "Saqlash"}</PrimaryBtn>
          </div>
        </Card>
      )}
    </div>
  );
}
