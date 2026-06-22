import type { Debt, Player } from './types';
import { isDebtDone } from './boss';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  isUnlocked: (debts: Debt[], player: Player) => boolean;
}

function hasPaymentAbove(debts: Debt[], multiplier: number): boolean {
  return debts.some((d) =>
    d.chain.some((block) => -block.amount >= d.minimumPayment * multiplier)
  );
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-blood',
    title: 'First Blood',
    description: 'Log your first payment.',
    isUnlocked: (debts) => debts.some((d) => d.chain.length > 0),
  },
  {
    id: 'critical-striker',
    title: 'Critical Striker',
    description: 'Land a payment above the minimum.',
    isUnlocked: (debts) => hasPaymentAbove(debts, 1),
  },
  {
    id: 'overkill',
    title: 'Overkill',
    description: 'Pay 3x the minimum in a single attack.',
    isUnlocked: (debts) => hasPaymentAbove(debts, 3),
  },
  {
    id: 'dragon-slayer',
    title: 'Dragon Slayer',
    description: 'Defeat a Wyrm-tier boss or stronger.',
    isUnlocked: (debts) =>
      debts.some(
        (d) => d.defeatedAt && (d.tier === 'Wyrm' || d.tier === 'Archlich')
      ),
  },
  {
    id: 'raid-cleared',
    title: 'Raid Cleared',
    description: 'Defeat every boss on the board.',
    isUnlocked: (debts) => debts.length > 0 && debts.every((d) => isDebtDone(d)),
  },
  {
    id: 'untouchable',
    title: 'Untouchable',
    description: 'Reach a 12-day check-in streak.',
    isUnlocked: (_debts, player) => player.streakCount >= 12,
  },
  {
    id: 'archmage',
    title: 'Archmage',
    description: 'Reach the maximum level.',
    isUnlocked: (_debts, player) => player.level >= 5,
  },
];

export function getUnlockedIds(debts: Debt[], player: Player): string[] {
  return ACHIEVEMENTS.filter((a) => a.isUnlocked(debts, player)).map((a) => a.id);
}
