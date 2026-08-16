import { v } from "convex/values";
import { query, mutation, type MutationCtx } from "./_generated/server";
import { requireAdmin, getCurrentUser, displayName, stableUserId } from "./authz";

// ── Yordamchi: admin harakatini jurnalga yozish ────────────────────────
// Diqqat: jurnalga HECH QACHON parol, token yoki maxfiy kalit yozilmaydi.
async function logAdminAction(
  ctx: MutationCtx,
  adminName: string,
  action: string,
  target?: string,
  details?: string
) {
  await ctx.db.insert("adminLogs", {
    adminName,
    action,
    target: target || undefined,
    details: details || undefined,
    createdAt: Date.now(),
  });
}

// ══════════════════════════════════════════════════════════════════════
// ACCESS — kim admin ekanligini tekshirish
// ══════════════════════════════════════════════════════════════════════

/** Joriy foydalanuvchi admin/owner bo'lsa rolini qaytaradi. */
export const isAdmin = query({
  args: {},
  handler: async (ctx) => {
    const admin = await requireAdmin(ctx);
    return { role: admin.user.role ?? "user", username: admin.user.username || "" };
  },
});

/**
 * Birinchi adminni "yasash" (bootstrap).
 * 1) ADMIN_TOKENS env o'rnatilgan bo'lsa — faqat ro'yxatdagi token egalari.
 * 2) Aks holda — hali admin yo'q ekan, birinchi so'rovchi owner bo'ladi.
 */
export const claimAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval tizimga kiring");
    // Barqaror identifikator — Convex Auth'da tokenIdentifier sessiyaga bog'liq
    const token = stableUserId(identity);

    const envTokens = (process.env.ADMIN_TOKENS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (envTokens.length > 0) {
      if (!envTokens.includes(token)) {
        throw new Error(
          "Sizning token ADMIN_TOKENS ro'yxatida yo'q. Panelda ko'rsatilgan tokenni Convex env'ga qo'shing."
        );
      }
    } else {
      const existingAdmin = await ctx.db
        .query("users")
        .filter((q: any) =>
          q.or(q.eq(q.field("role"), "admin"), q.eq(q.field("role"), "owner"))
        )
        .first();
      if (existingAdmin) {
        throw new Error("Admin allaqachon mavjud. Ruxsat uchun ADMIN_TOKENS env o'rnating.");
      }
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "owner", banned: false });
    } else {
      await ctx.db.insert("users", {
        tokenIdentifier: token,
        username: undefined,
        avatar: "avatar_default",
        coins: 0,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        races: 0,
        bestWpm: undefined,
        lastSeen: Date.now(),
        role: "owner",
        banned: false,
      });
    }
    await logAdminAction(ctx, token.slice(-8), "claim_admin", token.slice(-8), "owner rol berildi");
    return true;
  },
});

/**
 * Parol bilan admin kirish (xavfsiz — parol faqat serverda tekshiriladi).
 *
 * ADMIN_PASSWORD env o'rnatilgan bo'lsa ishlaydi: to'g'ri parol kiritgan
 * foydalanuvchiga owner roli beriladi. Parol frontend kodida KO'RINMAYDI —
 * faqat Convex env'da saqlanadi.
 *
 * Oqim: foydalanuvchi anonymous sign-in qiladi (yoki allaqachon kirgan),
 * so'ng parolni shu mutation'ga yuboradi. Parol to'g'ri bo'lsa — rol beriladi.
 */
export const loginWithPassword = mutation({
  args: { password: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval tizimga kiring");
    const token = stableUserId(identity);

    const envPassword = process.env.ADMIN_PASSWORD || "";
    if (!envPassword) {
      throw new Error(
        "ADMIN_PASSWORD env o'rnatilmagan. Convex dashboard → Settings → Environment Variables bo'limida qo'shing."
      );
    }
    if (args.password !== envPassword) {
      throw new Error("Parol noto'g'ri!");
    }

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { role: "owner", banned: false });
    } else {
      await ctx.db.insert("users", {
        tokenIdentifier: token,
        username: undefined,
        avatar: "avatar_default",
        coins: 0,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        races: 0,
        bestWpm: undefined,
        lastSeen: Date.now(),
        role: "owner",
        banned: false,
      });
    }
    await logAdminAction(ctx, token.slice(-8), "password_login", token.slice(-8), "parol orqali owner rol berildi");
    return true;
  },
});

// ══════════════════════════════════════════════════════════════════════
// ANALYTICS DASHBOARD
// ══════════════════════════════════════════════════════════════════════

const DAY = 24 * 60 * 60 * 1000;

export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const onlineSince = now - 5 * 60 * 1000;
    const d0 = new Date();
    d0.setHours(0, 0, 0, 0);
    const todayStart = d0.getTime();

    const users = await ctx.db.query("users").order("desc").take(5000);
    const results = await ctx.db.query("typingResults").order("desc").take(5000);

    const totalUsers = users.length;
    const online = users.filter((u: any) => u.lastSeen >= onlineSince && !u.banned).length;
    const newToday = users.filter((u: any) => u._creationTime >= todayStart).length;
    const testsToday = results.filter((r: any) => r.createdAt >= todayStart).length;

    // So'nggi 30 kunlik kunlik seriya
    const series: { date: string; label: string; tests: number; wpm: number; newUsers: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * DAY);
      d.setHours(0, 0, 0, 0);
      const start = d.getTime();
      const end = start + DAY;
      const dayResults = results.filter((r: any) => r.createdAt >= start && r.createdAt < end);
      const dayUsers = users.filter((u: any) => u._creationTime >= start && u._creationTime < end);
      series.push({
        date: d.toISOString().slice(0, 10),
        label: d.toLocaleDateString("en", { day: "2-digit", month: "short" }),
        tests: dayResults.length,
        wpm: dayResults.length
          ? Math.round(dayResults.reduce((a: number, r: any) => a + r.wpm, 0) / dayResults.length)
          : 0,
        newUsers: dayUsers.length,
      });
    }

    const avg = (arr: any[], f: (x: any) => number) =>
      arr.length ? Math.round(arr.reduce((a, x) => a + f(x), 0) / arr.length) : 0;

    const r7 = results.filter((r: any) => r.createdAt >= now - 7 * DAY);
    const r30 = results.filter((r: any) => r.createdAt >= now - 30 * DAY);
    const u7 = users.filter((u: any) => u._creationTime >= now - 7 * DAY);
    const u30 = users.filter((u: any) => u._creationTime >= now - 30 * DAY);

    return {
      totals: {
        users: totalUsers,
        online,
        newToday,
        testsToday,
        tests7d: r7.length,
        tests30d: r30.length,
        newUsers7d: u7.length,
        newUsers30d: u30.length,
        avgWpm: avg(results, (r) => r.wpm),
        avgAcc: avg(results, (r) => r.accuracy),
        avgWpm7d: avg(r7, (r) => r.wpm),
        avgAcc7d: avg(r7, (r) => r.accuracy),
        avgWpm30d: avg(r30, (r) => r.wpm),
        avgAcc30d: avg(r30, (r) => r.accuracy),
        bestWpm: results.length ? Math.max(...results.map((r: any) => r.wpm)) : 0,
      },
      series,
    };
  },
});

// ══════════════════════════════════════════════════════════════════════
// USERS MANAGEMENT
// ══════════════════════════════════════════════════════════════════════

export const listUsers = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").order("desc").take(1000);
    const q = (args.search || "").trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (u: any) =>
            (u.username || "").toLowerCase().includes(q) ||
            u.tokenIdentifier.toLowerCase().includes(q)
        )
      : all;
    return filtered.slice(0, args.limit ?? 200).map((u: any) => ({
      _id: u._id,
      username: u.username || "",
      avatar: u.avatar,
      coins: u.coins,
      xp: u.xp,
      wins: u.wins,
      losses: u.losses,
      draws: u.draws,
      races: u.races,
      bestWpm: u.bestWpm ?? 0,
      lastSeen: u.lastSeen,
      role: u.role ?? "user",
      banned: !!u.banned,
      bannedReason: u.bannedReason ?? "",
      createdAt: u._creationTime,
    }));
  },
});

// ── Ro'yxatdan o'tganlar (sign up) — admin paneldagi alohida bo'lim ────
export const listRegisteredUsers = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("users").order("desc").take(5000);
    // Faqat sign up orqali profil yaratganlar (username yoki firstName borlar)
    const registered = all.filter((u: any) => u.username || u.firstName);
    const q = (args.search || "").trim().toLowerCase();
    const filtered = q
      ? registered.filter(
          (u: any) =>
            (u.username || "").toLowerCase().includes(q) ||
            (u.firstName || "").toLowerCase().includes(q) ||
            (u.lastName || "").toLowerCase().includes(q)
        )
      : registered;
    return filtered.slice(0, args.limit ?? 1000).map((u: any) => ({
      _id: u._id,
      username: u.username || "",
      firstName: u.firstName || "",
      lastName: u.lastName || "",
      avatar: u.avatar,
      role: u.role ?? "user",
      signedUpAt: u.signedUpAt ?? u._creationTime,
      lastSeen: u.lastSeen,
    }));
  },
});

export const getUserProfile = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("Foydalanuvchi topilmadi");

    const results = await ctx.db
      .query("typingResults")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .order("desc")
      .take(20);

    const unlocks = await ctx.db
      .query("userAchievements")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .collect();
    const achievements: any[] = [];
    for (const u of unlocks) {
      const a = await ctx.db
        .query("achievements")
        .withIndex("by_key", (q: any) => q.eq("key", u.achievementKey))
        .first();
      if (a) achievements.push({ key: a.key, title: a.title, icon: a.icon, color: a.color, unlockedAt: u.unlockedAt });
    }

    const transactions = await ctx.db
      .query("coinTransactions")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", user.tokenIdentifier))
      .order("desc")
      .take(25);

    return {
      user: {
        _id: user._id,
        username: user.username || "",
        avatar: user.avatar,
        coins: user.coins,
        xp: user.xp,
        wins: user.wins,
        losses: user.losses,
        draws: user.draws,
        races: user.races,
        bestWpm: user.bestWpm ?? 0,
        lastSeen: user.lastSeen,
        role: user.role ?? "user",
        banned: !!user.banned,
        bannedReason: user.bannedReason ?? "",
        createdAt: user._creationTime,
      },
      results: results.map((r: any) => ({
        wpm: r.wpm,
        accuracy: r.accuracy,
        errors: r.errors,
        lang: r.lang,
        duration: r.duration,
        createdAt: r.createdAt,
      })),
      achievements,
      transactions: transactions.map((t: any) => ({
        kind: t.kind,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        reason: t.reason,
        adminName: t.adminName ?? "",
        createdAt: t.createdAt,
      })),
    };
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("user"), v.literal("admin"), v.literal("owner")),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Foydalanuvchi topilmadi");
    if (args.role === "owner" && admin.user.role !== "owner")
      throw new Error("Faqat owner bu rolni bera oladi");
    if (target.tokenIdentifier === stableUserId(admin.identity) && args.role !== "owner")
      throw new Error("O'z rolingizni tushira olmaysiz");
    await ctx.db.patch(target._id, { role: args.role });
    await logAdminAction(ctx, displayName(admin.user), "role_change", target.username || "?", `rol → ${args.role}`);
  },
});

export const setUserBan = mutation({
  args: { userId: v.id("users"), banned: v.boolean(), reason: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Foydalanuvchi topilmadi");
    if (target.tokenIdentifier === stableUserId(admin.identity))
      throw new Error("O'zingizni ban qila olmaysiz");
    if (target.role === "owner" && admin.user.role !== "owner")
      throw new Error("Ownerni ban qilish mumkin emas");
    await ctx.db.patch(target._id, {
      banned: args.banned,
      bannedReason: args.banned ? args.reason ?? "" : undefined,
    });
    await logAdminAction(
      ctx,
      displayName(admin.user),
      args.banned ? "ban" : "unban",
      target.username || "?",
      args.banned ? args.reason ?? "" : "ban bekor qilindi"
    );
  },
});

export const deleteUser = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Foydalanuvchi topilmadi");
    if (target.tokenIdentifier === stableUserId(admin.identity))
      throw new Error("O'z hisobingizni o'chira olmaysiz");
    if (target.role === "owner" && admin.user.role !== "owner")
      throw new Error("Ownerni o'chirish mumkin emas");

    const token = target.tokenIdentifier;
    for (const r of await ctx.db
      .query("typingResults")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db
      .query("userAchievements")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db
      .query("coinTransactions")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    for (const r of await ctx.db.query("reports").collect()) {
      if (r.targetToken === token || r.reporterToken === token) await ctx.db.delete(r._id);
    }
    await ctx.db.delete(target._id);
    await logAdminAction(ctx, displayName(admin.user), "delete_user", target.username || "?", "hisob va bog'liq ma'lumotlar o'chirildi");
  },
});

// ══════════════════════════════════════════════════════════════════════
// COINS & XP MANAGEMENT
// ══════════════════════════════════════════════════════════════════════

export const adjustBalance = mutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("coins"), v.literal("xp")),
    amount: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Foydalanuvchi topilmadi");
    if (args.amount === 0) throw new Error("Miqdor 0 bo'lishi mumkin emas");
    if (!args.reason.trim()) throw new Error("Sababni kiriting");

    const current = args.kind === "coins" ? target.coins : target.xp;
    const next = current + args.amount;
    if (next < 0) throw new Error(`Salbiy balans taqiqlanadi: joriy ${Math.round(current)}, o'zgarish ${Math.round(args.amount)}`);

    const patch = args.kind === "coins" ? { coins: Math.round(next) } : { xp: Math.round(next) };
    await ctx.db.patch(target._id, patch);

    await ctx.db.insert("coinTransactions", {
      tokenIdentifier: target.tokenIdentifier,
      username: target.username || "?",
      kind: args.kind,
      amount: Math.round(args.amount),
      balanceAfter: Math.round(next),
      reason: args.reason,
      adminName: displayName(admin.user),
      createdAt: Date.now(),
    });

    await logAdminAction(
      ctx,
      displayName(admin.user),
      `${args.kind}_adjust`,
      target.username || "?",
      `${args.amount > 0 ? "+" : ""}${Math.round(args.amount)} ${args.kind} (${args.reason})`
    );
  },
});

export const listTransactions = query({
  args: { search: v.optional(v.string()), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("coinTransactions").order("desc").take(600);
    const q = (args.search || "").trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (t: any) =>
            t.username.toLowerCase().includes(q) || t.reason.toLowerCase().includes(q)
        )
      : all;
    return filtered.slice(0, args.limit ?? 120).map((t: any) => ({
      _id: t._id,
      username: t.username,
      kind: t.kind,
      amount: t.amount,
      balanceAfter: t.balanceAfter,
      reason: t.reason,
      adminName: t.adminName ?? "",
      createdAt: t.createdAt,
    }));
  },
});

// ══════════════════════════════════════════════════════════════════════
// COIN GIFT (SOVG'A / PADARKA)
// ══════════════════════════════════════════════════════════════════════

/** Bir martalik sovg'a uchun yuqori chegara — xato kiritilgan katta sonlardan himoya */
const GIFT_MAX = 1_000_000;

/** Bitta foydalanuvchiga coin sovg'a qilish (faqat musbat miqdor). */
export const giftCoins = mutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const amount = Math.round(args.amount);
    if (amount <= 0) throw new Error("Sovg'a miqdori musbat bo'lishi kerak");
    if (amount > GIFT_MAX) throw new Error(`Sovg'a miqdori ${GIFT_MAX.toLocaleString()} dan oshmasligi kerak`);
    const target = await ctx.db.get(args.userId);
    if (!target) throw new Error("Foydalanuvchi topilmadi");

    const next = target.coins + amount;
    await ctx.db.patch(target._id, { coins: next });

    const reason = `🎁 Sovg'a${args.message?.trim() ? `: ${args.message.trim()}` : ""}`;
    await ctx.db.insert("coinTransactions", {
      tokenIdentifier: target.tokenIdentifier,
      username: target.username || "?",
      kind: "coins",
      amount,
      balanceAfter: next,
      reason,
      adminName: displayName(admin.user),
      createdAt: Date.now(),
    });

    await logAdminAction(ctx, displayName(admin.user), "coin_gift", target.username || "?", `+${amount} coins (${reason})`);
    return { newBalance: next };
  },
});

/** Barcha (ban qilinmagan) foydalanuvchilarga bir xil coin sovg'a qilish. */
export const giftCoinsToAll = mutation({
  args: {
    amount: v.number(),
    message: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const amount = Math.round(args.amount);
    if (amount <= 0) throw new Error("Miqdor musbat bo'lishi kerak");
    if (amount > GIFT_MAX) throw new Error(`Miqdor ${GIFT_MAX.toLocaleString()} dan oshmasligi kerak`);

    const users = await ctx.db.query("users").collect();
    const reason = `🎁 Barchaga sovg'a${args.message?.trim() ? `: ${args.message.trim()}` : ""}`;
    const now = Date.now();
    let count = 0;

    for (const u of users) {
      if (u.banned) continue;
      const next = u.coins + amount;
      await ctx.db.patch(u._id, { coins: next });
      await ctx.db.insert("coinTransactions", {
        tokenIdentifier: u.tokenIdentifier,
        username: u.username || "?",
        kind: "coins",
        amount,
        balanceAfter: next,
        reason,
        adminName: displayName(admin.user),
        createdAt: now,
      });
      count++;
    }

    await logAdminAction(ctx, displayName(admin.user), "coin_gift_all", `${count} ta foydalanuvchi`, `+${amount} coins (${reason})`);
    return { count };
  },
});

// ══════════════════════════════════════════════════════════════════════
// TYPING TEXT MANAGEMENT
// ══════════════════════════════════════════════════════════════════════

const DIFF = v.union(v.literal("easy"), v.literal("medium"), v.literal("hard"));

export const listTypingTexts = query({
  args: {
    lang: v.optional(v.string()),
    difficulty: v.optional(DIFF),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let all = await ctx.db.query("typingTexts").collect();
    if (args.lang) all = all.filter((t: any) => t.lang === args.lang);
    if (args.difficulty) all = all.filter((t: any) => t.difficulty === args.difficulty);
    const q = (args.search || "").trim().toLowerCase();
    if (q)
      all = all.filter(
        (t: any) =>
          t.text.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
      );
    return all
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((t: any) => ({
        _id: t._id,
        text: t.text,
        lang: t.lang,
        difficulty: t.difficulty,
        category: t.category,
        enabled: t.enabled,
        createdByName: t.createdByName,
        createdAt: t.createdAt,
      }));
  },
});

export const saveTypingText = mutation({
  args: {
    id: v.optional(v.id("typingTexts")),
    text: v.string(),
    lang: v.string(),
    difficulty: DIFF,
    category: v.string(),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const trimmed = args.text.trim();
    if (trimmed.length < 10) throw new Error("Matn juda qisqa (kamida 10 belgi)");
    if (!args.lang.trim()) throw new Error("Tilni tanlang");
    const cat = args.category.trim() || "general";
    if (args.id) {
      const doc = await ctx.db.get(args.id);
      if (!doc) throw new Error("Matn topilmadi");
      await ctx.db.patch(args.id, { text: trimmed, lang: args.lang, difficulty: args.difficulty, category: cat, enabled: args.enabled });
      await logAdminAction(ctx, displayName(admin.user), "text_edit", doc.lang, `${args.lang} · ${args.difficulty} · ${cat}`);
    } else {
      await ctx.db.insert("typingTexts", {
        text: trimmed,
        lang: args.lang,
        difficulty: args.difficulty,
        category: cat,
        enabled: args.enabled,
        createdByName: displayName(admin.user),
        createdAt: Date.now(),
      });
      await logAdminAction(ctx, displayName(admin.user), "text_create", args.lang, `${args.difficulty} · ${cat}`);
    }
  },
});

export const deleteTypingText = mutation({
  args: { id: v.id("typingTexts") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Matn topilmadi");
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, displayName(admin.user), "text_delete", doc.lang, `${doc.text.slice(0, 40)}…`);
  },
});

export const importDefaultTexts = mutation({
  args: {
    items: v.array(
      v.object({ text: v.string(), lang: v.string(), difficulty: DIFF, category: v.string() })
    ),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("typingTexts").collect();
    const have = new Set(existing.map((t: any) => t.text.trim()));
    let added = 0;
    for (const it of args.items) {
      const trimmed = it.text.trim();
      if (trimmed.length < 10 || have.has(trimmed)) continue;
      await ctx.db.insert("typingTexts", {
        text: trimmed,
        lang: it.lang,
        difficulty: it.difficulty,
        category: it.category || "general",
        enabled: true,
        createdByName: displayName(admin.user),
        createdAt: Date.now(),
      });
      have.add(trimmed);
      added++;
    }
    await logAdminAction(ctx, displayName(admin.user), "text_import", `${args.items.length} ta`, `${added} ta yangi qo'shildi`);
    return { added };
  },
});

// ══════════════════════════════════════════════════════════════════════
// ACHIEVEMENTS MANAGEMENT
// ══════════════════════════════════════════════════════════════════════

const REQ_TYPE = v.union(
  v.literal("wpm"),
  v.literal("accuracy"),
  v.literal("tests"),
  v.literal("races"),
  v.literal("coins"),
  v.literal("xp")
);

export const listAchievements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("achievements").order("desc").take(200);
    return all
      .slice()
      .sort((a: any, b: any) => (a.order ?? 0) - (b.order ?? 0))
      .map((a: any) => ({
        _id: a._id,
        key: a.key,
        title: a.title,
        desc: a.desc,
        icon: a.icon,
        color: a.color,
        reqType: a.reqType,
        reqGoal: a.reqGoal,
        xpReward: a.xpReward,
        coinReward: a.coinReward,
        enabled: a.enabled,
        order: a.order,
      }));
  },
});

export const saveAchievement = mutation({
  args: {
    id: v.optional(v.id("achievements")),
    key: v.string(),
    title: v.string(),
    desc: v.string(),
    icon: v.string(),
    color: v.string(),
    reqType: REQ_TYPE,
    reqGoal: v.number(),
    xpReward: v.number(),
    coinReward: v.number(),
    enabled: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const key = args.key.trim().toLowerCase().replace(/[^a-z0-9_]/g, "_") || "ach_" + Date.now();
    const title = args.title.trim();
    if (!title) throw new Error("Yutuq nomini kiriting");
    if (args.reqGoal < 0) throw new Error("Talab manfiy bo'lishi mumkin emas");

    if (args.id) {
      const doc = await ctx.db.get(args.id);
      if (!doc) throw new Error("Yutuq topilmadi");
      await ctx.db.patch(args.id, {
        key,
        title,
        desc: args.desc,
        icon: args.icon,
        color: args.color,
        reqType: args.reqType,
        reqGoal: args.reqGoal,
        xpReward: Math.max(0, Math.round(args.xpReward)),
        coinReward: Math.max(0, Math.round(args.coinReward)),
        enabled: args.enabled,
        order: args.order,
      });
      await logAdminAction(ctx, displayName(admin.user), "achievement_edit", title, key);
    } else {
      await ctx.db.insert("achievements", {
        key,
        title,
        desc: args.desc,
        icon: args.icon,
        color: args.color,
        reqType: args.reqType,
        reqGoal: args.reqGoal,
        xpReward: Math.max(0, Math.round(args.xpReward)),
        coinReward: Math.max(0, Math.round(args.coinReward)),
        enabled: args.enabled,
        order: args.order,
      });
      await logAdminAction(ctx, displayName(admin.user), "achievement_create", title, key);
    }
  },
});

export const deleteAchievement = mutation({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("Yutuq topilmadi");
    for (const r of await ctx.db
      .query("userAchievements")
      .withIndex("by_achievement", (q: any) => q.eq("achievementKey", doc.key))
      .collect()) {
      await ctx.db.delete(r._id);
    }
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, displayName(admin.user), "achievement_delete", doc.title, doc.key);
  },
});

export const achievementUnlockers = query({
  args: { id: v.id("achievements") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const a = await ctx.db.get(args.id);
    if (!a) throw new Error("Yutuq topilmadi");
    const unlocks = await ctx.db
      .query("userAchievements")
      .withIndex("by_achievement", (q: any) => q.eq("achievementKey", a.key))
      .collect();
    const out: { username: string; avatar: string; unlockedAt: number }[] = [];
    for (const u of unlocks) {
      const user = await ctx.db
        .query("users")
        .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", u.tokenIdentifier))
        .first();
      if (user) out.push({ username: user.username || "?", avatar: user.avatar, unlockedAt: u.unlockedAt });
    }
    return out.sort((x, y) => x.unlockedAt - y.unlockedAt);
  },
});

// ══════════════════════════════════════════════════════════════════════
// REPORTS
// ══════════════════════════════════════════════════════════════════════

export const fileReport = mutation({
  args: {
    targetToken: v.string(),
    targetName: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cur = await getCurrentUser(ctx);
    if (!cur) throw new Error("Avval tizimga kiring");
    if (stableUserId(cur.identity) === args.targetToken)
      throw new Error("O'zingizga shikoyat yoza olmaysiz");
    const now = Date.now();
    const recent = await ctx.db
      .query("reports")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .collect();
    if (
      recent.some(
        (r: any) =>
          r.reporterToken === stableUserId(cur.identity) &&
          r.targetToken === args.targetToken &&
          now - r.createdAt < 60 * 60 * 1000
      )
    ) {
      throw new Error("Bu foydalanuvchi haqida so'nggi soatda allaqachon hisobot yuborgansiz");
    }
    await ctx.db.insert("reports", {
      reporterToken: stableUserId(cur.identity),
      reporterName: displayName(cur.user),
      targetToken: args.targetToken,
      targetName: args.targetName || "?",
      reason: args.reason,
      details: args.details,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const listReports = query({
  args: {
    status: v.optional(v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved"))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let all = await ctx.db.query("reports").collect();
    if (args.status) all = all.filter((r: any) => r.status === args.status);
    return all
      .sort((a: any, b: any) => b.createdAt - a.createdAt)
      .map((r: any) => ({
        _id: r._id,
        reporterName: r.reporterName,
        targetName: r.targetName,
        reason: r.reason,
        details: r.details ?? "",
        status: r.status,
        adminNote: r.adminNote ?? "",
        adminName: r.adminName ?? "",
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      }));
  },
});

export const updateReportStatus = mutation({
  args: {
    id: v.id("reports"),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved")),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const r = await ctx.db.get(args.id);
    if (!r) throw new Error("Hisobot topilmadi");
    await ctx.db.patch(args.id, {
      status: args.status,
      adminNote: args.note !== undefined ? args.note : r.adminNote,
      adminName: displayName(admin.user),
      updatedAt: Date.now(),
    });
    await logAdminAction(ctx, displayName(admin.user), "report_update", r.targetName, `${r.status} → ${args.status}`);
  },
});

// ══════════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════════

export const listAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("announcements").order("desc").take(200);
    return all.map((a: any) => ({
      _id: a._id,
      title: a.title,
      body: a.body,
      enabled: a.enabled,
      scheduledFor: a.scheduledFor ?? null,
      expiresAt: a.expiresAt ?? null,
      createdByName: a.createdByName,
      createdAt: a.createdAt,
      updatedAt: a.updatedAt,
    }));
  },
});

export const saveAnnouncement = mutation({
  args: {
    id: v.optional(v.id("announcements")),
    title: v.string(),
    body: v.string(),
    enabled: v.boolean(),
    scheduledFor: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const title = args.title.trim();
    const body = args.body.trim();
    if (!title || !body) throw new Error("Sarlavha va matnni kiriting");
    if (args.scheduledFor && args.expiresAt && args.expiresAt <= args.scheduledFor)
      throw new Error("Tugash vaqti boshlanish vaqtidan oldin bo'lishi mumkin emas");
    if (args.id) {
      const doc = await ctx.db.get(args.id);
      if (!doc) throw new Error("E'lon topilmadi");
      await ctx.db.patch(args.id, {
        title,
        body,
        enabled: args.enabled,
        scheduledFor: args.scheduledFor ?? undefined,
        expiresAt: args.expiresAt ?? undefined,
        updatedAt: Date.now(),
      });
      await logAdminAction(ctx, displayName(admin.user), "announcement_edit", title, args.enabled ? "faol" : "o'chirilgan");
    } else {
      await ctx.db.insert("announcements", {
        title,
        body,
        enabled: args.enabled,
        scheduledFor: args.scheduledFor ?? undefined,
        expiresAt: args.expiresAt ?? undefined,
        createdByName: displayName(admin.user),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      await logAdminAction(ctx, displayName(admin.user), "announcement_create", title, args.enabled ? "faol" : "o'chirilgan");
    }
  },
});

export const deleteAnnouncement = mutation({
  args: { id: v.id("announcements") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const doc = await ctx.db.get(args.id);
    if (!doc) throw new Error("E'lon topilmadi");
    await ctx.db.delete(args.id);
    await logAdminAction(ctx, displayName(admin.user), "announcement_delete", doc.title, "");
  },
});

// ══════════════════════════════════════════════════════════════════════
// SECURITY / ADMIN LOGS
// ══════════════════════════════════════════════════════════════════════

export const listAdminLogs = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("adminLogs").order("desc").take(args.limit ?? 300);
    return all.map((l: any) => ({
      _id: l._id,
      adminName: l.adminName,
      action: l.action,
      target: l.target ?? "",
      details: l.details ?? "",
      createdAt: l.createdAt,
    }));
  },
});

// ══════════════════════════════════════════════════════════════════════
// SITE SETTINGS
// ══════════════════════════════════════════════════════════════════════

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const s = await ctx.db.query("settings").first();
    return s
      ? {
          siteName: s.siteName,
          logo: s.logo,
          maintenanceMode: s.maintenanceMode,
          maintenanceMessage: s.maintenanceMessage,
          registrationOpen: s.registrationOpen,
          announcementsEnabled: s.announcementsEnabled,
          updatedAt: s.updatedAt,
          updatedByName: s.updatedByName,
        }
      : null;
  },
});

export const updateSettings = mutation({
  args: {
    siteName: v.string(),
    logo: v.string(),
    maintenanceMode: v.boolean(),
    maintenanceMessage: v.string(),
    registrationOpen: v.boolean(),
    announcementsEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const existing = await ctx.db.query("settings").first();
    const data = {
      siteName: args.siteName.trim() || "STypeUz",
      logo: args.logo.trim(),
      maintenanceMode: args.maintenanceMode,
      maintenanceMessage: args.maintenanceMessage.trim(),
      registrationOpen: args.registrationOpen,
      announcementsEnabled: args.announcementsEnabled,
      updatedAt: Date.now(),
      updatedByName: displayName(admin.user),
    };
    if (existing) await ctx.db.patch(existing._id, data);
    else await ctx.db.insert("settings", data);
    await logAdminAction(ctx, displayName(admin.user), "settings_update", "", "sayt sozlamalari yangilandi");
  },
});
