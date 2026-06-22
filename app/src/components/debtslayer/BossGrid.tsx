import { useState } from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { currencyAtom, debtsAtom } from '../../store/atoms.ts';
import { useStrategy } from '../../hooks/useStrategy.ts';
import { useQuickAttack } from '../../hooks/useQuickAttack.ts';
import type { Debt } from '../../logic/types.ts';
import BossCard from './BossCard.tsx';
import EditDebtForm from './EditDebtForm.tsx';

const BossGrid = () => {
  const [debts, setDebts] = useAtom(debtsAtom);
  const currency = useAtomValue(currencyAtom);
  const { liveDebts } = useStrategy();
  const { quickAttack, quickReborrow, isProcessing } = useQuickAttack();
  const [editingId, setEditingId] = useState<string | null>(null);

  if (debts.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        No debts yet. Use &quot;Add New Boss&quot; above to summon one.
      </p>
    );
  }

  const editingDebt = debts.find((d) => d.id === editingId) ?? null;

  const handleSave = (updated: Debt) => {
    setDebts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    setEditingId(null);
  };

  // Visual order follows the strategy's battlefield order (front line first),
  // with defeated/closed bosses trailing behind in their original order.
  const liveIds = new Set(liveDebts.map((d) => d.id));
  const orderedDebts = [...liveDebts, ...debts.filter((d) => !liveIds.has(d.id))];

  return (
    <>
      <div className="grid [grid-template-columns:repeat(auto-fill,minmax(155px,1fr))] gap-3 p-2 bg-black/20 border-2 border-arcane-navy/60 rounded-lg">
        {orderedDebts.map((debt) => (
          <BossCard
            key={debt.id}
            debt={debt}
            currency={currency}
            rank={(() => {
              const i = liveDebts.findIndex((d) => d.id === debt.id);
              return i === -1 ? undefined : i + 1;
            })()}
            onEdit={() => setEditingId(debt.id)}
            onAttack={(amount) => quickAttack(debt, amount, currency)}
            onReborrow={(amount) => quickReborrow(debt, amount, currency)}
            isPaying={isProcessing}
          />
        ))}
      </div>

      {editingDebt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-[toast-in_0.15s_ease-out]"
          role="presentation"
          onClick={() => setEditingId(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-lg bg-arcane-black animate-[pop-in_0.2s_ease-out]"
          >
            <EditDebtForm
              debt={editingDebt}
              onSave={handleSave}
              onCancel={() => setEditingId(null)}
            />
          </div>
        </div>
      )}
    </>
  );
};

export default BossGrid;
