import type { Debt } from './types';

export type Strategy = 'avalanche' | 'snowball';

export function sortByAvalanche(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => b.interestRate - a.interestRate);
}

export function sortBySnowball(debts: Debt[]): Debt[] {
  return [...debts].sort((a, b) => a.currentBalance - b.currentBalance);
}

function sortByStrategy(debts: Debt[], strategy: Strategy): Debt[] {
  return strategy === 'avalanche' ? sortByAvalanche(debts) : sortBySnowball(debts);
}

function aliveDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => d.currentBalance > 0 && !d.closedAt);
}

export function getOrderedLiveDebts(debts: Debt[], strategy: Strategy): Debt[] {
  return sortByStrategy(aliveDebts(debts), strategy);
}
