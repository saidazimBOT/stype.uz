import { getAvatarInfo } from "../../../data/shop";

export const BATTLE_REWARDS = {
  "1v1": {
    win: { coins: 40, xp: 20 },
    lose: { coins: 10, xp: 5 },
    draw: { coins: 20, xp: 10 },
  },
  team: {
    win: { coins: 25, xp: 12 },
    lose: { coins: 10, xp: 4 },
    draw: { coins: 15, xp: 8 },
  },
} as const;

export type BattleOutcome = "win" | "lose" | "draw";

export function progressPct(correct: number, textLen: number): number {
  if (!textLen) return 0;
  return Math.min(100, Math.round((correct / textLen) * 1000) / 10);
}

export function AvatarChip({
  avatar,
  size = 28,
}: {
  avatar: string;
  size?: number;
}) {
  const info = getAvatarInfo(avatar);
  const Icon = info.icon;
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${info.color}, ${info.color}88)`,
        boxShadow: `0 0 8px ${info.color}55`,
      }}
    >
      <Icon size={Math.round(size * 0.45)} className="text-white" />
    </div>
  );
}
