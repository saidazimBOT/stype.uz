import type { IconType } from "react-icons";
import { FaBolt, FaCrown, FaFire, FaGem, FaMedal, FaRocket, FaTrophy } from "react-icons/fa6";
import { FiActivity, FiShield, FiStar, FiTarget, FiUsers, FiZap } from "react-icons/fi";

export const ACHIEVEMENT_ICONS: Record<string, IconType> = {
  trophy: FaTrophy,
  medal: FaMedal,
  fire: FaFire,
  gem: FaGem,
  rocket: FaRocket,
  crown: FaCrown,
  bolt: FaBolt,
  zap: FiZap,
  star: FiStar,
  target: FiTarget,
  users: FiUsers,
  shield: FiShield,
  activity: FiActivity,
};

export const ACHIEVEMENT_ICON_KEYS = Object.keys(ACHIEVEMENT_ICONS);

export const ACHIEVEMENT_COLORS = [
  "#f59e0b", "#22d3ee", "#818cf8", "#f472b6", "#22c55e", "#ef4444", "#a78bfa", "#38bdf8",
];

export function achievementIcon(key: string): IconType {
  return ACHIEVEMENT_ICONS[key] || FaTrophy;
}
