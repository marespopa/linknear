import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import type { Block } from '../logic/crypto';

export const currencyAtom = atomWithStorage<string>('git-fi-currency', 'USD');
export const chainAtom = atomWithStorage<Block[]>('git-fi-chain', []);
export const privacyAtom = atomWithStorage<boolean>(
  'git-fi-private-mode',
  false
);
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
