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

export type ShopCategory = "themes" | "avatars" | "hero" | "watches" | "effects";

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

// ── Hero Items (wearable) ───────────────────────────────────────────────
export type HeroSlot = "hat" | "glasses" | "outfit" | "watch";

export interface HeroEquip {
  hat: string;
  glasses: string;
  outfit: string;
  watch: string;
}

export interface HeroShopItem extends ShopItem {
  slot: HeroSlot;
}

export const HERO_SLOT_LABELS: Record<HeroSlot, string> = {
  hat: "Hats",
  glasses: "Glasses",
  outfit: "Outfits",
  watch: "Watches",
};

export const DEFAULT_HERO_EQUIP: HeroEquip = {
  hat: "hero_hat_none",
  glasses: "hero_glasses_none",
  outfit: "hero_outfit_none",
  watch: "hero_watch_none",
};

export const HERO_SHOP: HeroShopItem[] = [
  // ── Hats ──
  { id: "hero_hat_none", name: "No Hat", desc: "Default look", price: 0, slot: "hat", color: "#9ca3af", rarity: "common" },
  { id: "hero_cap", name: "Baseball Cap", desc: "Sporty sky-blue cap", price: 30, slot: "hat", color: "#38bdf8", rarity: "common" },
  { id: "hero_beanie", name: "Cozy Beanie", desc: "Warm winter beanie", price: 25, slot: "hat", color: "#ec4899", rarity: "rare" },
  { id: "hero_halo", name: "Angel Halo", desc: "Floating golden halo", price: 40, slot: "hat", color: "#fbbf24", rarity: "rare" },
  { id: "hero_wizard", name: "Wizard Hat", desc: "Magical pointed hat", price: 50, slot: "hat", color: "#a78bfa", rarity: "epic" },
  { id: "hero_crown", name: "Golden Crown", desc: "Royal golden crown 👑", price: 80, slot: "hat", color: "#f59e0b", rarity: "legendary" },
  // ── Glasses ──
  { id: "hero_glasses_none", name: "No Glasses", desc: "Default look", price: 0, slot: "glasses", color: "#9ca3af", rarity: "common" },
  { id: "hero_rounds", name: "Round Glasses", desc: "Classic nerd style", price: 20, slot: "glasses", color: "#e5e7eb", rarity: "common" },
  { id: "hero_sunglasses", name: "Sunglasses", desc: "Cool black shades", price: 35, slot: "glasses", color: "#111827", rarity: "rare" },
  { id: "hero_star", name: "Star Glasses", desc: "Shining star shades", price: 45, slot: "glasses", color: "#f59e0b", rarity: "rare" },
  { id: "hero_visor", name: "Cyber Visor", desc: "Futuristic neon visor", price: 60, slot: "glasses", color: "#22d3ee", rarity: "epic" },
  // ── Outfits ──
  { id: "hero_outfit_none", name: "Default Shirt", desc: "Basic t-shirt", price: 0, slot: "outfit", color: "#64748b", rarity: "common" },
  { id: "hero_tshirt", name: "Neon T-shirt", desc: "Bright neon tee", price: 20, slot: "outfit", color: "#22c55e", rarity: "common" },
  { id: "hero_hoodie", name: "Street Hoodie", desc: "Cozy street hoodie", price: 40, slot: "outfit", color: "#38bdf8", rarity: "rare" },
  { id: "hero_jersey", name: "Gamer Jersey", desc: "Pro gamer jersey", price: 50, slot: "outfit", color: "#ec4899", rarity: "epic" },
  { id: "hero_suit", name: "Black Suit", desc: "Formal business suit", price: 70, slot: "outfit", color: "#334155", rarity: "epic" },
  { id: "hero_armor", name: "Knight Armor", desc: "Legendary silver armor", price: 100, slot: "outfit", color: "#94a3b8", rarity: "legendary" },
  { id: "hero_vest", name: "Tactical Vest", desc: "Military tactical vest", price: 55, slot: "outfit", color: "#374151", rarity: "rare" },
  { id: "hero_puffer", name: "Puffer Jacket", desc: "Warm puffer jacket", price: 60, slot: "outfit", color: "#1e40af", rarity: "rare" },
  { id: "hero_kimono", name: "Silk Kimono", desc: "Elegant Japanese kimono", price: 90, slot: "outfit", color: "#dc2626", rarity: "epic" },
  { id: "hero_track", name: "Track Suit", desc: "Sporty Adidas-style tracksuit", price: 35, slot: "outfit", color: "#16a34a", rarity: "common" },
  { id: "hero_labcoat", name: "Lab Coat", desc: "Scientist lab coat", price: 40, slot: "outfit", color: "#f1f5f9", rarity: "common" },
  { id: "hero_leather", name: "Leather Jacket", desc: "Cool leather biker jacket", price: 75, slot: "outfit", color: "#292524", rarity: "epic" },
  { id: "hero_aladdin", name: "Prince Outfit", desc: "Arabian prince vest", price: 110, slot: "outfit", color: "#c084fc", rarity: "legendary" },
  { id: "hero_ninja", name: "Ninja Gear", desc: "Shadow ninja suit", price: 85, slot: "outfit", color: "#1f2937", rarity: "epic" },
  { id: "hero_biker", name: "Biker Gear", desc: "Motorcycle biker outfit", price: 65, slot: "outfit", color: "#44403c", rarity: "rare" },
  // ── Watches ──
  { id: "hero_watch_none", name: "No Watch", desc: "Default look", price: 0, slot: "watch", color: "#9ca3af", rarity: "common" },
  { id: "hero_watch_classic", name: "Classic Watch", desc: "Silver classic analog watch", price: 25, slot: "watch", color: "#c0c0c0", rarity: "common" },
  { id: "hero_watch_gold", name: "Gold Watch", desc: "Luxury golden watch", price: 60, slot: "watch", color: "#f59e0b", rarity: "rare" },
  { id: "hero_watch_smart", name: "Smart Watch", desc: "Digital smart watch", price: 40, slot: "watch", color: "#38bdf8", rarity: "rare" },
  { id: "hero_watch_ruby", name: "Ruby Watch", desc: "Precious ruby-studded watch", price: 90, slot: "watch", color: "#ef4444", rarity: "epic" },
  { id: "hero_watch_neon", name: "Neon Watch", desc: "Futuristic glowing watch", price: 70, slot: "watch", color: "#a855f7", rarity: "epic" },
  { id: "hero_watch_diamond", name: "Diamond Watch", desc: "Iced out diamond watch", price: 150, slot: "watch", color: "#e0f2fe", rarity: "legendary" },
  { id: "hero_watch_royal", name: "Royal Pocket Watch", desc: "Antique pocket watch on chain", price: 100, slot: "watch", color: "#d97706", rarity: "legendary" },
];

export function getHeroItem(id: string): HeroShopItem | undefined {
  return HERO_SHOP.find((h) => h.id === id);
}

export function isHeroFreeItem(id: string): boolean {
  return id === "hero_hat_none" || id === "hero_glasses_none" || id === "hero_outfit_none" || id === "hero_watch_none";
}

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
