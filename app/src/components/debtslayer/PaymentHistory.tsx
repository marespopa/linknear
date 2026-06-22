import { useAtomValue } from 'jotai';
import { Swords } from 'lucide-react';
import { currencyAtom, debtsAtom } from '../../store/atoms.ts';
import { getPaymentHistory } from '../../logic/payments.ts';

const PaymentHistory = () => {
  const debts = useAtomValue(debtsAtom);
  const currency = useAtomValue(currencyAtom);
  const history = getPaymentHistory(debts);

  if (history.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No payments logged yet. Attack a boss to see it here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((entry) => (
        <div
          key={entry.id}
          className="flex items-center justify-between gap-3 border border-arcane-navy rounded p-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Swords size={14} className="text-arcane-gold shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-arcane-gold-light truncate">{entry.bossName}</p>
              <p className="text-[10px] text-slate-500">
                {new Date(entry.timestamp).toLocaleDateString()}{' '}
                {new Date(entry.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          <p className="text-sm text-arcane-gold-light shrink-0">
            -{currency}
            {entry.amount.toLocaleString()}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PaymentHistory;
