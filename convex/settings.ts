import { query } from "./_generated/server";

// Oddiy foydalanuvchilar ham ko'rishi mumkin bo'lgan sozlamalar
export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const s = await ctx.db.query("settings").first();
    return {
      siteName: s?.siteName || "STypeUz",
      logo: s?.logo || "",
      maintenanceMode: !!s?.maintenanceMode,
      maintenanceMessage: s?.maintenanceMessage || "",
      announcementsEnabled: s ? !!s.announcementsEnabled : true,
      registrationOpen: s ? !!s.registrationOpen : true,
    };
  },
});

// Hozirda faol e'lonlar (barcha foydalanuvchilarga ko'rsatiladi)
export const publicAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const s = await ctx.db.query("settings").first();
    if (s && !s.announcementsEnabled) return [];
    const now = Date.now();
    const all = await ctx.db.query("announcements").collect();
    return all
      .filter(
        (a: any) =>
          a.enabled &&
          (a.scheduledFor ?? 0) <= now &&
          (!a.expiresAt || a.expiresAt > now)
      )
      .sort(
        (a: any, b: any) =>
          (a.scheduledFor ?? a.createdAt) - (b.scheduledFor ?? b.createdAt)
      )
      .map((a: any) => ({
        _id: a._id,
        title: a.title,
        body: a.body,
        scheduledFor: a.scheduledFor ?? null,
      }));
  },
});
