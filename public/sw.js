/**
 * STypeUz — PWA Service Worker
 *
 * Network-first strategiya: avval tarmoqdan oladi, muvaffaqiyatsiz bo'lsa
 * cache'dan beradi. offline'da ham ishlaydi.
 *
 * Cache strukturasi:
 *   - sw-cache-v1: App shell (HTML, CSS, JS, rasmlar)
 *   - sw-fonts: Google shriftlari
 */

const CACHE_VERSION = "sw-cache-v1";
const FONT_CACHE = "sw-fonts";

// App shell — bu resurslar cache'lanadi
const APP_SHELL = [
  "/",
  "/favicon.svg",
  "/favicon.png",
  "/favicon-16.png",
  "/favicon-32.png",
  "/favicon-48.png",
  "/icon-192.svg",
  "/icon-512.svg",
  "/og-image.png",
  "/apple-touch-icon.png",
];

// ── INSTALL ───────────────────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      await cache.addAll(APP_SHELL);
      // Yangi versiya darhol ishlashga tayyor
      await self.skipWaiting();
    })()
  );
});

// ── ACTIVATE ──────────────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // Eski cache'larni tozalash
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== CACHE_VERSION && key !== FONT_CACHE)
          .map((key) => caches.delete(key))
      );
      // Barcha ochiq oynalarni yangilash
      await self.clients.claim();
    })()
  );
});

// ── FETCH — Network-first strategiya ──────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;

  // GET so'rovlari uchun network-first
  if (request.method !== "GET") return;

  // Chrome extension yoki boshqa non-http so'rovlarni o'tkazib yuboramiz
  if (!request.url.startsWith("http")) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const url = new URL(request.url);

  // Google shriftlari — cache-first (tez)
  if (url.hostname.includes("fonts.googleapis.com") || url.hostname.includes("fonts.gstatic.com")) {
    return fontCacheFirst(request);
  }

  // API so'rovlari — faqat tarmoq (cache qilmaymiz)
  if (url.pathname.startsWith("/api/")) {
    return fetch(request);
  }

  // Boshqa hamma narsa — network-first
  try {
    const response = await fetch(request);

    // Faqat muvaffaqiyatli JDR so'rovlarini cache'laymiz
    if (response.ok && request.url.startsWith(self.location.origin)) {
      const cache = await caches.open(CACHE_VERSION);
      cache.put(request, response.clone());
    }

    return response;
  } catch {
    // Tarmoq yo'q — cache'dan qidiramiz
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline HTML fallback
    if (request.headers.get("accept")?.includes("text/html")) {
      const offlinePage = await caches.match("/");
      if (offlinePage) return offlinePage;
    }

    // Hech narsa topilmasa — xatolik
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function fontCacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(FONT_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response("", { status: 503 });
  }
}
