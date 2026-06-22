import { useEffect } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { debtsAtom, playerAtom, unlockedAchievementsAtom } from '../store/atoms';
import { ACHIEVEMENTS, getUnlockedIds } from '../logic/achievements';
import { useToast } from './useToast';

export function useAchievements() {
  const debts = useAtomValue(debtsAtom);
  const player = useAtomValue(playerAtom);
  const [unlockedIds, setUnlockedIds] = useAtom(unlockedAchievementsAtom);
  const { addToast } = useToast();

  // Achievement conditions (e.g. streak length) can regress, but unlocks
  // are permanent once earned, so we union into storage instead of
  // recomputing live every render. The "new ids" diff happens inside the
  // functional updater (against `prev`, not the closed-over `unlockedIds`)
  // so that React StrictMode's double-invoked effect in dev doesn't fire
  // duplicate toasts — the second invocation sees the first one's result.
  useEffect(() => {
    const liveUnlocked = getUnlockedIds(debts, player);
    setUnlockedIds((prev) => {
      const newIds = liveUnlocked.filter((id) => !prev.includes(id));
      if (newIds.length === 0) return prev;

      newIds.forEach((id) => {
        const achievement = ACHIEVEMENTS.find((a) => a.id === id);
        if (achievement) {
          addToast(`Achievement Unlocked: ${achievement.title}`, 'achievement');
        }
      });

      return [...prev, ...newIds];
    });
    // addToast is stable across renders (setAtom identity), safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debts, player, setUnlockedIds]);

  const achievements = ACHIEVEMENTS.map((a) => ({
    ...a,
    unlocked: unlockedIds.includes(a.id),
  }));

  return { achievements, unlockedCount: unlockedIds.length };
}
