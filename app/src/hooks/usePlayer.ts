import { useAtomValue } from 'jotai';
import { playerAtom } from '../store/atoms';
import { getXpProgress } from '../logic/xp';

export function usePlayer() {
  const player = useAtomValue(playerAtom);
  const progress = getXpProgress(player.xp, player.level);

  return { ...player, progress };
}
