import { useState, type FormEvent } from 'react';
import { useAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { debtsAtom, strategyAtom } from '../../store/atoms.ts';
import { getBossTier, generateBossName } from '../../logic/boss.ts';
import { parseDecimal } from '../../logic/currency.ts';
import type { Strategy } from '../../logic/strategy.ts';
import Input from '../forms/Input.tsx';
import Button from '../forms/Button.tsx';

const EMPTY_FORM = {
  name: '',
  creditor: '',
  totalAmount: '',
  minimumPayment: '',
  interestRate: '',
  isRevolving: false,
};

interface SetupWizardProps {
  onComplete?: () => void;
}

const SetupWizard = ({ onComplete }: SetupWizardProps) => {
  const [debts, setDebts] = useAtom(debtsAtom);
  const [strategy, setStrategy] = useAtom(strategyAtom);
  const [form, setForm] = useState(EMPTY_FORM);

  const handleAdd = (e: FormEvent) => {
    e.preventDefault();

    const totalAmount = parseDecimal(form.totalAmount);
    const minimumPayment = parseDecimal(form.minimumPayment) || 0;
    const interestRate = parseDecimal(form.interestRate) || 0;

    if (!form.name || !totalAmount) return;

    const tier = getBossTier(totalAmount);

    const creditor = form.creditor || form.name;

    setDebts((prev) => [
      ...prev,
      {
        id: nanoid(),
        name: form.name,
        creditor,
        totalAmount,
        currentBalance: totalAmount,
        minimumPayment,
        interestRate,
        bossName: generateBossName(tier, creditor),
        tier,
        chain: [],
        isRevolving: form.isRevolving,
      },
    ]);

    setForm(EMPTY_FORM);
  };

  const handleRemove = (id: string) => {
    setDebts((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAdd} className="space-y-3 border border-arcane-navy rounded-lg p-4">
        <Input
          label="Debt Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Card A"
        />
        <Input
          label="Creditor"
          value={form.creditor}
          onChange={(e) => setForm({ ...form, creditor: e.target.value })}
          placeholder="Bank A"
        />
        <Input
          label="Total Amount"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 5000 or 5000,50"
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
        />
        <Input
          label="Minimum Monthly Payment"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 150 or 150,75"
          value={form.minimumPayment}
          onChange={(e) => setForm({ ...form, minimumPayment: e.target.value })}
        />
        <Input
          label="Interest Rate % (APR, yearly)"
          type="text"
          inputMode="decimal"
          placeholder="e.g. 12.5 or 12,5"
          value={form.interestRate}
          onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
        />
        <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={form.isRevolving}
            onChange={(e) => setForm({ ...form, isRevolving: e.target.checked })}
            className="h-4 w-4 accent-arcane-gold"
          />
          This is a credit line (I can reborrow against it)
        </label>
        <Button type="submit" className="w-full">Add Debt</Button>
      </form>

      {debts.length > 0 && (
        <div className="space-y-2">
          {debts.map((d) => (
            <div
              key={d.id}
              className="flex justify-between items-center border border-arcane-navy rounded p-3 text-xs text-arcane-gold"
            >
              <span>
                {d.bossName} — {d.currentBalance.toLocaleString()}
              </span>
              <Button variant="danger" onClick={() => handleRemove(d.id)}>
                Remove
              </Button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
          Strategy
        </label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value as Strategy)}
          className="bg-black border border-arcane-navy text-slate-300 text-base p-2 h-11 w-full outline-none focus:border-arcane-gold"
        >
          <option value="avalanche">Avalanche (highest interest first)</option>
          <option value="snowball">Snowball (smallest balance first)</option>
        </select>
      </div>

      <Button
        variant="primary"
        onClick={onComplete}
        disabled={debts.length === 0}
        className="w-full"
      >
        Confirm &amp; Start Slaying →
      </Button>
    </div>
  );
};

export default SetupWizard;
