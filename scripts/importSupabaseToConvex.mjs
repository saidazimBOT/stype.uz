#!/usr/bin/env node
/**
 * Supabase `profiles` jadvalidagi ro'yxatdan o'tgan foydalanuvchilarni
 * Convex `users` jadvaliga ko'chiradi (admin panel "Ro'yxatdan o'tganlar"
 * bo'limida ko'rinishi uchun).
 *
 * Email/parol Convex'ga ko'chmaydi (auth Anonymous tizimi) — faqat profil
 * ma'lumotlari (ism, familiya, username, avatar, coin, rol) import qilinadi.
 *
 * Ishga tushirish:
 *   node scripts/importSupabaseToConvex.mjs \
 *     --supabase-url https://xxxx.supabase.co \
 *     --supabase-key <SERVICE_ROLE_KEY> \
 *     --convex-url https://xxxx.convex.cloud \
 *     --admin-password <ADMIN_PASSWORD> \
 *     [--dry-run] [--replace]
 *
 * XAVFSIZLIK: `--supabase-key` uchun SERVICE_ROLE kaliti kerak (RLS ni
 * aylanib o'tish uchun). Hech qachon bu kalitni git'ga qo'ymang — faqat
 * buyruq qatorida yoki maxsus env orqali bering.
 */
import { ConvexClient } from "convex/browser";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    }
  }
  return args;
}

const args = parseArgs(process.argv);
const SUPABASE_URL = (args["supabase-url"] || "").replace(/\/+$/, "");
const SUPABASE_KEY = args["supabase-key"] || "";
const CONVEX_URL = args["convex-url"] || process.env.NEXT_PUBLIC_CONVEX_URL || "";
const ADMIN_PASSWORD = args["admin-password"] || "";
const DRY_RUN = !!args["dry-run"];
const REPLACE = !!args["replace"];
const CHUNK = 200;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Xato: --supabase-url va --supabase-key (service_role) kerak.");
  process.exit(1);
}
if (!CONVEX_URL) {
  console.error("Xato: --convex-url kerak (masalan https://xxx.convex.cloud).");
  process.exit(1);
}
if (!ADMIN_PASSWORD) {
  console.error("Xato: --admin-password kerak (Convex'dagi ADMIN_PASSWORD qiymati).");
  process.exit(1);
}

function toMs(iso) {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? undefined : t;
}

async function fetchSupabaseProfiles() {
  const url = `${SUPABASE_URL}/rest/v1/profiles?select=id,username,first_name,last_name,email,avatar_id,coins,xp,role,status,created_at,last_login&order=created_at.asc`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase xatosi (${res.status}): ${body.slice(0, 300)}`);
  }
  const rows = await res.json();
  return rows.map((r) => ({
    id: String(r.id),
    username: r.username || undefined,
    firstName: r.first_name || undefined,
    lastName: r.last_name || undefined,
    avatar: r.avatar_id || "avatar_default",
    coins: typeof r.coins === "number" ? r.coins : undefined,
    xp: typeof r.xp === "number" ? r.xp : undefined,
    role: r.role === "admin" || r.role === "owner" ? r.role : r.role === "user" ? "user" : undefined,
    banned: r.status === "blocked" ? true : undefined,
    signedUpAt: toMs(r.created_at),
    lastSeen: toMs(r.last_login),
  }));
}

async function run() {
  console.log(`Supabase'dan profillar o'qilmoqda: ${SUPABASE_URL}`);
  const profiles = await fetchSupabaseProfiles();
  console.log(`Jami: ${profiles.length} ta profil`);

  if (profiles.length === 0) {
    console.log("Import qiladigan hech narsa yo'q.");
    return;
  }
  if (DRY_RUN) {
    console.log("DRY-RUN: hech narsa yozilmadi. Quyidagi birinchi 5 profil ko'rsatilmoqda:");
    console.table(profiles.slice(0, 5));
    return;
  }

  const client = new ConvexClient(CONVEX_URL);
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  try {
    for (let i = 0; i < profiles.length; i += CHUNK) {
      const chunk = profiles.slice(i, i + CHUNK);
      const res = await client.mutation("admin:importProfiles", {
        profiles: chunk,
        replace: REPLACE,
        adminPassword: ADMIN_PASSWORD,
      });
      inserted += res.inserted;
      updated += res.updated;
      skipped += res.skipped;
      console.log(`[${Math.min(i + CHUNK, profiles.length)}/${profiles.length}] yangi=${res.inserted} yangilandi=${res.updated} o'tkazib_yuborildi=${res.skipped}`);
    }
  } catch (e) {
    console.error("Import xatosi:", e?.message || e);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
  console.log(`\nTayyor: ${inserted} yangi, ${updated} yangilandi, ${skipped} o'tkazib yuborildi.`);
}

run().catch((e) => {
  console.error("Xatolik:", e?.message || e);
  process.exit(1);
});
