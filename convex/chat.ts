import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { stableUserId } from "./authz";

// ── Konstantalar ──────────────────────────────────────────────────────
const MAX_TEXT_LEN = 300;
/** Bir foydalanuvchi 2 soniyada ko'pi bilan 1 ta xabar yozishi mumkin (spam himoyasi) */
const RATE_LIMIT_MS = 2000;
/** Xabarlar ro'yxatida ko'rsatiladigan maksimal son */
const DEFAULT_LIMIT = 60;
const MAX_LIMIT = 120;
/** Onlayn deb hisoblash uchun oxirgi faollik oralig'i */
const ONLINE_WINDOW_MS = 5 * 60 * 1000;
/** Chat xabarlari shuncha vaqtdan keyin avtomatik o'chiriladi (7 kun) */
const CHAT_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

// ── Xabar yuborish ────────────────────────────────────────────────────
export const sendMessage = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval tizimga kiring");
    const token = stableUserId(identity);
    const now = Date.now();

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", token))
      .first();

    if (user?.banned) throw new Error("Siz chatdan bloklangansiz");

    // Profil qatori hali yo'q bo'lsa — avtomatik yaratamiz (hama gaplashishi mumkin)
    if (!user) {
      const fallback = token.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
      const insertedId = await ctx.db.insert("users", {
        tokenIdentifier: token,
        username: `player_${fallback}`,
        avatar: "avatar_default",
        coins: 0,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        races: 0,
        bestWpm: undefined,
        lastSeen: now,
      });
      user = await ctx.db.get(insertedId);
    }
    if (!user) throw new Error("Profil topilmadi");

    const text = args.text.trim();
    if (!text) throw new Error("Xabar bo'sh bo'lishi mumkin emas");
    if (text.length > MAX_TEXT_LEN)
      throw new Error(`Xabar ${MAX_TEXT_LEN} ta belgidan oshmasligi kerak`);

    // Spam himoyasi: so'nggi xabar juda yaqinda yozilgan bo'lsa rad etamiz
    const last = await ctx.db
      .query("chatMessages")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", token))
      .order("desc")
      .first();
    if (last && now - last.createdAt < RATE_LIMIT_MS) {
      throw new Error("Juda tez yozyapsiz — biroz kuting");
    }

    await ctx.db.patch(user._id, { lastSeen: now });
    await ctx.db.insert("chatMessages", {
      tokenIdentifier: token,
      username: user.username || "player",
      avatar: user.avatar || "avatar_default",
      text,
      createdAt: now,
    });
    return true;
  },
});

// ── Xabarlar ro'yxati (eng yangilari, tartiblangan) ───────────────────
export const listMessages = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const msgs = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt")
      .order("desc")
      .take(Math.min(MAX_LIMIT, args.limit ?? DEFAULT_LIMIT));
    return msgs.reverse().map((m) => ({
      _id: m._id,
      tokenIdentifier: m.tokenIdentifier,
      username: m.username,
      avatar: m.avatar,
      text: m.text,
      createdAt: m.createdAt,
    }));
  },
});

// ── Onlayn foydalanuvchilar soni ──────────────────────────────────────
export const onlineCount = query({
  args: {},
  handler: async (ctx) => {
    const since = Date.now() - ONLINE_WINDOW_MS;
    const users = await ctx.db.query("users").order("desc").take(2000);
    return users.filter((u: any) => (u.lastSeen ?? 0) >= since && !u.banned).length;
  },
});

// ── Eski xabarlarni tozalash (cron orqali har 12 soatda chaqiriladi) ──
// Faqat server ichidan (internal) chaqiriladi — clientlar buni ishga tushira olmaydi.
export const cleanupOldMessages = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - CHAT_RETENTION_MS;
    // Har yugurishda ko'pi bilan 1000 ta o'chiriladi — mutation timeout bo'lmasligi uchun.
    // Cron har 12 soatda ishlaydi, shuning uchun asta-sekin barchasi tozalanadi.
    const old = await ctx.db
      .query("chatMessages")
      .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
      .take(1000);
    for (const m of old) {
      await ctx.db.delete(m._id);
    }
    return old.length;
  },
});
