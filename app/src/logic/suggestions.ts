import type { Debt, Player } from './types';
import type { Strategy } from './strategy';
import { getBossHpPercent } from './boss';
import { getStreakStatus } from './streak';

export interface Suggestion {
  id: string;
  title: string;
  body: string;
}

function aliveDebts(debts: Debt[]): Debt[] {
  return debts.filter((d) => d.currentBalance > 0);
}

function hasEverPaidAboveMinimum(debts: Debt[]): boolean {
  return debts.some((d) => d.chain.some((block) => -block.amount > d.minimumPayment));
}

function utilization(debt: Debt): number {
  return debt.totalAmount > 0 ? (debt.currentBalance / debt.totalAmount) * 100 : 0;
}

export function getSuggestions(
  debts: Debt[],
  player: Player,
  strategy: Strategy,
  currency: string,
  now: number = Date.now()
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const live = aliveDebts(debts);

  if (debts.length === 0) {
    suggestions.push({
      id: 'no-debts',
      title: 'Summon Your First Boss',
      body: 'Add a debt in Setup to start the campaign. Every debt becomes a boss you can track and chip away at.',
    });
    return suggestions;
  }

  if (live.length === 0) {
    suggestions.push({
      id: 'all-defeated',
      title: 'The Realm Is Clear',
      body: "You've defeated every boss. Consider setting a new goal — saving an emergency fund works the same muscle as paying off debt.",
    });
    return suggestions;
  }

  const status = getStreakStatus(player.lastCheckIn, now);

  if (status === 'broken') {
    suggestions.push({
      id: 'streak-broken',
      title: 'Your Streak Has Broken',
      body: 'Log a payment this month to start rebuilding it. A payment every month raises your XP multiplier up to 2x.',
    });
  } else if (status === 'grace') {
    suggestions.push({
      id: 'streak-grace',
      title: 'Streak At Risk',
      body: "You haven't logged a payment last month or this month yet. One payment this month keeps your streak alive.",
    });
  }

  // Revolving lines aren't meant to be driven to zero like an installment
  // loan, so "almost defeated" framing only applies to the latter.
  const nearlyDefeated = live
    .filter((d) => !d.isRevolving)
    .map((d) => ({ debt: d, percent: getBossHpPercent(d.currentBalance, d.totalAmount) }))
    .filter((d) => d.percent <= 15)
    .sort((a, b) => a.percent - b.percent)[0];

  if (nearlyDefeated) {
    suggestions.push({
      id: 'nearly-defeated',
      title: `${nearlyDefeated.debt.bossName} Is Almost Down`,
      body: `Only ${currency}${nearlyDefeated.debt.currentBalance.toLocaleString()} left (${Math.round(
        nearlyDefeated.percent
      )}% HP). One more solid hit finishes it off and triggers your Boss Kill XP bonus.`,
    });
  }

  const revolvingLive = live.filter((d) => d.isRevolving);
  const highUtilization = revolvingLive
    .map((d) => ({ debt: d, utilization: utilization(d) }))
    .filter((d) => d.utilization > 30)
    .sort((a, b) => b.utilization - a.utilization)[0];

  if (highUtilization) {
    const isMaxed = highUtilization.utilization >= 90;
    suggestions.push({
      id: 'revolving-utilization',
      title: isMaxed
        ? `${highUtilization.debt.bossName} Is Maxed Out`
        : `${highUtilization.debt.bossName} Usage Is High`,
      body: `You're using ${Math.round(
        highUtilization.utilization
      )}% of this credit line. Credit utilization is one of the biggest factors in your FICO score — scoring models start penalizing past 30%, and it gets worse the closer you get to 100%. Paying it back under 30% (ideally around 10%) before your statement closing date — not just the due date — is what gets reported to the bureaus and can lift your score even without paying it off.`,
    });
  } else if (revolvingLive.length > 0) {
    const veryLow = revolvingLive.find((d) => utilization(d) <= 10);
    if (veryLow) {
      suggestions.push({
        id: 'revolving-healthy',
        title: `${veryLow.bossName} Usage Looks Healthy`,
        body: "Sitting around 10% utilization or less on a revolving line is actually ideal for your FICO score — you don't need to pay it to zero. Just keep paying it off in full and on time each cycle.",
      });
    }
  }

  if (!hasEverPaidAboveMinimum(debts)) {
    suggestions.push({
      id: 'minimums-only',
      title: "You're Only Paying the Minimum",
      body: 'Minimum payments mostly cover interest, so the real balance barely moves. Even a small amount above the minimum (a Critical Hit) chips away at the principal much faster.',
    });
  }

  const highestApr = [...live].sort((a, b) => b.interestRate - a.interestRate)[0];
  const aprSpread =
    live.length > 1
      ? Math.max(...live.map((d) => d.interestRate)) - Math.min(...live.map((d) => d.interestRate))
      : 0;

  if (strategy === 'snowball' && aprSpread >= 5 && highestApr) {
    suggestions.push({
      id: 'strategy-tip',
      title: 'Wide Interest Rate Spread',
      body: `${highestApr.bossName} carries the highest rate (${highestApr.interestRate}% APR). Snowball is great for momentum, but switching to Avalanche in Setup targets this one first and usually saves more in interest overall.`,
    });
  }

  if (player.multiplier >= 1.5) {
    suggestions.push({
      id: 'multiplier-active',
      title: `Your ${player.multiplier}x XP Multiplier Is Active`,
      body: "Your streak is strong right now — it's a great time to log a bigger payment and make the most of the bonus XP.",
    });
  }

  return suggestions;
}
