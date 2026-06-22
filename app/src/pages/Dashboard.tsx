import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  currencyAtom,
  currentViewAtom,
  debtsAtom,
  hasOnboardedAtom,
  playerAtom,
  unlockedAchievementsAtom,
} from '../store/atoms.ts';
import { Plus } from 'lucide-react';
import { useStrategy } from '../hooks/useStrategy.ts';
import { useQuickAttack } from '../hooks/useQuickAttack.ts';
import { useConfirm } from '../hooks/useConfirm.ts';
import PlayerCard from '../components/debtslayer/PlayerCard.tsx';
import BossGrid from '../components/debtslayer/BossGrid.tsx';
import StatsPanel from '../components/debtslayer/StatsPanel.tsx';
import AchievementsPanel from '../components/debtslayer/AchievementsPanel.tsx';
import SectionHeader from '../components/ui/SectionHeader.tsx';
import Button from '../components/forms/Button.tsx';

const RESET_PROGRESS = {
  xp: 0,
  level: 1,
  title: 'Novice',
  streakCount: 0,
  lastCheckIn: null,
  multiplier: 1,
};

const Dashboard = () => {
  const { liveDebts, strategy, setStrategy } = useStrategy();
  const [debts, setDebts] = useAtom(debtsAtom);
  const currency = useAtomValue(currencyAtom);
  const setView = useSetAtom(currentViewAtom);
  const setHasOnboarded = useSetAtom(hasOnboardedAtom);
  const setPlayer = useSetAtom(playerAtom);
  const setUnlockedAchievements = useSetAtom(unlockedAchievementsAtom);
  const { quickAttack, isProcessing } = useQuickAttack();
  const { confirm } = useConfirm();

  const payAllMinimums = async () => {
    for (const debt of liveDebts) {
      await quickAttack(debt, debt.minimumPayment, currency);
    }
  };

  const handleNewGame = async () => {
    const confirmed = await confirm(
      'This clears all debts, XP, level, streak, and achievements.',
      { title: 'Start a new game?', confirmLabel: 'Start New Game', variant: 'danger' }
    );
    if (!confirmed) return;

    setDebts([]);
    setPlayer((prev) => ({ ...RESET_PROGRESS, name: prev.name }));
    setStrategy('avalanche');
    setUnlockedAchievements([]);
    setView('setup');
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader title="Player" />
        <PlayerCard />
      </section>

      <section>
        <SectionHeader title="Battlefield" />

        {liveDebts.length > 1 && (
          <div className="mb-3 space-y-1.5">
            <div className="flex gap-2">
              {(['avalanche', 'snowball'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStrategy(s)}
                  className={`flex-1 font-display min-h-11 px-2 py-2 text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${
                    strategy === s
                      ? 'border-arcane-gold text-arcane-gold'
                      : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
                  }`}
                >
                  {s === 'avalanche' ? 'Avalanche' : 'Snowball'}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">
              {strategy === 'avalanche'
                ? 'Lines up the highest-interest debt at the front.'
                : 'Lines up the smallest balance at the front.'}
            </p>
          </div>
        )}

        {debts.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              No debts yet. Add one to summon your first boss.
            </p>
            <Button
              variant="primary"
              className="w-full"
              onClick={() => setHasOnboarded(false)}
            >
              Add Your First Debt
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {liveDebts.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">All bosses defeated. You win.</p>
                <Button variant="primary" className="w-full" onClick={handleNewGame}>
                  Start New Game
                </Button>
              </div>
            )}

            <BossGrid />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" className="w-full" onClick={() => setView('setup')}>
                <Plus size={14} />
                Add New Boss
              </Button>
              {liveDebts.length > 1 && (
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={isProcessing}
                  onClick={payAllMinimums}
                >
                  Pay All Minimums ({liveDebts.length})
                </Button>
              )}
            </div>
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Stats" />
        <StatsPanel />
      </section>

      <section>
        <AchievementsPanel />
      </section>
    </div>
  );
};

export default Dashboard;
