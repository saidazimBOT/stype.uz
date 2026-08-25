"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Lenis silliq skrol.
 *
 * MUHIM: bu ilova `h-dvh` app-shell — hujjatning O'ZI hech qachon skroll
 * bo'lmaydi (`document.documentElement.scrollHeight === clientHeight`).
 * Shuning uchun Lenis'ni `window` ga ulash hech narsa bermaydi: u ulanadi,
 * `html` ga `lenis` klassini qo'yadi va jim turadi. Haqiqiy skroll ichki
 * konteynerlarda — sidebar (`aside`) va har bir view'ning `overflow-y-auto`
 * bloki.
 *
 * Shu sababli bu yerda har bir skroll konteyneriga alohida Lenis ulanadi.
 * View almashganda DOM o'zgaradi, shuning uchun MutationObserver yangi
 * konteynerlarni ulaydi va o'chib ketganlarini tozalaydi.
 */

/** Tailwind'dagi skroll konteynerlari — kodda aynan shu klasslar ishlatiladi */
const SCROLLER_SELECTOR = ".overflow-y-auto, .overflow-auto, .overflow-y-scroll";

const LENIS_OPTIONS = {
  duration: 1.2,
  easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  touchMultiplier: 2,
} as const;

export default function LenisProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Eslatma: "harakatni kamaytirish" (prefers-reduced-motion) sozlamasini
    // Lenis O'ZI hisobga oladi — `respectReducedMotion` sukut bo'yicha yoqilgan.
    // U silliqlashni o'chiradi, lekin skrolning o'zi ishlab turaveradi. Shuning
    // uchun bu yerda qo'shimcha tekshiruv qilmaymiz: aks holda o'sha sozlamasi
    // yoqilgan foydalanuvchida skroll umuman ishlamay qolardi.

    const instances = new Map<HTMLElement, Lenis>();
    let rafId = 0;
    let syncTimer = 0;

    /** Konteynerga Lenis ulash (wrapper va content bir xil — element o'zi skroller) */
    const attach = (el: HTMLElement) => {
      if (instances.has(el)) return;
      instances.set(el, new Lenis({ wrapper: el, content: el, ...LENIS_OPTIONS }));
    };

    const detach = (el: HTMLElement) => {
      instances.get(el)?.destroy();
      instances.delete(el);
    };

    /** Yangi konteynerlarni ulaymiz, DOM'dan olib tashlanganlarini tozalaymiz */
    const sync = () => {
      syncTimer = 0;

      for (const el of document.querySelectorAll<HTMLElement>(SCROLLER_SELECTOR)) {
        // Hozircha sig'ib turgan bo'lsa ham ulaymiz — kontent keyin o'sishi mumkin
        attach(el);
      }

      for (const el of [...instances.keys()]) {
        if (!el.isConnected) detach(el);
      }
    };

    /**
     * MutationObserver ko'p marta chaqiriladi — chaqiruvlarni yig'amiz.
     * Ataylab setTimeout: requestAnimationFrame fon tabida umuman ishlamaydi,
     * u bilan debounce qilinsa yangi konteynerlar ulanmay qolardi.
     */
    const queueSync = () => {
      if (syncTimer) return;
      syncTimer = window.setTimeout(sync, 100);
    };

    sync();

    // Bitta RAF halqasi barcha instansiyalarni yuritadi
    const raf = (time: number) => {
      for (const lenis of instances.values()) lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // View almashishi / modal ochilishi — yangi konteynerlar paydo bo'ladi
    const domObserver = new MutationObserver(queueSync);
    domObserver.observe(document.body, { childList: true, subtree: true });

    // Modal ochilganda body lock bo'ladi — o'shanda Lenis ham to'xtaydi
    const lockObserver = new MutationObserver(() => {
      const locked =
        document.body.style.overflow === "hidden" || document.body.style.position === "fixed";
      for (const lenis of instances.values()) {
        if (locked) lenis.stop();
        else lenis.start();
      }
    });
    lockObserver.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      cancelAnimationFrame(rafId);
      if (syncTimer) window.clearTimeout(syncTimer);
      domObserver.disconnect();
      lockObserver.disconnect();
      for (const el of [...instances.keys()]) detach(el);
    };
  }, []);

  return <>{children}</>;
}
