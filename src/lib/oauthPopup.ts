/**
 * Google OAuth popup yordamchilari.
 *
 * Avval kirish to'liq redirect orqali edi: sahifa Google'ga ketib, keyin
 * qaytib kelardi — bu brauzerda "hard refresh" bo'lib ko'rinardi (splash
 * qaytadan, yozilgan test yo'qoladi). Endi Google alohida kichik oynada
 * ochiladi, sessiya esa localStorage + BroadcastChannel orqali asosiy
 * oynaga o'zi yetib boradi — asosiy sahifa umuman yangilanmaydi.
 */

/** Popup oynasining nomi — oynaning o'zi shu nom orqali "men popupman" deb biladi. */
export const GOOGLE_POPUP_NAME = "stype_google_oauth";

/** Joriy oyna — Google OAuth uchun ochilgan popupmi? */
export function isOAuthPopup(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return !!window.opener && window.name === GOOGLE_POPUP_NAME;
  } catch {
    return false;
  }
}
