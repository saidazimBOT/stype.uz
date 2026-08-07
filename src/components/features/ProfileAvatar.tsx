"use client";

import type { IconType } from "react-icons";
import { getAvatarInfo } from "../../data/shop";
import type { UserProfile } from "../../hooks/useProfile";

interface ProfileAvatarProps {
  profile: UserProfile | null | undefined;
  size?: number;
  className?: string;
}

/**
 * Foydalanuvchi rasmini ko'rsatadi; rasm yo'q bo'lsa — shop avatari.
 * Navbar, profil sahifasi, chat va battle'da ishlatiladi.
 */
export default function ProfileAvatar({ profile, size = 32, className }: ProfileAvatarProps) {
  const photo = profile?.photo;
  const avatarId = profile?.avatarId || "avatar_default";

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
  const AvIcon = av.icon as IconType;
  return (
    <div
      className={`rounded-full flex items-center justify-center flex-shrink-0 ${className || ""}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${av.color}44, ${av.color}88)`,
        border: `2px solid ${av.color}`,
        boxShadow: `0 0 12px ${av.color}33`,
      }}
      aria-label="Profil avatari"
    >
      <AvIcon size={Math.round(size * 0.5)} style={{ color: av.color }} />
    </div>
  );
}
