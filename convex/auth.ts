import { convexAuth } from "@convex-dev/auth/server";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Anonymous({
      // Auth kutubxonasi `users` jadvaliga profil yozadi — app sxemasining
      // barcha majburiy maydonlarini default qiymatlar bilan to'ldiramiz,
      // aks holda schema validatsiyasi o'tmaydi.
      profile: () => ({
        isAnonymous: true,
        tokenIdentifier: "", // createOrUpdateUser o'z id bilan almashtiradi
        avatar: "avatar_default",
        coins: 50,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        races: 0,
        lastSeen: Date.now(),
      }),
    }),
  ],
  callbacks: {
    // App profilini BARQAROR identifikator bilan bog'laymiz.
    // Convex Auth'da `identity.tokenIdentifier` sessiyaga bog'liq
    // (`sub` = `userId|sessionId`), shuning uchun `users` jadvalidagi
    // `tokenIdentifier` maydoniga foydalanuvchining o'z `_id` sini yozamiz
    // va barcha qidiruvlar ham shu barqaror qiymat bo'yicha olib boriladi.
    createOrUpdateUser: async (ctx, { existingUserId }) => {
      if (existingUserId) return existingUserId;
      const id = await ctx.db.insert("users", {
        tokenIdentifier: "", // quyida o'z id bilan almashtiriladi (bir txn ichida)
        avatar: "avatar_default",
        coins: 50,
        xp: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        races: 0,
        lastSeen: Date.now(),
      });
      await ctx.db.patch(id, { tokenIdentifier: id });
      return id;
    },
    // Ban qilingan foydalanuvchi tizimga kira olmaydi.
    beforeSessionCreation: async (ctx, { userId }) => {
      const user = await ctx.db.get("users", userId);
      if (user?.banned) throw new Error("Sizning hisobingiz bloklangan");
    },
  },
});
