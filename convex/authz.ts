import type { MutationCtx, QueryCtx } from "./_generated/server";

export type Role = "user" | "admin" | "owner";

export interface CurrentUser {
  identity: {
    tokenIdentifier: string;
    subject: string;
    [k: string]: unknown;
  };
  user: {
    _id: unknown;
    tokenIdentifier: string;
    username?: string;
    role?: Role;
    banned?: boolean;
    [k: string]: unknown;
  };
}

/**
 * Barqaror foydalanuvchi identifikatori.
 *
 * DIQQAT: Convex Auth'da `identity.tokenIdentifier` sessiyaga bog'liq
 * (`sub` = `userId|sessionId`), shuning uchun u har yangi sessiyada o'zgaradi.
 * Profillarni saqlash va qidirishda `users` jadvalining `_id` si bilan mos
 * keladigan BARQAROR qismdan (`userId`) foydalanamiz.
 */
export function stableUserId(identity: { subject: string }): string {
  return identity.subject.split("|")[0];
}

export async function getCurrentUser(
  ctx: QueryCtx | MutationCtx
): Promise<CurrentUser | null> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) return null;
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q: any) =>
      q.eq("tokenIdentifier", stableUserId(identity))
    )
    .first();
  if (!user) return null;
  return { identity, user };
}

export async function getAdminUser(
  ctx: QueryCtx | MutationCtx
): Promise<CurrentUser | null> {
  const cur = await getCurrentUser(ctx);
  if (!cur) return null;
  const role = cur.user.role ?? "user";
  if (role !== "admin" && role !== "owner") return null;
  if (cur.user.banned) return null;
  return cur;
}

export async function requireAdmin(
  ctx: MutationCtx | QueryCtx
): Promise<CurrentUser> {
  const admin = await getAdminUser(ctx);
  if (!admin) throw new Error("Admin ruxsati talab qilinadi");
  return admin;
}

export function isAdminRole(role?: string): boolean {
  return role === "admin" || role === "owner";
}

export function displayName(u: { username?: string } | null | undefined): string {
  const n = (u?.username || "").trim();
  return n || "player";
}
