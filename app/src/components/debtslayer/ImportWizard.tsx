import { useId, useState, type ChangeEvent } from 'react';
import { useAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import { debtsAtom, strategyAtom } from '../../store/atoms.ts';
import { getBossTier, generateBossName } from '../../logic/boss.ts';
import {
  extractTextFromPdf,
  parseCreditBureauReport,
  isRevolvingAccountType,
  type ExtractedDebt,
} from '../../logic/pdfImport.ts';
import type { Strategy } from '../../logic/strategy.ts';
import { parseDecimal } from '../../logic/currency.ts';
import Input from '../forms/Input.tsx';
import Button from '../forms/Button.tsx';

type EditableField =
  | 'nameInput'
  | 'creditorInput'
  | 'totalAmountInput'
  | 'currentBalanceInput'
  | 'monthlyPaymentInput'
  | 'interestRateInput';

interface DraftRow extends ExtractedDebt {
  draftId: string;
  nameInput: string;
  creditorInput: string;
  totalAmountInput: string;
  currentBalanceInput: string;
  monthlyPaymentInput: string;
  interestRateInput: string;
  isRevolvingInput: boolean;
}

interface ImportWizardProps {
  onComplete?: () => void;
}

function isRowValid(row: DraftRow): boolean {
  return (
    row.nameInput.trim() !== '' &&
    row.creditorInput.trim() !== '' &&
    parseDecimal(row.totalAmountInput) > 0 &&
    parseDecimal(row.currentBalanceInput) >= 0 &&
    parseDecimal(row.monthlyPaymentInput) > 0 &&
    row.interestRateInput !== '' &&
    parseDecimal(row.interestRateInput) >= 0
  );
}

const ImportWizard = ({ onComplete }: ImportWizardProps) => {
  const fileInputId = useId();
  const [, setDebts] = useAtom(debtsAtom);
  const [strategy, setStrategy] = useAtom(strategyAtom);
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<DraftRow[] | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [step, setStep] = useState(0);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);
    setError(null);
    setRows(null);
    setStep(0);

    try {
      const text = await extractTextFromPdf(file);
      const extracted = parseCreditBureauReport(text).filter((d) => d.isActive);

      if (extracted.length === 0) {
        setError('No active debts found in this report.');
        return;
      }

      setRows(
        extracted.map((debt) => ({
          ...debt,
          draftId: nanoid(),
          nameInput: debt.accountType,
          creditorInput: debt.creditor,
          totalAmountInput: String(debt.totalAmount),
          currentBalanceInput: String(debt.currentBalance),
          monthlyPaymentInput: '',
          interestRateInput: '',
          isRevolvingInput: isRevolvingAccountType(debt.accountType),
        }))
      );
    } catch {
      setError('Could not read this PDF. Make sure it is a Biroul de Credit report.');
    } finally {
      setIsParsing(false);
    }
  };

  const updateRow = (draftId: string, field: EditableField, value: string) => {
    setRows((prev) =>
      prev
        ? prev.map((row) => (row.draftId === draftId ? { ...row, [field]: value } : row))
        : prev
    );
  };

  const setRowRevolving = (draftId: string, value: boolean) => {
    setRows((prev) =>
      prev
        ? prev.map((row) => (row.draftId === draftId ? { ...row, isRevolvingInput: value } : row))
        : prev
    );
  };

  const removeRow = (draftId: string) => {
    setRows((prev) => (prev ? prev.filter((row) => row.draftId !== draftId) : prev));
    setStep((prev) => Math.max(0, Math.min(prev, (rows?.length ?? 1) - 2)));
  };

  const canConfirm = rows !== null && rows.length > 0 && rows.every(isRowValid);

  const handleConfirm = () => {
    if (!rows || !canConfirm) return;

    setDebts((prev) => [
      ...prev,
      ...rows.map((row) => {
        const totalAmount = parseDecimal(row.totalAmountInput);
        const tier = getBossTier(totalAmount);
        const creditor = row.creditorInput.trim();
        return {
          id: nanoid(),
          name: row.nameInput.trim(),
          creditor,
          totalAmount,
          currentBalance: Math.min(totalAmount, parseDecimal(row.currentBalanceInput)),
          minimumPayment: parseDecimal(row.monthlyPaymentInput),
          interestRate: parseDecimal(row.interestRateInput),
          bossName: generateBossName(tier, creditor),
          tier,
          chain: [],
          isRevolving: row.isRevolvingInput,
        };
      }),
    ]);

    onComplete?.();
  };

  const total = rows?.length ?? 0;
  const isReview = rows !== null && step >= total;
  const currentRow = rows && !isReview ? rows[step] : null;

  return (
    <div className="space-y-6">
      <div className="border border-arcane-navy rounded-lg p-4 space-y-3">
        <label
          htmlFor={fileInputId}
          className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display"
        >
          Biroul de Credit Report (PDF)
        </label>

        <div className="flex items-center gap-3">
          <label
            htmlFor={fileInputId}
            className="px-3 py-2 text-[10px] font-display font-bold uppercase tracking-widest border border-arcane-navy text-arcane-gold hover:border-arcane-gold hover:text-arcane-gold-light transition-all active:scale-95 cursor-pointer inline-flex items-center gap-2"
          >
            <Upload size={14} />
            Choose PDF File
          </label>
          <span className="text-xs text-slate-500 truncate">
            {fileName ?? 'No file selected'}
          </span>
        </div>

        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          onChange={handleFile}
          className="sr-only"
        />

        {isParsing && <p className="text-xs text-slate-500">Parsing report...</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>

      {rows && rows.length > 0 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-slate-500">
              <span>
                {isReview ? 'Review' : `Credit ${step + 1} of ${total}`}
              </span>
              <span className="text-arcane-gold">
                {rows.filter(isRowValid).length} / {total} confirmed
              </span>
            </div>
            <div className="w-full h-1.5 bg-black border border-arcane-navy rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-arcane-blue to-arcane-gold transition-all duration-500 ease-out"
                style={{
                  width: `${total > 0 ? (Math.min(step, total) / total) * 100 : 0}%`,
                }}
              />
            </div>
          </div>

          {currentRow && (
            <div
              key={currentRow.draftId}
              className="border border-arcane-gold/40 rounded-lg p-4 space-y-3 animate-[pop-in_0.25s_ease-out]"
            >
              <div className="flex justify-between items-baseline">
                <h4 className="text-sm uppercase tracking-wider text-arcane-gold-light">
                  {currentRow.nameInput || currentRow.accountType}
                </h4>
                <Button
                  variant="danger"
                  onClick={() => removeRow(currentRow.draftId)}
                >
                  Skip
                </Button>
              </div>

              {currentRow.overdueAmount > 0 && (
                <p className="text-xs text-red-400">
                  {currentRow.overdueAmount.toLocaleString()} overdue, per the report
                </p>
              )}
              <p className="text-[10px] text-slate-600 uppercase">
                Report status: {currentRow.status || 'unknown'}
                {currentRow.lastUpdated ? ` · updated ${currentRow.lastUpdated}` : ''}
              </p>

              <Input
                label="Debt Name"
                value={currentRow.nameInput}
                onChange={(e) => updateRow(currentRow.draftId, 'nameInput', e.target.value)}
                placeholder="e.g. Credit de consum"
              />
              <Input
                label="Creditor / Bank Name"
                value={currentRow.creditorInput}
                onChange={(e) => updateRow(currentRow.draftId, 'creditorInput', e.target.value)}
                placeholder="e.g. Bank A"
              />
              <Input
                label="Total Amount"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 5000 or 5000,50"
                value={currentRow.totalAmountInput}
                onChange={(e) =>
                  updateRow(currentRow.draftId, 'totalAmountInput', e.target.value)
                }
              />
              <Input
                label="Current Balance"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 4500 or 4500,50"
                value={currentRow.currentBalanceInput}
                onChange={(e) =>
                  updateRow(currentRow.draftId, 'currentBalanceInput', e.target.value)
                }
              />
              <Input
                label="Monthly Payment"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 150 or 150,50"
                value={currentRow.monthlyPaymentInput}
                onChange={(e) =>
                  updateRow(currentRow.draftId, 'monthlyPaymentInput', e.target.value)
                }
              />
              <Input
                label="Interest Rate % (APR, yearly)"
                type="text"
                inputMode="decimal"
                placeholder="e.g. 12.5 or 12,5"
                value={currentRow.interestRateInput}
                onChange={(e) =>
                  updateRow(currentRow.draftId, 'interestRateInput', e.target.value)
                }
              />
              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentRow.isRevolvingInput}
                  onChange={(e) => setRowRevolving(currentRow.draftId, e.target.checked)}
                  className="h-4 w-4 accent-arcane-gold"
                />
                This is a credit line (I can reborrow against it)
              </label>

              <div className="flex gap-2 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  disabled={step === 0}
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  className="w-full"
                  disabled={!isRowValid(currentRow)}
                  onClick={() => setStep((s) => s + 1)}
                >
                  {step === total - 1 ? 'Review All →' : 'Next Credit'}
                  {step < total - 1 && <ChevronRight size={14} />}
                </Button>
              </div>
            </div>
          )}

          {isReview && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Confirmed all {total} credit{total === 1 ? '' : 's'}. Double-check before slaying.
              </p>
              {rows.map((row) => (
                <button
                  key={row.draftId}
                  type="button"
                  onClick={() => setStep(rows.indexOf(row))}
                  className="w-full flex justify-between items-center border border-arcane-navy rounded p-3 text-xs text-left hover:border-arcane-gold transition-colors cursor-pointer"
                >
                  <span className="text-arcane-gold-light">
                    {row.creditorInput} — {row.nameInput || row.accountType}
                    {row.isRevolvingInput && (
                      <span className="text-arcane-blue"> · revolving</span>
                    )}
                  </span>
                  <span className="text-slate-500">
                    {(parseDecimal(row.currentBalanceInput) || 0).toLocaleString()} /{' '}
                    {(parseDecimal(row.totalAmountInput) || 0).toLocaleString()}
                  </span>
                </button>
              ))}

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

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => setStep(total - 1)}
                >
                  <ChevronLeft size={14} />
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                  className="w-full"
                >
                  Confirm &amp; Start Slaying →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImportWizard;
