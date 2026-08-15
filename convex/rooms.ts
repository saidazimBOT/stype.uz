import { v } from "convex/values";
import { mutation, query, internalMutation, type MutationCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { getRandomRaceText } from "./raceTexts";
import { stableUserId } from "./authz";

// ── Konstantalar ──────────────────────────────────────────────────────
const MAX_1V1_PLAYERS = 2;
const MAX_TEAM_PLAYERS = 8;
const COUNTDOWN_MS = 3000;
const RACE_TIMEOUT_S = 180; // 3 daqiqadan keyin avto-yakun
const QUICK_MATCH_STALE_MS = 90_000; // 90 soniyadan eski quick-match xona endi "ochiq" hisoblanmaydi
const QUICK_MATCH_CLEANUP_MS = 10 * 60_000; // 10 daqiqadan eski, tashlab ketilgan quick-match xona o'chiriladi
const MAX_CPS = 30; // ~360 WPM — undan tez "yozish" imkonsiz (anti-cheat)
const MAX_REPORTED_WPM = 300;

const PLAYER_COLORS = [
  "#38bdf8", "#f472b6", "#a78bfa", "#34d399",
  "#fbbf24", "#f87171", "#22d3ee", "#c084fc",
];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // chalkash harflarsiz

type Player = Doc<"rooms">["players"][number];

function genCode(): string {
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

async function getRoomByCode(ctx: MutationCtx, code: string) {
  return ctx.db
    .query("rooms")
    .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
    .first();
}

// ── Xona yaratish ─────────────────────────────────────────────────────
export const createRoom = mutation({
  args: {
    mode: v.union(v.literal("1v1"), v.literal("team")),
    visibility: v.union(v.literal("public"), v.literal("private")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", stableUserId(identity)))
      .first();
    if (!user?.username) throw new Error("Avval username o'rnating");

    let code = genCode();
    while (await getRoomByCode(ctx, code)) code = genCode();

    const roomId = await ctx.db.insert("rooms", {
      code,
      mode: args.mode,
      visibility: args.visibility,
      status: "lobby",
      text: "",
      createdBy: stableUserId(identity),
      players: [
        {
          tokenIdentifier: stableUserId(identity),
          username: user.username,
          avatar: user.avatar,
          color: PLAYER_COLORS[0],
          team: args.mode === "team" ? "A" : "A",
          correct: 0,
          typed: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          connected: true,
        },
      ],
      createdAt: Date.now(),
      rewardsGranted: false,
      maxPlayers: args.mode === "1v1" ? MAX_1V1_PLAYERS : MAX_TEAM_PLAYERS,
      quickMatch: false,
    });

    return { code, roomId };
  },
});

// ── Xonaga kirish ─────────────────────────────────────────────────────
export const joinRoom = mutation({
  args: {
    code: v.string(),
    team: v.optional(v.union(v.literal("A"), v.literal("B"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const room = await getRoomByCode(ctx, args.code);
    if (!room) throw new Error("Xona topilmadi");
    if (room.status !== "lobby") throw new Error("Jang allaqachon boshlangan");
    if (room.players.some((p) => p.tokenIdentifier === stableUserId(identity))) {
      throw new Error("Siz allaqachon bu xonadasiz");
    }
    if (room.players.length >= room.maxPlayers) throw new Error("Xona to'la");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", stableUserId(identity)))
      .first();
    if (!user?.username) throw new Error("Avval username o'rnating");

    let team = args.team;
    if (room.mode === "team" && !team) {
      const countA = room.players.filter((p) => p.team === "A").length;
      const countB = room.players.filter((p) => p.team === "B").length;
      team = countA <= countB ? "A" : "B";
    }
    if (room.mode === "team" && team) {
      const cap = Math.floor(room.maxPlayers / 2);
      const count = room.players.filter((p) => p.team === team).length;
      if (count >= cap) throw new Error("Bu jamoa to'lgan");
    }
    if (room.mode === "1v1") team = room.players[0]?.team === "A" ? "B" : "A";

    await ctx.db.patch(room._id, {
      players: [
        ...room.players,
        {
          tokenIdentifier: stableUserId(identity),
          username: user.username,
          avatar: user.avatar,
          color: PLAYER_COLORS[room.players.length % PLAYER_COLORS.length],
          team: team ?? "A",
          correct: 0,
          typed: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          connected: true,
        },
      ],
    });

    return { code: room.code, team };
  },
});

// ── Quick Match: tasodifiy real raqib bilan tezkor jang ───────────────
// Mavjud ochiq quick-match xonasiga qo'shiladi, yo'q bo'lsa yangisini yaratadi.
export const quickMatch = mutation({
  args: {
    mode: v.union(v.literal("1v1"), v.literal("team")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", stableUserId(identity)))
      .first();
    if (!user?.username) throw new Error("Avval username o'rnating");

    const now = Date.now();

    // 1) Ochilib turgan quick-match xonasini qidirish (90 soniyadan eski emas)
    const lobbyRooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .order("desc")
      .take(30);

    const open = lobbyRooms.find(
      (r) =>
        r.quickMatch &&
        r.mode === args.mode &&
        r.players.length < r.maxPlayers &&
        !r.players.some((p) => p.tokenIdentifier === stableUserId(identity)) &&
        now - r.createdAt < QUICK_MATCH_STALE_MS
    );

    if (open) {
      // Jamoa balansini saqlash: kam o'yinchili jamoaga qo'shilish
      let team: "A" | "B" | undefined;
      if (args.mode === "1v1") {
        team = open.players[0]?.team === "A" ? "B" : "A";
      } else {
        const countA = open.players.filter((p) => p.team === "A").length;
        const countB = open.players.filter((p) => p.team === "B").length;
        team = countA <= countB ? "A" : "B";
      }

      await ctx.db.patch(open._id, {
        players: [
          ...open.players,
          {
            tokenIdentifier: stableUserId(identity),
            username: user.username,
            avatar: user.avatar,
            color: PLAYER_COLORS[open.players.length % PLAYER_COLORS.length],
            team: team ?? "A",
            correct: 0,
            typed: 0,
            wpm: 0,
            accuracy: 100,
            finished: false,
            connected: true,
          },
        ],
      });
      return { code: open.code, roomId: open._id };
    }

    // 2) Yangi quick-match xona yaratish
    let code = genCode();
    while (await getRoomByCode(ctx, code)) code = genCode();

    const roomId = await ctx.db.insert("rooms", {
      code,
      mode: args.mode,
      visibility: "private",
      quickMatch: true,
      status: "lobby",
      text: "",
      createdBy: stableUserId(identity),
      players: [
        {
          tokenIdentifier: stableUserId(identity),
          username: user.username,
          avatar: user.avatar,
          color: PLAYER_COLORS[0],
          team: "A",
          correct: 0,
          typed: 0,
          wpm: 0,
          accuracy: 100,
          finished: false,
          connected: true,
        },
      ],
      createdAt: now,
      rewardsGranted: false,
      maxPlayers: args.mode === "1v1" ? MAX_1V1_PLAYERS : MAX_TEAM_PLAYERS,
    });

    return { code, roomId };
  },
});

// ── Xonani tark etish ─────────────────────────────────────────────────
export const leaveRoom = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const room = await getRoomByCode(ctx, args.code);
    if (!room) return;

    const players = room.players.filter(
      (p) => p.tokenIdentifier !== stableUserId(identity)
    );
    if (players.length === 0) {
      await ctx.db.delete(room._id);
      return;
    }
    await ctx.db.patch(room._id, { players });
  },
});

// ── Jangni boshlash (faqat xona egasi) ────────────────────────────────
export const startRoom = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const room = await getRoomByCode(ctx, args.code);
    if (!room) throw new Error("Xona topilmadi");
    if (room.createdBy !== stableUserId(identity)) throw new Error("Faqat xona egasi boshlasa bo'ladi");
    if (room.status !== "lobby") throw new Error("Jang allaqachon boshlangan");

    if (room.mode === "1v1" && room.players.length < 2) {
      throw new Error("2 ta o'yinchi kerak");
    }
    if (room.mode === "team") {
      const hasA = room.players.some((p) => p.team === "A");
      const hasB = room.players.some((p) => p.team === "B");
      if (!hasA || !hasB) throw new Error("Har ikkala jamoada ham o'yinchi kerak");
    }

    const text = getRandomRaceText();
    await ctx.db.patch(room._id, {
      status: "countdown",
      text,
      countdownEndsAt: Date.now() + COUNTDOWN_MS,
      players: room.players.map((p) => ({
        ...p,
        correct: 0,
        typed: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: undefined,
        typedPreview: undefined,
        connected: true,
      })),
    });
    return { text };
  },
});

// ── Soatni sinxronlash: countdown → racing, va muddat tugaganini tekshirish ──
export const syncClock = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const room = await getRoomByCode(ctx, args.code);
    if (!room) return null;

    const now = Date.now();

    // Quick Match: yetarli o'yinchi yig'ilgach jangni avtomatik boshlash
    if (room.status === "lobby" && room.quickMatch) {
      const enough =
        room.mode === "1v1"
          ? room.players.length >= 2
          : room.players.some((p) => p.team === "A") && room.players.some((p) => p.team === "B");
      if (enough) {
        await ctx.db.patch(room._id, {
          status: "countdown",
          text: getRandomRaceText(),
          countdownEndsAt: now + COUNTDOWN_MS,
          players: room.players.map((p) => ({
            ...p,
            correct: 0,
            typed: 0,
            wpm: 0,
            accuracy: 100,
            finished: false,
            finishTime: undefined,
            typedPreview: undefined,
            connected: true,
          })),
        });
        return "countdown";
      }
    }

    if (room.status === "countdown" && room.countdownEndsAt && now >= room.countdownEndsAt) {
      await ctx.db.patch(room._id, { status: "racing", startedAt: now });
      return "racing";
    }

    if (room.status === "racing" && room.startedAt && !room.rewardsGranted) {
      const elapsed = (now - room.startedAt) / 1000;
      if (elapsed > RACE_TIMEOUT_S) {
        await finishRace(ctx, room._id, room.players, "timeout");
        return "finished";
      }
    }

    return room.status;
  },
});

// ── Progress yangilash (anti-cheat bilan) ─────────────────────────────
export const updateProgress = mutation({
  args: {
    code: v.string(),
    correct: v.number(),
    typed: v.number(),
    wpm: v.number(),
    accuracy: v.number(),
    finished: v.boolean(),
    typedPreview: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const room = await getRoomByCode(ctx, args.code);
    if (!room || room.status !== "racing" || !room.startedAt) return null;

    const idx = room.players.findIndex((p) => p.tokenIdentifier === stableUserId(identity));
    if (idx < 0) return null;

    const me = room.players[idx];
    const textLen = room.text.length;
    const elapsed = (Date.now() - room.startedAt) / 1000;

    // Server tomonida tekshiruvlar:
    let correct = Math.max(0, Math.floor(args.correct));
    correct = Math.min(correct, textLen);
    if (correct < me.correct) correct = me.correct; // orqaga qaytish mumkin emas
    const maxByTime = Math.max(me.correct, Math.floor(elapsed * MAX_CPS));
    correct = Math.min(correct, maxByTime); // imkonsiz tezlikni bloklash

    const typed = Math.max(correct, Math.floor(args.typed));
    const accuracy = Math.min(100, Math.max(0, Math.round((correct / Math.max(1, typed)) * 100)));
    const wpm = Math.min(MAX_REPORTED_WPM, Math.max(0, Math.round(args.wpm)));
    const finished = args.finished || correct >= textLen;
    const finishTime = finished && !me.finished ? Math.round(elapsed * 10) / 10 : me.finishTime;
    const typedPreview = (args.typedPreview ?? "").slice(-80);

    const players = room.players.map((p, i) =>
      i === idx
        ? { ...p, correct, typed, wpm, accuracy, finished, finishTime, typedPreview, connected: true }
        : p
    );

    await ctx.db.patch(room._id, { players });

    if (finished && players.every((p) => p.finished)) {
      await finishRace(ctx, room._id, players, "complete");
    }

    return { correct, wpm, accuracy, finished };
  },
});

// ── Jamoa almashtirish (lobby'da) ──────────────────────────────────────
export const switchTeam = mutation({
  args: {
    code: v.string(),
    team: v.union(v.literal("A"), v.literal("B")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const room = await getRoomByCode(ctx, args.code);
    if (!room) throw new Error("Xona topilmadi");
    if (room.mode !== "team") throw new Error("Bu 1v1 xona");
    if (room.status !== "lobby") throw new Error("Jang boshlangan, jamoa almashtirib bo'lmaydi");

    const cap = Math.floor(room.maxPlayers / 2);
    const count = room.players.filter((p) => p.team === args.team).length;
    if (count >= cap) throw new Error("Bu jamoa to'lgan");

    await ctx.db.patch(room._id, {
      players: room.players.map((p) =>
        p.tokenIdentifier === stableUserId(identity) ? { ...p, team: args.team } : p
      ),
    });
  },
});

// ── Rematch (qayta jang) ──────────────────────────────────────────────
export const rematch = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Avval kirish kerak");

    const room = await getRoomByCode(ctx, args.code);
    if (!room) throw new Error("Xona topilmadi");
    if (room.status !== "finished") throw new Error("Jang hali tugamagan");
    if (!room.players.some((p) => p.tokenIdentifier === stableUserId(identity))) {
      throw new Error("Siz bu xonada emassiz");
    }

    await ctx.db.patch(room._id, {
      status: "lobby",
      text: "",
      rewardsGranted: false,
      winner: undefined,
      endedAt: undefined,
      startedAt: undefined,
      countdownEndsAt: undefined,
      players: room.players.map((p) => ({
        ...p,
        correct: 0,
        typed: 0,
        wpm: 0,
        accuracy: 100,
        finished: false,
        finishTime: undefined,
        typedPreview: undefined,
        connected: true,
      })),
    });
  },
});

// ── So'rovlar ─────────────────────────────────────────────────────────
export const getRoom = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const room = await ctx.db
      .query("rooms")
      .withIndex("by_code", (q) => q.eq("code", args.code.toUpperCase()))
      .first();
    return room ?? null;
  },
});

export const publicRooms = query({
  args: {},
  handler: async (ctx) => {
    const rooms = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .order("desc")
      .take(30);
    return rooms
      .filter((r) => r.visibility === "public" && !r.quickMatch && r.players.length < r.maxPlayers)
      .map((r) => ({
        code: r.code,
        mode: r.mode,
        players: r.players.length,
        maxPlayers: r.maxPlayers,
        host: r.players[0]?.username ?? "?",
      }));
  },
});

// ── Tashlab ketilgan quick-match xonalarni tozalash (cron orqali) ────
export const cleanupStaleRooms = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - QUICK_MATCH_CLEANUP_MS;
    const stale = await ctx.db
      .query("rooms")
      .withIndex("by_status", (q) => q.eq("status", "lobby"))
      .filter((q) => q.lt(q.field("createdAt"), cutoff))
      .take(50);
    for (const r of stale) {
      if (r.quickMatch) await ctx.db.delete(r._id);
    }
  },
});

// ── Jang natijasi: g'olib + mukofotlar (faqat SERVER hisoblaydi) ─────
async function finishRace(
  ctx: MutationCtx,
  roomId: Id<"rooms">,
  players: Player[],
  reason: "complete" | "timeout"
) {
  const room = await ctx.db.get(roomId);
  if (!room || room.rewardsGranted) return;

  const now = Date.now();
  const startedAt = room.startedAt ?? now;

  const finalPlayers: Player[] = players.map((p) => {
    const t = p.finished && p.finishTime ? p.finishTime : Math.max(1, (now - startedAt) / 1000);
    const wpm = Math.min(MAX_REPORTED_WPM, Math.round((p.correct / 5) / (t / 60)));
    return { ...p, wpm };
  });

  let winner: "A" | "B" | "draw";
  if (room.mode === "1v1") {
    const a = finalPlayers.find((p) => p.team === "A");
    const b = finalPlayers.find((p) => p.team === "B");
    if (!a || !b) {
      winner = "draw";
    } else if (a.finished && !b.finished) {
      winner = "A";
    } else if (b.finished && !a.finished) {
      winner = "B";
    } else if (a.finished && b.finished) {
      if (a.wpm !== b.wpm) winner = a.wpm > b.wpm ? "A" : "B";
      else if (a.accuracy !== b.accuracy) winner = a.accuracy > b.accuracy ? "A" : "B";
      else if ((a.finishTime ?? 999) !== (b.finishTime ?? 999)) {
        winner = (a.finishTime ?? 999) < (b.finishTime ?? 999) ? "A" : "B";
      } else winner = "draw";
    } else {
      winner = a.correct === b.correct ? "draw" : a.correct > b.correct ? "A" : "B";
    }
  } else {
    const sumA = finalPlayers.filter((p) => p.team === "A").reduce((s, p) => s + p.correct, 0);
    const sumB = finalPlayers.filter((p) => p.team === "B").reduce((s, p) => s + p.correct, 0);
    winner = sumA === sumB ? "draw" : sumA > sumB ? "A" : "B";
  }

  const is1v1 = room.mode === "1v1";

  for (const p of finalPlayers) {
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", p.tokenIdentifier))
      .first();
    if (!user) continue;

    const won = winner === "draw" ? null : p.team === winner;
    let coinGain: number;
    let xpGain: number;
    if (winner === "draw") {
      coinGain = is1v1 ? 20 : 15;
      xpGain = is1v1 ? 10 : 8;
    } else if (won) {
      coinGain = is1v1 ? 40 : 25;
      xpGain = is1v1 ? 20 : 12;
    } else {
      coinGain = is1v1 ? 10 : 10;
      xpGain = is1v1 ? 5 : 4;
    }

    await ctx.db.patch(user._id, {
      coins: user.coins + coinGain,
      xp: user.xp + xpGain,
      races: user.races + 1,
      wins: winner === "draw" ? user.wins : won ? user.wins + 1 : user.wins,
      losses: winner === "draw" ? user.losses : won ? user.losses : user.losses + 1,
      draws: winner === "draw" ? user.draws + 1 : user.draws,
      bestWpm: Math.max(user.bestWpm ?? 0, p.wpm),
      lastSeen: now,
    });
  }

  await ctx.db.patch(roomId, {
    status: "finished",
    endedAt: now,
    winner,
    rewardsGranted: true,
    players: finalPlayers,
  });
}
