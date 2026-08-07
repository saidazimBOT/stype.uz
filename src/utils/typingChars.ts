// Klaviaturada yozib bo'lmaydigan belgilar uchun yordamchi funksiyalar.
//
// Rus va o'zbek matnlarida "—" (uzun tire, U+2014) ishlatiladi, lekin fizik
// klaviaturada faqat "-" (defis) tugmasi bor. Shuning uchun barcha tire
// turlarini bir-biriga teng deb hisoblaymiz — aks holda tire "yozib bo'lmaydi".

const DASH_CHARS = new Set(["-", "–", "—", "−", "‐", "‑", "‒"]);

/** Bu belgi tire turlaridan biri ekanligini tekshiradi. */
export function isDashChar(ch: string): boolean {
  return ch.length === 1 && DASH_CHARS.has(ch);
}

/**
 * Ikki belgi "bir xil" deb hisoblanadimi?
 * Tire turlari (defis, en-dash, em-dash, minus, ...) o'zaro teng.
 */
export function charsEqual(a: string, b: string): boolean {
  return a === b || (isDashChar(a) && isDashChar(b));
}
