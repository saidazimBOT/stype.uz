import { v } from "convex/values";
import { mutation, type MutationCtx } from "./_generated/server";

/**
 * Test yakunlanganda serverga natija yozadi.
 * - Foydalanuvchi ro'yxatdan o'tgan bo'lsa (Convex auth) — bazaga saqlanadi.
 * - Aks holda — bu brauzerda (localStorage) kuzatiladi, serverga yuborilmaydi.
 */
export const recordTypingResult = mutation({
  args: {
    wpm: v.number(),
    accuracy: v.number(),
    errors: v.number(),
    lang: v.string(),
    duration: v.number(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;
    const token = identity.tokenIdentifier;
    const now = Date.now();

    let user = await ctx.db
      .query("users")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .first();

    if (!user) {
      const fallback = token.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
      const name = (args.username || "").trim() || `player_${fallback}`;
      user = await ctx.db.insert("users", {
        tokenIdentifier: token,
        username: name,
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
      user = await ctx.db.get(user);
    } else {
      await ctx.db.patch(user._id, {
        lastSeen: now,
        bestWpm: Math.max(user.bestWpm ?? 0, Math.round(args.wpm)),
      });
    }

    await ctx.db.insert("typingResults", {
      tokenIdentifier: token,
      username: user.username || "?",
      wpm: Math.round(args.wpm),
      accuracy: Math.round(args.accuracy),
      errors: Math.round(args.errors),
      lang: args.lang,
      duration: Math.round(args.duration),
      createdAt: now,
    });

    await checkAchievements(ctx, user._id, token, {
      wpm: Math.round(args.wpm),
      accuracy: Math.round(args.accuracy),
    });
  },
});

// ── Yutuqlarni avtomatik ochish ──────────────────────────────────────────
async function checkAchievements(
  ctx: MutationCtx,
  userId: any,
  token: string,
  current: { wpm: number; accuracy: number }
) {
  const achievements = await ctx.db.query("achievements").collect();
  if (!achievements.length) return;

  const unlocked = await ctx.db
    .query("userAchievements")
    .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
    .collect();
  const has = new Set(unlocked.map((u: any) => u.achievementKey));

  const user = await ctx.db.get(userId);
  if (!user) return;

  const testCount = (
    await ctx.db
      .query("typingResults")
      .withIndex("by_token", (q: any) => q.eq("tokenIdentifier", token))
      .collect()
  ).length;

  for (const a of achievements) {
    if (!a.enabled || has.has(a.key)) continue;
    let pass = false;
    switch (a.reqType) {
      case "wpm":
        pass = (user.bestWpm ?? 0) >= a.reqGoal;
        break;
      case "accuracy":
        pass = current.accuracy >= a.reqGoal;
        break;
      case "tests":
        pass = testCount >= a.reqGoal;
        break;
      case "races":
        pass = user.races >= a.reqGoal;
        break;
      case "coins":
        pass = user.coins >= a.reqGoal;
        break;
      case "xp":
        pass = user.xp >= a.reqGoal;
        break;
    }
    if (!pass) continue;

    await ctx.db.insert("userAchievements", {
      tokenIdentifier: token,
      achievementKey: a.key,
      unlockedAt: Date.now(),
    });

    if (a.xpReward > 0 || a.coinReward > 0) {
      const coins = user.coins + a.coinReward;
      const xp = user.xp + a.xpReward;
      await ctx.db.patch(user._id, { coins, xp });
      const now = Date.now();
      if (a.coinReward > 0) {
        await ctx.db.insert("coinTransactions", {
          tokenIdentifier: token,
          username: user.username || "?",
          kind: "coins",
          amount: a.coinReward,
          balanceAfter: coins,
          reason: `Yutuq: ${a.title}`,
          adminName: "",
          createdAt: now,
        });
      }
      if (a.xpReward > 0) {
        await ctx.db.insert("coinTransactions", {
          tokenIdentifier: token,
          username: user.username || "?",
          kind: "xp",
          amount: a.xpReward,
          balanceAfter: xp,
          reason: `Yutuq: ${a.title}`,
          adminName: "",
          createdAt: now,
        });
      }
    }
  }
}
