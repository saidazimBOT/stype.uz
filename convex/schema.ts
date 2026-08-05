import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables(),

  // O'yinchi profillari (har bir foydalanuvchi uchun bitta)
  users: defineTable({
    tokenIdentifier: v.string(),
    username: v.optional(v.string()),
    avatar: v.string(),
    coins: v.number(),
    xp: v.number(),
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    races: v.number(),
    bestWpm: v.optional(v.number()),
    lastSeen: v.number(),
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
});
