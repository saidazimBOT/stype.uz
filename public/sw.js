/**
 * O'Z-O'ZINI O'CHIRUVCHI SERVICE WORKER.
 *
 * Eski versiyada bu fayl "cache-first" strategiya bilan ishlardi va `/` ni
 * ham cache'ga solardi. Oqibati:
 *   - dev (localhost:3000) — Next eski build ID'ni ko'rib sahifani
 *     to'xtovsiz qayta yuklardi (cheksiz refresh halqasi);
 *   - prod — foydalanuvchi saytning eski nusxasida qotib qolardi.
 *
 * Hozir ilovada hech qayerda `serviceWorker.register()` chaqirilmaydi, ya'ni
 * bu worker faqat eski tashriflardan qolgan. Shuning uchun u endi hech narsani
 * cache qilmaydi: barcha cache'larni tozalaydi, o'zini ro'yxatdan chiqaradi va
 * ochiq sahifalarni bir marta yangilaydi.
 *
 * PWA/oflayn rejim kerak bo'lsa — YANGI nom bilan (masalan `sw-v4.js`),
 * network-first strategiya va aniq `register()` bilan yoziladi.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Barcha eski cache'larni o'chiramiz
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      // O'zimizni ro'yxatdan chiqaramiz
      await self.registration.unregister();
      // Ochiq oynalarni bir marta yangilaymiz — endi ular workersiz ishlaydi
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) {
        client.navigate(client.url);
      }
    })(),
  );
});

// Hech narsa ushlanmaydi — barcha so'rovlar to'g'ridan-to'g'ri tarmoqqa ketadi.
