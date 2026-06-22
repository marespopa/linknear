import { useAtom, useAtomValue } from 'jotai';
import { liveDebtsAtom, strategyAtom } from '../store/atoms';

export function useStrategy() {
  const [strategy, setStrategy] = useAtom(strategyAtom);
  const liveDebts = useAtomValue(liveDebtsAtom);

  return { liveDebts, strategy, setStrategy };
}
