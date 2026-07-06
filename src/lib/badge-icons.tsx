import type { IconType } from "react-icons";
import {
  LuBaby,
  LuMedal,
  LuTrophy,
  LuCrown,
  LuShield,
  LuSwords,
  LuFlame,
  LuFlag,
  LuBadgeCheck,
  LuStar,
  LuGem,
  LuScale,
} from "react-icons/lu";

export const BADGE_ICONS = {
  rookie: LuBaby,
  century: LuMedal,
  grinder: LuTrophy,
  legend: LuCrown,

  brave: LuShield,
  savage: LuSwords,
  "hard-enjoyer": LuFlame,

  contestant: LuFlag,
  rated: LuBadgeCheck,
  expert: LuStar,
  master: LuGem,

  balanced: LuScale,
} as const satisfies Record<string, IconType>;

export type BadgeId = keyof typeof BADGE_ICONS;

interface BadgeIconProps {
  id: string;
  size?: number;
  color?: string;
}

export function BadgeIcon({ id, size = 14, color }: BadgeIconProps) {
  const Icon = BADGE_ICONS[id as BadgeId];
  if (!Icon) return null;
  return <Icon size={size} color={color} aria-hidden />;
}
