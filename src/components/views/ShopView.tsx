"use client";

import { useState, useCallback } from "react";
import { FiShoppingBag, FiCheck, FiLock, FiZap, FiStar, FiHeart } from "react-icons/fi";
import { FaCrown, FaGem, FaFire, FaBolt, FaRocket } from "react-icons/fa6";
import { GiSparkles, GiCrystalBall } from "react-icons/gi";
import type { ThemeColors } from "../../types";
import type { ShopItem, EffectItem, ShopCategory } from "../../data/shop";
import {
  THEME_SHOP, AVATAR_SHOP, EFFECT_SHOP,
  RARITY_COLORS, RARITY_LABELS,
} from "../../data/shop";

interface ShopViewProps {
  t: ThemeColors;
  coins: number;
  purchased: string[];
  activeEffects: string[];
  activeAvatar: string;
  onClose: () => void;
  onPurchase: (itemId: string, price: number) => boolean;
  onSetTheme: (themeId: string) => void;
  onEquipAvatar: (avatarId: string) => void;
  onToggleEffect: (effectId: string) => void;
  currentTheme: string;
}

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  avatar_crown: FaCrown,
  avatar_star: FiStar,
  avatar_fire: FaFire,
  avatar_gem: FaGem,
  avatar_bolt: FaBolt,
  avatar_rocket: FaRocket,
  avatar_crystal: GiCrystalBall,
  avatar_sparkle: GiSparkles,
  avatar_moon: ({ size, className }) => <span className={className} style={{ fontSize: size }}></span>,
  avatar_sun: ({ size, className }) => <span className={className} style={{ fontSize: size }}></span>,
  avatar_heart: FiHeart,
};

const CATEGORIES: { id: ShopCategory; label: string; icon: typeof FiShoppingBag }[] = [
  { id: "themes", label: "Themes", icon: FiStar },
  { id: "avatars", label: "Avatars", icon: FaCrown },
  { id: "effects", label: "Effects", icon: GiSparkles },
];

export default function ShopView({
  t,
  coins,
  purchased,
  activeEffects,
  activeAvatar,
  onClose,
  onPurchase,
  onSetTheme,
  onEquipAvatar,
  onToggleEffect,
  currentTheme,
}: ShopViewProps) {
  const [activeTab, setActiveTab] = useState<ShopCategory>("themes");
  const [purchasedAnim, setPurchasedAnim] = useState<string | null>(null);
  const [coinAnim, setCoinAnim] = useState(false);

  const handlePurchase = useCallback((item: ShopItem) => {
    const ok = onPurchase(item.id, item.price);
    if (ok) {
      setPurchasedAnim(item.id);
      setCoinAnim(true);
      setTimeout(() => setPurchasedAnim(null), 1000);
      setTimeout(() => setCoinAnim(false), 600);
    }
  }, [onPurchase]);

  const isOwned = (id: string) => id === "default" || id === "blue" || id === "avatar_default" || id === "fx_sparkle" || purchased.includes(id);

  const renderThemeItem = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const isActive = currentTheme === item.id;
    const canAfford = coins >= item.price;
    const justBought = purchasedAnim === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          if (owned) {
            onSetTheme(item.id);
          } else if (canAfford) {
            handlePurchase(item);
            onSetTheme(item.id);
          }
        }}
        className={`relative p-3 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] group ${
          justBought ? "animate-pulse" : ""
        }`}
        style={{
          background: owned && isActive ? item.color + "33" : t.surface,
          border: `2px solid ${isActive ? item.color || t.accent : owned ? item.color + "22" : "transparent"}`,
          opacity: !owned && !canAfford ? 0.5 : 1,
        }}
      >
        {/* Color preview */}
        <div className="flex items-center gap-3 mb-2">
          <div
            className="w-10 h-10 rounded-lg flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${item.color || t.accent}, ${item.color || t.accent}88)`,
              boxShadow: isActive ? `0 0 20px ${item.color || t.accent}44` : "none",
            }}
          />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm truncate">{item.name}</div>
            <div className="text-xs text-gray-500 truncate">{item.desc}</div>
          </div>
        </div>

        {/* Rarity + Price */}
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: RARITY_COLORS[item.rarity] + "22", color: RARITY_COLORS[item.rarity] }}
          >
            {RARITY_LABELS[item.rarity]}
          </span>
          {owned ? (
            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: item.color || t.accent }}>
              <FiCheck size={12} /> {isActive ? "Active" : "Owned"}
            </span>
          ) : (
            <span className="text-[11px] font-bold flex items-center gap-1" style={{ color: canAfford ? "#f59e0b" : "#6b7280" }}>
              {item.price === 0 ? "Free" : <><span>🪙</span> {item.price}</>}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderAvatarItem = (item: ShopItem) => {
    const owned = isOwned(item.id);
    const isActive = activeAvatar === item.id;
    const canAfford = coins >= item.price;
    const justBought = purchasedAnim === item.id;
    const IconComp = item.icon || ICON_MAP[item.id];

    return (
      <button
        key={item.id}
        onClick={() => {
          if (owned) {
            onEquipAvatar(item.id);
          } else if (canAfford) {
            handlePurchase(item);
            onEquipAvatar(item.id);
          }
        }}
        className={`relative p-3 rounded-xl text-center transition-all duration-300 hover:scale-[1.02] group ${
          justBought ? "animate-pulse" : ""
        }`}
        style={{
          background: owned && isActive ? (item.color || t.accent) + "33" : t.surface,
          border: `2px solid ${isActive ? item.color || t.accent : owned ? (item.color || t.accent) + "22" : "transparent"}`,
          opacity: !owned && !canAfford ? 0.5 : 1,
        }}
      >
        {/* Avatar icon */}
        <div
          className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-2 transition-all duration-300 group-hover:scale-110"
          style={{
            background: `linear-gradient(135deg, ${item.color || t.accent}44, ${item.color || t.accent}22)`,
            boxShadow: isActive ? `0 0 20px ${item.color || t.accent}44` : "none",
          }}
        >
          {IconComp ? (
            <IconComp size={24} className="text-white" />
          ) : (
            <span className="text-2xl text-white">👤</span>
          )}
        </div>

        {/* Name */}
        <div className="font-bold text-white text-xs truncate">{item.name}</div>

        {/* Rarity + Price */}
        <div className="mt-1.5">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
            style={{ background: RARITY_COLORS[item.rarity] + "22", color: RARITY_COLORS[item.rarity] }}
          >
            {RARITY_LABELS[item.rarity]}
          </span>
        </div>
        <div className="mt-1">
          {owned ? (
            <span className="text-[11px] font-bold" style={{ color: item.color || t.accent }}>
              {isActive ? "Equipped ✓" : "Owned"}
            </span>
          ) : (
            <span className="text-[11px] font-bold flex items-center justify-center gap-1" style={{ color: canAfford ? "#f59e0b" : "#6b7280" }}>
              {item.price === 0 ? "Free" : <><span>🪙</span> {item.price}</>}
            </span>
          )}
        </div>
      </button>
    );
  };

  const renderEffectItem = (item: EffectItem) => {
    const owned = isOwned(item.id);
    const isActive = activeEffects.includes(item.id);
    const canAfford = coins >= item.price;
    const justBought = purchasedAnim === item.id;

    return (
      <button
        key={item.id}
        onClick={() => {
          if (owned) {
            onToggleEffect(item.id);
          } else if (canAfford) {
            handlePurchase(item);
            onToggleEffect(item.id);
          }
        }}
        className={`relative p-4 rounded-xl text-left transition-all duration-300 hover:scale-[1.02] group ${
          justBought ? "animate-pulse" : ""
        }`}
        style={{
          background: owned && isActive ? (item.color || t.accent) + "33" : t.surface,
          border: `2px solid ${isActive ? item.color || t.accent : owned ? (item.color || t.accent) + "22" : "transparent"}`,
          opacity: !owned && !canAfford ? 0.5 : 1,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110"
            style={{
              background: `linear-gradient(135deg, ${item.color || t.accent}44, ${item.color || t.accent}22)`,
              boxShadow: isActive ? `0 0 15px ${item.color || t.accent}44` : "none",
            }}
          >
            <FiZap size={20} style={{ color: item.color || t.accent }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-sm">{item.name}</div>
            <div className="text-xs text-gray-500">{item.desc}</div>
            <div className="flex items-center gap-2 mt-1">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ background: RARITY_COLORS[item.rarity] + "22", color: RARITY_COLORS[item.rarity] }}
              >
                {RARITY_LABELS[item.rarity]}
              </span>
              <span className="text-[10px] text-gray-600 capitalize">{item.effectType}</span>
            </div>
          </div>
          <div className="flex-shrink-0 text-right">
            {owned ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{ background: isActive ? item.color || t.accent : "#4b556344" }}
              >
                <FiCheck size={14} className="text-white" />
              </div>
            ) : (
              <span className="text-xs font-bold flex items-center gap-1" style={{ color: canAfford ? "#f59e0b" : "#6b7280" }}>
                🪙 {item.price}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="flex-1 px-4 sm:px-8 py-6 sm:py-8 max-w-2xl mx-auto w-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <FiShoppingBag />
            Coin Shop
          </h2>
          <p className="text-sm text-gray-500 mt-0.5">Buy themes, avatars & effects</p>
        </div>
        <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-sm hover:bg-white/10 text-gray-400">
          ← Back
        </button>
      </div>

      {/* Coin Balance Banner */}
      <div
        className={`p-5 rounded-2xl mb-6 text-center relative overflow-hidden transition-all duration-300 ${
          coinAnim ? "scale-105" : "scale-100"
        }`}
        style={{
          background: `linear-gradient(135deg, #f59e0b33, #f59e0b66)`,
          border: `1px solid #f59e0b`,
        }}
      >
        {/* Animated background */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-yellow-400 blur-3xl animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-24 h-24 rounded-full bg-yellow-300 blur-2xl animate-pulse" />
        </div>
        <div className="relative">
          <div className="text-4xl mb-1">🪙</div>
          <div className="text-3xl font-bold text-white mb-1">{coins.toLocaleString()}</div>
          <div className="text-sm text-yellow-300/80">Coins</div>
          <div className="mt-2 text-[11px] text-yellow-200/50">
            Earn coins by typing tests & playing games!
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6">
        {CATEGORIES.map((cat) => {
          const count = cat.id === "themes" ? THEME_SHOP.length : cat.id === "avatars" ? AVATAR_SHOP.length : EFFECT_SHOP.length;
          return (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300"
              style={{
                background: activeTab === cat.id ? t.accent + "22" : t.surface,
                color: activeTab === cat.id ? t.accent : "#6b7280",
                border: `1px solid ${activeTab === cat.id ? t.accent + "44" : "transparent"}`,
              }}
            >
              <cat.icon size={14} className="inline-block mr-1.5" />
              {cat.label}
              <span className="ml-1 text-[10px] opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Items Grid */}
      {activeTab === "themes" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {THEME_SHOP.map(renderThemeItem)}
        </div>
      )}

      {activeTab === "avatars" && (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {AVATAR_SHOP.map(renderAvatarItem)}
        </div>
      )}

      {activeTab === "effects" && (
        <div className="flex flex-col gap-2">
          {EFFECT_SHOP.map(renderEffectItem)}
        </div>
      )}

      {/* Footer tip */}
      <div className="mt-6 text-xs text-gray-600 text-center">
        🪙 Earn coins by completing typing tests and playing mini-games
      </div>
    </div>
  );
}
