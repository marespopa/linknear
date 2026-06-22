import { useState } from 'react';
import { useAtom } from 'jotai';
import { playerAtom } from '../store/atoms';
import { getStreakStatus, recordCheckIn } from '../logic/streak';

export function useStreak() {
  const [player, setPlayer] = useAtom(playerAtom);
  // Captured once per mount rather than read live, so render stays pure.
  const [renderedAt] = useState(() => Date.now());
  const status = getStreakStatus(player.lastCheckIn, renderedAt);

  const checkIn = () => {
    setPlayer((prev) => recordCheckIn(prev));
  };

  return { streakCount: player.streakCount, status, checkIn };
}
