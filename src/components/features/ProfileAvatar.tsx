"use client";

import { DEFAULT_HERO_EQUIP, getAvatarInfo, type HeroEquip } from "../../data/shop";
import { STORAGE_HERO } from "../../hooks/useCoins";
import type { UserProfile } from "../../hooks/useProfile";
import HeroAvatar from "./HeroAvatar";

interface ProfileAvatarProps {
  profile: UserProfile | null | undefined;
  size?: number;
  className?: string;
  /** Qahramon kiyimlari — berilmasa, sotib olingan kiyimlar localStorage dan olinadi */
  heroEquip?: Partial<HeroEquip>;
}

function readStoredHeroEquip(): Partial<HeroEquip> {
  try {
    const raw = localStorage.getItem(STORAGE_HERO);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Foydalanuvchi rasmini ko'rsatadi; rasm yo'q bo'lsa — shop avatari / qahramon.
 * Navbar, profil sahifasi, chat va battle'da ishlatiladi.
 */
export default function ProfileAvatar({ profile, size = 32, className, heroEquip }: ProfileAvatarProps) {
  const photo = profile?.photo;
  const avatarId = profile?.avatarId || "avatar_default";
  const equip: Partial<HeroEquip> = heroEquip ?? readStoredHeroEquip();

  if (photo) {
    return (
      <img
        src={photo}
        alt={[profile?.firstName, profile?.lastName].filter(Boolean).join(" ") || "Profil rasmi"}
        width={size}
        height={size}
        loading="lazy"
        decoding="async"
        className={`rounded-full object-cover flex-shrink-0 ${className || ""}`}
        style={{ width: size, height: size, border: `2px solid ${getAvatarInfo(avatarId).color}` }}
        draggable={false}
      />
    );
  }

  const av = getAvatarInfo(avatarId);

  return (
    <div
      className={`relative flex-shrink-0 ${className || ""}`}
      style={{ width: size, height: size }}
      aria-label="Qahramon avatari"
    >
      <HeroAvatar equip={{ ...DEFAULT_HERO_EQUIP, ...equip }} color={av.color} size={size} />
    </div>
  );
}
