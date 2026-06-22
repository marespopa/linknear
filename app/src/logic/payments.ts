import type { Debt } from './types';

export interface PaymentEntry {
  id: string;
  debtId: string;
  bossName: string;
  amount: number;
  timestamp: number;
}

export function getPaymentHistory(debts: Debt[]): PaymentEntry[] {
  return debts
    .flatMap((debt) =>
      debt.chain.map((block) => ({
        id: block.hash,
        debtId: debt.id,
        bossName: debt.bossName,
        amount: Math.abs(block.amount),
        timestamp: block.timestamp,
      }))
    )
    .sort((a, b) => b.timestamp - a.timestamp);
}
