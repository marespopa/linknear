import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Block } from '../logic/crypto';
import type { Debt, Player } from '../logic/types';
import type { Strategy } from '../logic/strategy';
import { getOrderedLiveDebts } from '../logic/strategy';

export type Theme = 'light' | 'dark';

export const themeAtom = atomWithStorage<Theme>('linknear-theme', 'dark');

export const currencyAtom = atomWithStorage<string>('git-fi-currency', 'USD');
export const chainAtom = atomWithStorage<Block[]>('git-fi-chain', []);
export const historyAtom = atomWithStorage<
  Record<string, { blocks: Block[]; seal: string; closingBalance: number }>
>('git-fi-history', {});

export const balanceAtom = atom((get) => {
  const chain = get(chainAtom);

  if (chain.length === 0) {
    return 0;
  }

  return chain.reduce((sum, block) => sum + block.amount, 0);
});

// --- DebtSlayer state ---

export const debtsAtom = atomWithStorage<Debt[]>('debtslayer-debts', []);

export const playerAtom = atomWithStorage<Player>('debtslayer-player', {
  name: '',
  xp: 0,
  level: 1,
  title: 'Novice',
  streakCount: 0,
  lastCheckIn: null,
  multiplier: 1,
});

export const hasOnboardedAtom = atomWithStorage<boolean>(
  'linknear-onboarded',
  false
);

export const strategyAtom = atomWithStorage<Strategy>(
  'debtslayer-strategy',
  'avalanche'
);

export const unlockedAchievementsAtom = atomWithStorage<string[]>(
  'debtslayer-achievements',
  []
);

// The battlefield order: live debts sorted by the chosen strategy, front
// line (index 0) first.
export const liveDebtsAtom = atom((get) =>
  getOrderedLiveDebts(get(debtsAtom), get(strategyAtom))
);

export const totalDebtRemainingAtom = atom((get) =>
  get(debtsAtom).reduce((sum, debt) => sum + debt.currentBalance, 0)
);

export type View = 'dashboard' | 'history' | 'suggestions' | 'setup' | 'settings';

export const currentViewAtom = atom<View>('dashboard');

export type ToastVariant = 'level' | 'achievement' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export const toastsAtom = atom<Toast[]>([]);

export interface ConfirmRequest {
  id: string;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  variant: 'primary' | 'danger';
  resolve: (confirmed: boolean) => void;
}

export const confirmRequestAtom = atom<ConfirmRequest | null>(null);
