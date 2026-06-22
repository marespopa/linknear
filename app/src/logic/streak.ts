import type { Player } from './types';

export type StreakStatus = 'active' | 'grace' | 'broken';

// Most people get paid monthly or biweekly, not daily — a streak that
// demands a payment every single day punishes completely normal repayment
// behavior. Tracking by calendar month instead means "pay at least once a
// month" keeps the streak alive, which matches how people actually budget.
const GRACE_MONTHS = 1;

function monthsBetween(a: number, b: number): number {
  const da = new Date(a);
  const db = new Date(b);
  return (db.getFullYear() - da.getFullYear()) * 12 + (db.getMonth() - da.getMonth());
}

export function getStreakStatus(
  lastCheckIn: number | null,
  now: number
): StreakStatus {
  if (lastCheckIn === null) return 'broken';

  const months = monthsBetween(lastCheckIn, now);

  if (months <= 0) return 'active';
  if (months <= GRACE_MONTHS) return 'grace';
  return 'broken';
}

// XP multiplier only — never affects financial amounts or penalties.
export function getStreakMultiplier(streakCount: number): number {
  if (streakCount >= 6) return 2;
  if (streakCount >= 3) return 1.5;
  if (streakCount >= 1) return 1.2;
  return 1;
}

export function recordCheckIn(player: Player): Player {
  const now = Date.now();

  // Already checked in this month — don't let multiple payments in one
  // month inflate the streak count.
  if (player.lastCheckIn !== null && monthsBetween(player.lastCheckIn, now) === 0) {
    return player;
  }

  const status = getStreakStatus(player.lastCheckIn, now);
  const streakCount = status === 'broken' ? 1 : player.streakCount + 1;

  return {
    ...player,
    streakCount,
    lastCheckIn: now,
    multiplier: getStreakMultiplier(streakCount),
  };
}
