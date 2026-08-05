import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// Joriy foydalanuvchining token identifikatori (xona ichida "men" ni topish uchun)
export const myToken = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity?.tokenIdentifier ?? null;
  },
});

// Joriy foydalanuvchi profili (login qilgan bo'lsa)
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    return user ?? null;
  },
});

// Onlayn status uchun yurak urishi (har 60 soniyada chaqiriladi)
export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
      .first();
    if (user) await ctx.db.patch(user._id, { lastSeen: Date.now() });
  },
});

// Username o'rnatish / profil yaratish.
// Birinchi marta kirganda localStorage dagi coins/xp/avatar import qilinadi.
export const setUsername = mutation({
  args: {
    username: v.string(),
    avatar: v.optional(v.string()),
    coins: v.optional(v.number()),
    xp: v.optional(v.number()),
    bestWpm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const tokenIdentifier = identity.tokenIdentifier;

    const raw = args.username.trim();
    if (raw.length < 2 || raw.length > 20) {
      throw new Error("Username 2-20 ta belgidan iborat bo'lishi kerak");
    }
    // lotin, kirill, raqam va pastki chiziq ruxsat
    if (!/^[a-zA-Z0-9_\u0400-\u04FF]+$/.test(raw)) {
      throw new Error("Faqat harflar, raqamlar va _ ishlatish mumkin");
    }

    const now = Date.now();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: raw,
        avatar: args.avatar ?? existing.avatar,
        lastSeen: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier,
      username: raw,
      avatar: args.avatar ?? "avatar_default",
      coins: args.coins ?? 50,
      xp: args.xp ?? 0,
      wins: 0,
      losses: 0,
      draws: 0,
      races: 0,
      bestWpm: args.bestWpm,
      lastSeen: now,
    });
  },
});
