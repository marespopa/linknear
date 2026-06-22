import type { Block } from './crypto';
import type { BossTier } from './boss';

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  totalAmount: number;
  currentBalance: number;
  minimumPayment: number;
  interestRate: number;
  bossName: string;
  tier: BossTier;
  chain: Block[];
  defeatedAt?: number;
  isRevolving?: boolean;
  closedAt?: number;
}

export interface Player {
  name: string;
  xp: number;
  level: number;
  title: string;
  streakCount: number;
  lastCheckIn: number | null;
  multiplier: number;
}
