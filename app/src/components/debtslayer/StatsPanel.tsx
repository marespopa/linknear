import { useAtomValue } from 'jotai';
import { currencyAtom, debtsAtom, playerAtom } from '../../store/atoms.ts';
import { isDebtDone } from '../../logic/boss.ts';

const StatsPanel = () => {
  const debts = useAtomValue(debtsAtom);
  const player = useAtomValue(playerAtom);
  const currency = useAtomValue(currencyAtom);

  const totalOriginal = debts.reduce((sum, d) => sum + d.totalAmount, 0);
  const totalRemaining = debts.reduce((sum, d) => sum + d.currentBalance, 0);
  const totalPaid = totalOriginal - totalRemaining;
  const paidPercent = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;
  const defeatedCount = debts.filter((d) => isDebtDone(d)).length;
  const totalMinimumPayment = debts
    .filter((d) => !isDebtDone(d))
    .reduce((sum, d) => sum + d.minimumPayment, 0);

  return (
    <div className="space-y-4 text-xs text-arcane-gold">
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-arcane-navy rounded p-3">
          <p className="text-slate-500 uppercase text-[10px]">Total Paid</p>
          <p className="text-lg text-arcane-gold-light">
            {currency}
            {totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="border border-arcane-navy rounded p-3">
          <p className="text-slate-500 uppercase text-[10px]">Remaining</p>
          <p className="text-lg text-arcane-gold-light">
            {currency}
            {totalRemaining.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="border border-arcane-navy rounded p-3">
        <p className="text-slate-500 uppercase text-[10px]">
          Min. Monthly Payment Due
        </p>
        <p className="text-lg text-arcane-gold-light">
          {currency}
          {totalMinimumPayment.toLocaleString()}
        </p>
      </div>

      <div>
        <p className="uppercase text-[10px] text-slate-500 mb-1">
          Overall Progress
        </p>
        <div className="w-full h-3 bg-black border border-arcane-navy rounded-full overflow-hidden">
          <div
            className="h-full bg-arcane-blue transition-all duration-500"
            style={{ width: `${Math.min(100, Math.max(0, paidPercent))}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border border-arcane-navy rounded p-3">
          <p className="text-slate-500 uppercase text-[10px]">
            Bosses Defeated
          </p>
          <p className="text-lg text-arcane-gold-light">
            {defeatedCount} / {debts.length}
          </p>
        </div>
        <div className="border border-arcane-navy rounded p-3">
          <p className="text-slate-500 uppercase text-[10px]">Total XP</p>
          <p className="text-lg text-arcane-gold-light">{player.xp}</p>
        </div>
      </div>
    </div>
  );
};

export default StatsPanel;
