import { useAttack } from './useAttack';
import { useToast } from './useToast';
import type { Debt } from '../logic/types';

export function useQuickAttack() {
  const { attack, reborrow, isProcessing } = useAttack();
  const { addToast } = useToast();

  const quickAttack = async (debt: Debt, amount: number, currency: string) => {
    const res = await attack(debt.id, amount);
    addToast(
      res.bossDefeated
        ? `${res.bossName} defeated!`
        : `Hit ${res.bossName} for ${currency}${res.damage.toLocaleString()}${
            res.isCritical ? ' (Critical Hit!)' : ''
          }`,
      res.bossDefeated ? 'level' : 'info'
    );
    return res;
  };

  const quickReborrow = async (debt: Debt, amount: number, currency: string) => {
    const res = await reborrow(debt.id, amount);
    addToast(`${res.bossName} reborrowed ${currency}${amount.toLocaleString()}`, 'info');
    return res;
  };

  return { quickAttack, quickReborrow, isProcessing };
}
