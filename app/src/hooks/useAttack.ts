import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import money from 'currency.js';
import { debtsAtom, playerAtom } from '../store/atoms';
import { generateHash } from '../logic/crypto';
import { recordCheckIn } from '../logic/streak';
import {
  calculateAttackXp,
  calculateBossKillBonus,
  getLevelForXp,
  getTitleForLevel,
} from '../logic/xp';
import { useToast } from './useToast';

export interface AttackOutcome {
  debtId: string;
  bossName: string;
  damage: number;
  xpEarned: number;
  isCritical: boolean;
  bossDefeated: boolean;
}

export function useAttack() {
  const [debts, setDebts] = useAtom(debtsAtom);
  const setPlayer = useSetAtom(playerAtom);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  const attack = async (debtId: string, amount: number): Promise<AttackOutcome> => {
    setIsProcessing(true);
    setError(null);

    try {
      const debt = debts.find((d) => d.id === debtId);
      if (!debt) throw new Error('Boss not found');

      const timestamp = Date.now();
      const currentTip = debt.chain.length > 0 ? debt.chain[debt.chain.length - 1] : null;
      const parentHash = currentTip ? currentTip.hash : '0';
      const index = debt.chain.length;

      const transactionData = {
        amount: -amount,
        note: `Attack: ${debt.bossName}`,
        timestamp,
        index,
      };

      const hash = await generateHash(transactionData, parentHash);
      const block = { ...transactionData, parentHash, hash };

      const { xp, isCritical } = calculateAttackXp(amount, debt.minimumPayment);
      const newBalance = Math.max(0, money(debt.currentBalance).subtract(amount).value);
      const bossDefeated = debt.currentBalance > 0 && newBalance === 0;
      const bonusXp = bossDefeated ? calculateBossKillBonus(debt.totalAmount) : 0;
      const xpEarned = xp + bonusXp;

      setDebts((prev) =>
        prev.map((d) =>
          d.id === debtId
            ? {
                ...d,
                currentBalance: newBalance,
                chain: [...d.chain, block],
                defeatedAt: bossDefeated ? timestamp : d.defeatedAt,
              }
            : d
        )
      );

      setPlayer((prev) => {
        const withStreak = recordCheckIn(prev);
        const xpTotal = withStreak.xp + xpEarned;
        const level = getLevelForXp(xpTotal);
        const title = getTitleForLevel(level);
        if (level > prev.level) {
          addToast(`Level Up! You are now a ${title}`, 'level');
        }
        return { ...withStreak, xp: xpTotal, level, title };
      });

      return {
        debtId,
        bossName: debt.bossName,
        damage: amount,
        xpEarned,
        isCritical,
        bossDefeated,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Attack failed';
      setError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const reborrow = async (debtId: string, amount: number) => {
    const debt = debts.find((d) => d.id === debtId);
    if (!debt) throw new Error('Boss not found');

    const newBalance = Math.min(debt.totalAmount, money(debt.currentBalance).add(amount).value);

    setDebts((prev) =>
      prev.map((d) =>
        d.id === debtId
          ? { ...d, currentBalance: newBalance, defeatedAt: undefined }
          : d
      )
    );

    return { debtId, bossName: debt.bossName, newBalance };
  };

  return { attack, reborrow, isProcessing, error };
}
