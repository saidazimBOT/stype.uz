import type { LeaderboardEntry } from "../types";

// Global leaderboard data with countries
export const LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, name: "SpeedKing_99", country: "🇺🇸", countryName: "USA", wpm: 247, acc: 99, lang: "en", avatar: "SK", color: "#a78bfa" },
  { rank: 2, name: "NightTyper", country: "🇩🇪", countryName: "Germany", wpm: 231, acc: 98, lang: "en", avatar: "NT", color: "#22c55e" },
  { rank: 3, name: "FingerBlitz", country: "🇰🇷", countryName: "Korea", wpm: 219, acc: 97, lang: "en", avatar: "FB", color: "#f59e0b" },
  { rank: 4, name: "BystryePaltsy", country: "🇷🇺", countryName: "Russia", wpm: 208, acc: 99, lang: "ru", avatar: "BP", color: "#38bdf8" },
  { rank: 5, name: "UzbekEagle", country: "🇺🇿", countryName: "Uzbekistan", wpm: 196, acc: 98, lang: "uz", avatar: "UE", color: "#ec4899", isMe: true },
  { rank: 6, name: "TastyKeys", country: "🇯🇵", countryName: "Japan", wpm: 189, acc: 96, lang: "en", avatar: "TK", color: "#f59e0b" },
  { rank: 7, name: "KlavaVirtuoz", country: "🇷🇺", countryName: "Russia", wpm: 182, acc: 97, lang: "ru", avatar: "KV", color: "#a78bfa" },
  { rank: 8, name: "ToshkentTyper", country: "🇺🇿", countryName: "Uzbekistan", wpm: 174, acc: 95, lang: "uz", avatar: "TT", color: "#22c55e" },
  { rank: 9, name: "TypeMaestro", country: "🇬🇧", countryName: "UK", wpm: 168, acc: 98, lang: "en", avatar: "TM", color: "#38bdf8" },
  { rank: 10, name: "QuickFingers_X", country: "🇫🇷", countryName: "France", wpm: 161, acc: 96, lang: "en", avatar: "QF", color: "#ec4899" },
  { rank: 11, name: "TypeWizard", country: "🇨🇦", countryName: "Canada", wpm: 158, acc: 97, lang: "en", avatar: "TW", color: "#f97316" },
  { rank: 12, name: "FastFingers", country: "🇦🇺", countryName: "Australia", wpm: 153, acc: 95, lang: "en", avatar: "FF", color: "#10b981" },
  { rank: 13, name: "TastaturTitan", country: "🇦🇹", countryName: "Austria", wpm: 148, acc: 96, lang: "de", avatar: "TT", color: "#6366f1" },
  { rank: 14, name: "TeclaRapida", country: "🇪🇸", countryName: "Spain", wpm: 144, acc: 95, lang: "es", avatar: "TR", color: "#ef4444" },
  { rank: 15, name: "ToucheVitesse", country: "🇫🇷", countryName: "France", wpm: 139, acc: 94, lang: "fr", avatar: "TV", color: "#ff0080" },
  { rank: 16, name: "DesiDactyl", country: "🇮🇳", countryName: "India", wpm: 134, acc: 95, lang: "en", avatar: "DD", color: "#f97316" },
  { rank: 17, name: "TeclaTropical", country: "🇧🇷", countryName: "Brazil", wpm: 131, acc: 94, lang: "pt", avatar: "TT", color: "#22d3ee" },
  { rank: 18, name: "MiddleEastTyper", country: "🇦🇪", countryName: "UAE", wpm: 127, acc: 95, lang: "en", avatar: "ME", color: "#84cc16" },
  { rank: 19, name: "SchnelleFinger", country: "🇨🇭", countryName: "Switzerland", wpm: 124, acc: 96, lang: "de", avatar: "SF", color: "#f43f5e" },
  { rank: 20, name: "HizliEller", country: "🇹🇷", countryName: "Turkey", wpm: 121, acc: 93, lang: "tr", avatar: "HE", color: "#eab308" },
  { rank: 21, name: "QazaqKeys", country: "🇰🇿", countryName: "Kazakhstan", wpm: 117, acc: 94, lang: "ru", avatar: "QK", color: "#06b6d4" },
  { rank: 22, name: "SnelleVingers", country: "🇳🇱", countryName: "Netherlands", wpm: 114, acc: 95, lang: "nl", avatar: "SV", color: "#a3e635" },
  { rank: 23, name: "SzybkiePalce", country: "🇵🇱", countryName: "Poland", wpm: 111, acc: 94, lang: "pl", avatar: "SP", color: "#fb7185" },
  { rank: 24, name: "NordicKeys", country: "🇸🇪", countryName: "Sweden", wpm: 108, acc: 95, lang: "sv", avatar: "NK", color: "#818cf8" },
  { rank: 25, name: "ShvidkiPaltsi", country: "🇺🇦", countryName: "Ukraine", wpm: 105, acc: 93, lang: "uk", avatar: "UA", color: "#facc15" },
];

export const COUNTRY_LIST: { flag: string; name: string }[] = [
  ...new Set(LEADERBOARD.map((p) => ({ flag: p.country, name: p.countryName }))),
];

export const LANG_FILTERS: string[] = ["all", "en", "ru", "uz", "de", "es", "fr"];
