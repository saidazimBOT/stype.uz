import type { IconType } from "react-icons";
import { FiZap, FiStar, FiSun, FiMoon, FiHeart } from "react-icons/fi";
import { FaCrown, FaGem, FaFire, FaBolt, FaRocket } from "react-icons/fa6";
import { GiSparkles, GiSwordsPower, GiCrystalBall, GiLaserBurst } from "react-icons/gi";

// ── Shop Item Types ─────────────────────────────────────────────────────
export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  icon?: IconType;
  color?: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  preview?: string;
}

export type ShopCategory = "themes" | "avatars" | "effects";

// ── Theme Unlock Prices ─────────────────────────────────────────────────
// Classic themes are FREE, Premium themes cost coins
export const THEME_SHOP: ShopItem[] = [
  // Classic — free (everyone has)
  { id: "default", name: "Default Purple", desc: "Classic purple theme", price: 0, color: "#a78bfa", rarity: "common" },
  { id: "gold", name: "Royal Gold", desc: "Golden elegance", price: 0, color: "#f59e0b", rarity: "common" },
  { id: "pink", name: "Neon Pink", desc: "Vibrant pink", price: 0, color: "#ec4899", rarity: "common" },
  { id: "blue", name: "Ocean Blue", desc: "Deep ocean blue", price: 0, color: "#38bdf8", rarity: "common" },
  { id: "green", name: "Forest Green", desc: "Natural green", price: 0, color: "#22c55e", rarity: "common" },
  // Dark Premium
  { id: "midnight", name: "Midnight", desc: "Deep night vibes", price: 50, color: "#6366f1", rarity: "rare" },
  { id: "cyberpunk", name: "Cyberpunk", desc: "Neon futuristic", price: 100, color: "#ff0080", rarity: "epic" },
  { id: "matrix", name: "Matrix", desc: "Digital rain green", price: 100, color: "#00ff41", rarity: "epic" },
  { id: "sunset", name: "Sunset", desc: "Warm orange glow", price: 75, color: "#ff6b35", rarity: "rare" },
  { id: "nord", name: "Nord", desc: "Scandinavian cool", price: 80, color: "#88c0d0", rarity: "rare" },
  { id: "dracula", name: "Dracula", desc: "Vampire dark mode", price: 120, color: "#bd93f9", rarity: "epic" },
  { id: "tokyo", name: "Tokyo Night", desc: "Tokyo city lights", price: 90, color: "#7aa2f7", rarity: "rare" },
  { id: "synthwave", name: "Synthwave", desc: "Retro wave vibes", price: 150, color: "#ff7edb", rarity: "legendary" },
  { id: "darkruby", name: "Dark Ruby", desc: "Crimson darkness", price: 130, color: "#ff2040", rarity: "epic" },
  { id: "emerald", name: "Emerald", desc: "Precious green", price: 110, color: "#10b981", rarity: "epic" },
  { id: "amethyst", name: "Amethyst", desc: "Purple gemstone", price: 140, color: "#c084fc", rarity: "legendary" },
  // Light
  { id: "light", name: "Pure Light", desc: "Clean minimal light", price: 0, color: "#7c3aed", rarity: "common" },
  { id: "warm", name: "Warm Paper", desc: "Cozy paper feel", price: 0, color: "#d97706", rarity: "common" },
  { id: "sakura", name: "Sakura", desc: "Cherry blossom pink", price: 0, color: "#e04098", rarity: "common" },
  { id: "mint", name: "Fresh Mint", desc: "Cool minty fresh", price: 0, color: "#059669", rarity: "common" },
  { id: "sky", name: "Clear Sky", desc: "Bright blue sky", price: 0, color: "#2563eb", rarity: "common" },
  { id: "peachy", name: "Peachy", desc: "Sweet peach tone", price: 0, color: "#f97316", rarity: "common" },
  // VS Code
  { id: "vscode_dark", name: "VS Code Dark", desc: "Classic VS Code", price: 0, color: "#007acc", rarity: "common" },
  { id: "vscode_light", name: "VS Code Light", desc: "VS Code light mode", price: 0, color: "#0066b8", rarity: "common" },
  { id: "one_dark", name: "One Dark Pro", desc: "Popular editor theme", price: 60, color: "#61afef", rarity: "rare" },
  { id: "monokai", name: "Monokai", desc: "Classic Monokai colors", price: 70, color: "#a6e22e", rarity: "rare" },
  { id: "github", name: "GitHub Dark", desc: "GitHub inspired", price: 0, color: "#58a6ff", rarity: "common" },
  { id: "cobalt", name: "Cobalt", desc: "Deep blue editor", price: 80, color: "#ff9d00", rarity: "rare" },
  { id: "material", name: "Material", desc: "Material Design colors", price: 0, color: "#80cbc4", rarity: "common" },
];

// ── Avatar Items ────────────────────────────────────────────────────────
export const AVATAR_SHOP: ShopItem[] = [
  { id: "avatar_default", name: "Basic Avatar", desc: "Simple animated face", price: 0, icon: FiZap, color: "#a78bfa", rarity: "common" },
  { id: "avatar_crown", name: "Crown Avatar", desc: "Royal golden crown", price: 80, icon: FaCrown, color: "#f59e0b", rarity: "rare" },
  { id: "avatar_star", name: "Star Avatar", desc: "Glittering star aura", price: 60, icon: FiStar, color: "#22c55e", rarity: "rare" },
  { id: "avatar_fire", name: "Fire Avatar", desc: "Blazing fire spirit", price: 120, icon: FaFire, color: "#ef4444", rarity: "epic" },
  { id: "avatar_gem", name: "Gem Avatar", desc: "Precious diamond glow", price: 150, icon: FaGem, color: "#38bdf8", rarity: "legendary" },
  { id: "avatar_bolt", name: "Lightning Avatar", desc: "Electric energy bolt", price: 100, icon: FaBolt, color: "#f59e0b", rarity: "epic" },
  { id: "avatar_rocket", name: "Rocket Avatar", desc: "Blasting off to space", price: 200, icon: FaRocket, color: "#ec4899", rarity: "legendary" },
  { id: "avatar_crystal", name: "Crystal Avatar", desc: "Mystical crystal orb", price: 130, icon: GiCrystalBall, color: "#a78bfa", rarity: "epic" },
  { id: "avatar_sparkle", name: "Sparkle Avatar", desc: "Magical sparkles", price: 90, icon: GiSparkles, color: "#f59e0b", rarity: "rare" },
  { id: "avatar_moon", name: "Moon Avatar", desc: "Lunar nighttime glow", price: 70, icon: FiMoon, color: "#88c0d0", rarity: "rare" },
  { id: "avatar_sun", name: "Sun Avatar", desc: "Bright sunny warmth", price: 50, icon: FiSun, color: "#f59e0b", rarity: "common" },
  { id: "avatar_heart", name: "Heart Avatar", desc: "Loving pink aura", price: 40, icon: FiHeart, color: "#ec4899", rarity: "common" },
];

// ── Effect Items ────────────────────────────────────────────────────────
export interface EffectItem extends ShopItem {
  effectType: "particle" | "cursor" | "screen" | "combo";
}

export const EFFECT_SHOP: EffectItem[] = [
  { id: "fx_sparkle", name: "Sparkle Trail", desc: "Golden sparkle particles on keystroke", price: 0, color: "#f59e0b", rarity: "common", effectType: "particle" },
  { id: "fx_fire", name: "Fire Trail", desc: "Burning fire particles on keystroke", price: 100, icon: FaFire, color: "#ef4444", rarity: "epic", effectType: "particle" },
  { id: "fx_rainbow", name: "Rainbow Trail", desc: "Colorful rainbow keystroke particles", price: 150, icon: GiSparkles, color: "#ec4899", rarity: "legendary", effectType: "particle" },
  { id: "fx_ice", name: "Ice Trail", desc: "Cool blue ice crystal particles", price: 80, icon: GiCrystalBall, color: "#38bdf8", rarity: "rare", effectType: "particle" },
  { id: "fx_neon", name: "Neon Cursor", desc: "Glowing neon cursor bar", price: 60, color: "#ff0080", rarity: "rare", effectType: "cursor" },
  { id: "fx_pulse", name: "Pulse Cursor", desc: "Pulsing heartbeat cursor", price: 90, icon: FiHeart, color: "#ec4899", rarity: "rare", effectType: "cursor" },
  { id: "fx_screen_glow", name: "Screen Glow", desc: "Subtle ambient screen glow", price: 120, icon: FaGem, color: "#a78bfa", rarity: "epic", effectType: "screen" },
  { id: "fx_combo_fire", name: "Combo Inferno", desc: "Fire burst on high combos", price: 200, icon: FaRocket, color: "#ff6b35", rarity: "legendary", effectType: "combo" },
];

// ── Rarity Colors ───────────────────────────────────────────────────────
export const RARITY_COLORS: Record<string, string> = {
  common: "#9ca3af",
  rare: "#38bdf8",
  epic: "#a78bfa",
  legendary: "#f59e0b",
};

export const RARITY_LABELS: Record<string, string> = {
  common: "Common",
  rare: "Rare",
  epic: "Epic",
  legendary: "Legendary",
};

// ── Avatar Lookup Helper ─────────────────────────────────────────────────
export function getAvatarInfo(avatarId: string): { icon: IconType; color: string; name: string } {
  const item = AVATAR_SHOP.find((a) => a.id === avatarId);
  if (item && item.icon) {
    return { icon: item.icon, color: item.color || "#a78bfa", name: item.name };
  }
  // Default: use FiZap
  return { icon: FiZap, color: "#a78bfa", name: "Basic Avatar" };
}

// ── Coin earning rates ──────────────────────────────────────────────────
export const COIN_RATES = {
  /** coins earned per WPM in a typing test */
  perWpm: 1,
  /** bonus coins for 95%+ accuracy */
  highAccuracyBonus: 5,
  /** coins per game score point */
  perGameScore: 1,
  /** coins for completing a combo of 20+ */
  comboBonus: 10,
};
