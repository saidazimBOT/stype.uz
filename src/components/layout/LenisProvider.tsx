"use client";

import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Lenis smooth scroll — butun sayt uchun silliq skrol.
 * Modal ochilganda body lock bo'lganda Lenis ham to'xtaydi.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      touchMultiplier: 2,
      infinite: false,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    // MutationObserver — body.style.overflow o'zgarsa Lenis'ni to'xtat/yurit
    const observer = new MutationObserver(() => {
      const isLocked = document.body.style.overflow === "hidden" || document.body.style.position === "fixed";
      if (isLocked) {
        lenis.stop();
      } else {
        lenis.start();
      }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    return () => {
      cancelAnimationFrame(rafId);
      observer.disconnect();
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return <>{children}</>;
}
