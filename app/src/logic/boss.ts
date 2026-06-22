export type BossTier =
  | 'Goblin'
  | 'DarkElf'
  | 'Troll'
  | 'Wyrm'
  | 'Archlich';

const TIER_THRESHOLDS: { max: number; tier: BossTier }[] = [
  { max: 5000, tier: 'Goblin' },
  { max: 20000, tier: 'DarkElf' },
  { max: 50000, tier: 'Troll' },
  { max: 150000, tier: 'Wyrm' },
  { max: Infinity, tier: 'Archlich' },
];

const TIER_LABELS: Record<BossTier, string> = {
  Goblin: 'Goblin Skulker',
  DarkElf: 'Dark Elf Raider',
  Troll: 'Swamp Troll',
  Wyrm: 'Elder Wyrm',
  Archlich: 'Archlich, the Doombringer',
};

export function getBossTier(totalAmount: number): BossTier {
  const match = TIER_THRESHOLDS.find((t) => totalAmount < t.max);
  return (match ?? TIER_THRESHOLDS[TIER_THRESHOLDS.length - 1]).tier;
}

export function getTierLabel(tier: BossTier): string {
  return TIER_LABELS[tier];
}

export function generateBossName(tier: BossTier, debtName?: string): string {
  const label = getTierLabel(tier);
  return debtName ? `The ${debtName} ${label}` : label;
}

export function getBossHpPercent(
  currentBalance: number,
  totalAmount: number
): number {
  if (totalAmount <= 0) return 0;
  const percent = (currentBalance / totalAmount) * 100;
  return Math.max(0, Math.min(100, percent));
}

export function isDebtDone(debt: { defeatedAt?: number; closedAt?: number }): boolean {
  return Boolean(debt.defeatedAt || debt.closedAt);
}

export type DebtQuality = 'good' | 'moderate' | 'bad';

// A rough, APR-only heuristic: low-rate debt (mortgages, federal student
// loans, auto loans) is "good" — manageable and often tied to an asset —
// while double-digit revolving-card-style rates are "bad" and worth
// prioritizing. Anything in between is left unlabeled.
export function getDebtQuality(interestRate: number): DebtQuality {
  if (interestRate <= 8) return 'good';
  if (interestRate >= 15) return 'bad';
  return 'moderate';
}

// Standard amortization: months to clear the balance paying a fixed amount
// every month. Returns null when the payment doesn't even cover the
// interest accruing each month, so the balance would never reach zero.
export function estimatePayoffMonths(
  balance: number,
  annualRatePercent: number,
  monthlyPayment: number
): number | null {
  if (balance <= 0) return 0;
  if (monthlyPayment <= 0) return null;

  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return Math.ceil(balance / monthlyPayment);

  const interestOnlyPayment = balance * monthlyRate;
  if (monthlyPayment <= interestOnlyPayment) return null;

  const months =
    -Math.log(1 - interestOnlyPayment / monthlyPayment) /
    Math.log(1 + monthlyRate);
  return Math.ceil(months);
}

export function formatPayoffDuration(months: number): string {
  if (months <= 0) return 'Paid off';
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  if (years === 0) return `${remainder} mo`;
  if (remainder === 0) return `${years} yr`;
  return `${years} yr ${remainder} mo`;
}
