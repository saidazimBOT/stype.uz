import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

/**
 * Avtomatik tozalash vazifalari.
 *
 * Chat xabarlari 7 kundan eskirgach o'chiriladi — har 12 soatda ishlaydi,
 * shuning uchun xabarlar bazada abadiy to'planib qolmaydi.
 * Tozalash muddati: convex/chat.ts dagi CHAT_RETENTION_MS (hozir 7 kun).
 */
const crons = cronJobs();

crons.interval(
  "chat-old-messages-cleanup",
  { hours: 12 },
  internal.chat.cleanupOldMessages
);

// Tashlab ketilgan quick-match xonalarni tozalash — har soatda ishlaydi
crons.interval(
  "stale-quick-match-rooms-cleanup",
  { hours: 1 },
  internal.rooms.cleanupStaleRooms
);

export default crons;
