import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { stableUserId } from "./authz";

// Joriy foydalanuvchining barqaror identifikatori (ADMIN_TOKENS env uchun).
// DIQQAT: Convex Auth'da `identity.tokenIdentifier` sessiyaga bog'liq —
// bu yerda BARQAROR userId qismini qaytaramiz (users._id bilan mos keladi).
export const myToken = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    return identity ? stableUserId(identity) : null;
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
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", stableUserId(identity))
      )
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
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", stableUserId(identity))
      )
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
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    signedUpAt: v.optional(v.number()),
    coins: v.optional(v.number()),
    xp: v.optional(v.number()),
    bestWpm: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");
    const token = stableUserId(identity);

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
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", token))
      .first();

    const firstName = args.firstName?.trim();
    const lastName = args.lastName?.trim();

    if (existing) {
      await ctx.db.patch(existing._id, {
        username: raw,
        avatar: args.avatar ?? existing.avatar,
        firstName: firstName !== undefined ? firstName : existing.firstName,
        lastName: lastName !== undefined ? lastName : existing.lastName,
        signedUpAt: args.signedUpAt ?? existing.signedUpAt,
        lastSeen: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: token,
      username: raw,
      avatar: args.avatar ?? "avatar_default",
      firstName,
      lastName,
      signedUpAt: args.signedUpAt,
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
