import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // O'yinchi profillari (har bir foydalanuvchi uchun bitta)
  users: defineTable({
    tokenIdentifier: v.string(),
    username: v.optional(v.string()),
    // Sign up paytida kiritilgan haqiqiy ism / familiya (admin panelda ko'rinadi)
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    // Ro'yxatdan o'tgan vaqt (profil yaratilgan sana)
    signedUpAt: v.optional(v.number()),
    avatar: v.string(),
    coins: v.number(),
    xp: v.number(),
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    races: v.number(),
    bestWpm: v.optional(v.number()),
    lastSeen: v.number(),
    // ── Admin / moderatsiya ──
    role: v.optional(v.union(v.literal("user"), v.literal("admin"), v.literal("owner"))),
    banned: v.optional(v.boolean()),
    bannedReason: v.optional(v.string()),
  }).index("by_token", ["tokenIdentifier"]),

  // Janglari xonalari (1v1 va Team)
  rooms: defineTable({
    code: v.string(),
    mode: v.union(v.literal("1v1"), v.literal("team")),
    visibility: v.union(v.literal("public"), v.literal("private")),
    status: v.union(
      v.literal("lobby"),
      v.literal("countdown"),
      v.literal("racing"),
      v.literal("finished")
    ),
    text: v.string(),
    createdBy: v.string(),
    players: v.array(
      v.object({
        tokenIdentifier: v.string(),
        username: v.string(),
        avatar: v.string(),
        color: v.string(),
        team: v.optional(v.union(v.literal("A"), v.literal("B"))),
        correct: v.number(),
        typed: v.number(),
        wpm: v.number(),
        accuracy: v.number(),
        finished: v.boolean(),
        finishTime: v.optional(v.number()),
        typedPreview: v.optional(v.string()),
        connected: v.boolean(),
      })
    ),
    countdownEndsAt: v.optional(v.number()),
    startedAt: v.optional(v.number()),
    endedAt: v.optional(v.number()),
    winner: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("draw"))),
    rewardsGranted: v.boolean(),
    createdAt: v.number(),
    maxPlayers: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_status", ["status", "createdAt"]),

  // ── Type test natijalari (analytics) ──────────────────────────────────
  typingResults: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    wpm: v.number(),
    accuracy: v.number(),
    errors: v.number(),
    lang: v.string(),
    duration: v.number(),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_createdAt", ["createdAt"]),

  // ── Yutuqlar (achievements) ───────────────────────────────────────────
  achievements: defineTable({
    key: v.string(),
    title: v.string(),
    desc: v.string(),
    icon: v.string(),
    color: v.string(),
    reqType: v.union(
      v.literal("wpm"),
      v.literal("accuracy"),
      v.literal("tests"),
      v.literal("races"),
      v.literal("coins"),
      v.literal("xp")
    ),
    reqGoal: v.number(),
    xpReward: v.number(),
    coinReward: v.number(),
    enabled: v.boolean(),
    order: v.number(),
  }).index("by_key", ["key"]),

  userAchievements: defineTable({
    tokenIdentifier: v.string(),
    achievementKey: v.string(),
    unlockedAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_achievement", ["achievementKey"]),

  // ── Foydalanuvchi shikoyatlari ────────────────────────────────────────
  reports: defineTable({
    reporterToken: v.string(),
    reporterName: v.string(),
    targetToken: v.string(),
    targetName: v.string(),
    reason: v.string(),
    details: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("resolved")),
    adminNote: v.optional(v.string()),
    adminName: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_status", ["status", "createdAt"]),

  // ── E'lonlar ──────────────────────────────────────────────────────────
  announcements: defineTable({
    title: v.string(),
    body: v.string(),
    enabled: v.boolean(),
    scheduledFor: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    createdByName: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_enabled", ["enabled", "scheduledFor"]),

  // ── Admin harakatlar jurnali ──────────────────────────────────────────
  adminLogs: defineTable({
    adminName: v.string(),
    action: v.string(),
    target: v.optional(v.string()),
    details: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_createdAt", ["createdAt"]),

  // ── Matnlar (admin boshqaradi) ────────────────────────────────────────
  typingTexts: defineTable({
    text: v.string(),
    lang: v.string(),
    difficulty: v.union(v.literal("easy"), v.literal("medium"), v.literal("hard")),
    category: v.string(),
    enabled: v.boolean(),
    createdByName: v.string(),
    createdAt: v.number(),
  }).index("by_lang", ["lang"]),

  // ── Tanga / XP tranzaksiyalari ────────────────────────────────────────
  coinTransactions: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    kind: v.union(v.literal("coins"), v.literal("xp")),
    amount: v.number(),
    balanceAfter: v.number(),
    reason: v.string(),
    adminName: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_createdAt", ["createdAt"]),

  // ── Sayt sozlamalari (bitta hujjat) ───────────────────────────────────
  settings: defineTable({
    siteName: v.string(),
    logo: v.string(),
    maintenanceMode: v.boolean(),
    maintenanceMessage: v.string(),
    registrationOpen: v.boolean(),
    announcementsEnabled: v.boolean(),
    updatedAt: v.number(),
    updatedByName: v.string(),
  }),

  // ── Global chat xabarlari (hama kirgan odamlar gaplashadi) ─────────────
  chatMessages: defineTable({
    tokenIdentifier: v.string(),
    username: v.string(),
    avatar: v.string(),
    text: v.string(),
    createdAt: v.number(),
  })
    .index("by_createdAt", ["createdAt"])
    .index("by_token", ["tokenIdentifier", "createdAt"]),
});
