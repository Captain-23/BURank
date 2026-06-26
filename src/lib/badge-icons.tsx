import {
  Baby,
  Medal,
  Trophy,
  Crown,
  Shield,
  Swords,
  Flame,
  Flag,
  BadgeCheck,
  Star,
  Gem,
  Scale,
} from "lucide-react";

export const BADGE_ICONS = {
  rookie: Baby,
  century: Medal,
  grinder: Trophy,
  legend: Crown,

  brave: Shield,
  savage: Swords,
  "hard-enjoyer": Flame,

  contestant: Flag,
  rated: BadgeCheck,
  expert: Star,
  master: Gem,

  balanced: Scale,
} as const;