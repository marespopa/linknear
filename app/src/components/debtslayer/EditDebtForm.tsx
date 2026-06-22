import { useState, type FormEvent } from 'react';
import money from 'currency.js';
import type { Debt } from '../../logic/types.ts';
import { getBossTier, generateBossName } from '../../logic/boss.ts';
import { parseDecimal } from '../../logic/currency.ts';
import Input from '../forms/Input.tsx';
import Button from '../forms/Button.tsx';
import { useConfirm } from '../../hooks/useConfirm.ts';

interface EditDebtFormProps {
  debt: Debt;
  onSave: (debt: Debt) => void;
  onCancel: () => void;
}

const EditDebtForm = ({ debt, onSave, onCancel }: EditDebtFormProps) => {
  const [creditor, setCreditor] = useState(debt.creditor);
  const [totalAmount, setTotalAmount] = useState(String(debt.totalAmount));
  const [paidAmount, setPaidAmount] = useState(
    String(money(debt.totalAmount).subtract(debt.currentBalance).value)
  );
  const [minimumPayment, setMinimumPayment] = useState(String(debt.minimumPayment));
  const [interestRate, setInterestRate] = useState(String(debt.interestRate));
  const [isRevolving, setIsRevolving] = useState(Boolean(debt.isRevolving));
  const { confirm } = useConfirm();

  const canSave =
    creditor.trim() !== '' &&
    parseDecimal(totalAmount) > 0 &&
    parseDecimal(paidAmount) >= 0 &&
    parseDecimal(minimumPayment) >= 0 &&
    interestRate !== '' &&
    !Number.isNaN(parseDecimal(interestRate));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSave) return;

    const newTotalAmount = parseDecimal(totalAmount);
    const newPaidAmount = parseDecimal(paidAmount);
    const newCurrentBalance = Math.min(
      newTotalAmount,
      Math.max(0, money(newTotalAmount).subtract(newPaidAmount).value)
    );
    const tier = getBossTier(newTotalAmount);
    const isDefeated = newCurrentBalance <= 0;

    onSave({
      ...debt,
      creditor: creditor.trim(),
      totalAmount: newTotalAmount,
      currentBalance: newCurrentBalance,
      minimumPayment: parseDecimal(minimumPayment),
      interestRate: parseDecimal(interestRate),
      tier,
      bossName: generateBossName(tier, creditor.trim()),
      defeatedAt: isDefeated ? debt.defeatedAt ?? Date.now() : undefined,
      isRevolving,
    });
  };

  const handleClose = async () => {
    const confirmed = await confirm(
      "You won't be able to attack or reborrow against it anymore.",
      { title: `Close ${debt.creditor}?`, confirmLabel: 'Close', variant: 'danger' }
    );
    if (!confirmed) return;
    onSave({ ...debt, closedAt: debt.closedAt ?? Date.now() });
  };

  const handleReopen = () => {
    onSave({ ...debt, closedAt: undefined });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 rounded-lg border border-arcane-gold bg-black/40 space-y-3"
    >
      <Input
        label="Creditor / Bank Name"
        value={creditor}
        onChange={(e) => setCreditor(e.target.value)}
      />
      <Input
        label="Total Amount"
        type="text"
        inputMode="decimal"
        value={totalAmount}
        onChange={(e) => setTotalAmount(e.target.value)}
      />
      <Input
        label="Amount Paid So Far"
        type="text"
        inputMode="decimal"
        value={paidAmount}
        onChange={(e) => setPaidAmount(e.target.value)}
      />
      <p className="text-[10px] text-slate-500 -mt-2">
        Corrects the boss's remaining HP directly — this doesn't log a payment or earn XP.
      </p>
      <Input
        label="Minimum Monthly Payment"
        type="text"
        inputMode="decimal"
        value={minimumPayment}
        onChange={(e) => setMinimumPayment(e.target.value)}
      />
      <Input
        label="Interest Rate % (APR, yearly)"
        type="text"
        inputMode="decimal"
        value={interestRate}
        onChange={(e) => setInterestRate(e.target.value)}
      />

      <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
        <input
          type="checkbox"
          checked={isRevolving}
          onChange={(e) => setIsRevolving(e.target.checked)}
          className="h-4 w-4 accent-arcane-gold"
        />
        This is a credit line (I can reborrow against it)
      </label>

      <div className="flex gap-2">
        <Button type="submit" variant="primary" disabled={!canSave} className="w-full">
          Save Changes
        </Button>
        <Button type="button" variant="outline" onClick={onCancel} className="w-full">
          Cancel
        </Button>
      </div>

      {debt.isRevolving && (
        <div className="pt-2 border-t border-arcane-navy">
          {debt.closedAt ? (
            <Button type="button" variant="outline" onClick={handleReopen} className="w-full">
              Reopen Credit Line
            </Button>
          ) : (
            <Button type="button" variant="danger" onClick={handleClose} className="w-full">
              Close Credit Line
            </Button>
          )}
        </div>
      )}
    </form>
  );
};

export default EditDebtForm;
