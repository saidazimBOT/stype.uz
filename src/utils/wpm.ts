/**
 * WPM (words per minute) hisoblash utilitlari.
 *
 * Standart Net WPM formulasi:
 *
 *   Net WPM = (To'g'ri kiritilgan belgilar / 5) / (O'tgan vaqt daqiqada)
 *
 * Qoidalar:
 *  - Faqat TO'G'RI kiritilgan belgilar sanaladi — xato harflar WPM ni
 *    oshirmaydi (aniqlik talabi).
 *  - Vaqt HAQIQIY o'tgan soniyalardan olinadi — taymer teskari sanashidan
 *    emas, shuning uchun WPM taymer rejimida ham orqaga ketmaydi.
 *  - Dastlabki 1 soniya ichida absurd qiymat chiqmasligi uchun vaqt
 *    kamida 1 soniya deb olinadi (masalan: 2 ta harf, 0.2 soniyada →
 *    (2/5)/(0.2/60) = 120 WPM bo'lib qolmasligi uchun).
 */

/**
 * Standart Net WPM ni hisoblaydi.
 *
 * @param correctChars - To'g'ri kiritilgan belgilar soni (xatolar KIRMAYDI)
 * @param elapsedMs - Test boshlanganidan beri o'tgan haqiqiy vaqt (millisekund)
 * @returns Butun WPM qiymati (0..300)
 */
export function calcNetWpm(correctChars: number, elapsedMs: number): number {
  const elapsedMin = Math.max(elapsedMs, 1000) / 60000; // kamida 1 soniya
  if (correctChars <= 0 || elapsedMin <= 0) return 0;
  const wpm = (correctChars / 5) / elapsedMin;
  return Math.min(300, Math.max(0, Math.round(wpm)));
}

/**
 * Jonli WPM ko'rsatkichi — FAQAT YUQORIGA boradi (teskari sanamaydi).
 *
 * Har bir klavisha bosilganda hisoblanadi va avvalgi qiymatdan katta bo'lsa
 * yangilanadi; kichik bo'lsa eski qiymat saqlanadi. Shuning uchun pauza
 * qilinganda yoki sekin yozilganda WPM pasayib ketmaydi.
 *
 * @param prevWpm - Hozirgi ko'rsatilayotgan WPM
 * @param correctChars - Hozirgi to'g'ri belgilar soni
 * @param elapsedMs - O'tgan haqiqiy vaqt (millisekund)
 * @returns Yangilanadigan WPM (har doim prevWpm dan katta yoki teng)
 */
export function nextLiveWpm(prevWpm: number, correctChars: number, elapsedMs: number): number {
  return Math.max(prevWpm, calcNetWpm(correctChars, elapsedMs));
}
