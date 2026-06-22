export const LEVEL_THRESHOLDS = [500, 1500, 3000, 6000, 10000];

const TITLES = ['Novice', 'Adept', 'Champion', 'Master', 'Archmage'];

export function calculateAttackXp(
  amount: number,
  minimumPayment: number
): { xp: number; isCritical: boolean } {
  const isCritical = amount > minimumPayment;
  const baseXp = amount / 10;
  const xp = Math.round(isCritical ? baseXp * 1.5 : baseXp);

  return { xp, isCritical };
}

export function calculateBossKillBonus(maxHP: number): number {
  return Math.round(maxHP / 5);
}

export function getLevelForXp(xp: number): number {
  let level = 1;

  for (const threshold of LEVEL_THRESHOLDS) {
    if (xp < threshold) break;
    level += 1;
  }

  return level;
}

export function getTitleForLevel(level: number): string {
  const index = Math.min(Math.max(level - 1, 0), TITLES.length - 1);
  return TITLES[index];
}

export function getXpProgress(
  xp: number,
  level: number
): { current: number; needed: number; percent: number } {
  const prevThreshold = level > 1 ? LEVEL_THRESHOLDS[level - 2] : 0;
  const nextThreshold = LEVEL_THRESHOLDS[level - 1];

  if (nextThreshold === undefined) {
    return { current: xp - prevThreshold, needed: 0, percent: 100 };
  }

  const current = xp - prevThreshold;
  const needed = nextThreshold - prevThreshold;
  const percent = needed > 0 ? Math.max(0, Math.min(100, (current / needed) * 100)) : 100;

  return { current, needed, percent };
}
