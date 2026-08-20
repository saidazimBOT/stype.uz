/**
 * Katta sonlarni qisqa formatga o'giradi:
 *   1234      → "1.2K"
 *   1234567   → "1.2M"
 *   1234567890→ "1.2B"
 *   Agar raqam 1000 dan kichik bo'lsa — avtomatik to'ldirilmaydi.
 */
export function formatCoin(value: number): string {
  if (value < 1000) return String(value);

  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (abs >= 1e12) return sign + (abs / 1e12).toFixed(1).replace(/\.0$/, "") + "T";
  if (abs >= 1e9)  return sign + (abs / 1e9).toFixed(1).replace(/\.0$/, "") + "B";
  if (abs >= 1e6)  return sign + (abs / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (abs >= 1e3)  return sign + (abs / 1e3).toFixed(1).replace(/\.0$/, "") + "K";

  return String(value);
}
