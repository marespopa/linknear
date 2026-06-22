import { useState } from 'react';
import { Crown, Flame, Pencil, ShieldAlert, Skull, Swords, X } from 'lucide-react';
import type { Debt } from '../../logic/types.ts';
import {
  estimatePayoffMonths,
  formatPayoffDuration,
  getDebtQuality,
  getTierLabel,
  type BossTier,
} from '../../logic/boss.ts';
import { getCardColorOption } from '../../logic/cardColors.ts';
import { parseDecimal } from '../../logic/currency.ts';
import Input from '../forms/Input.tsx';
import Button from '../forms/Button.tsx';

export const TIER_ICONS: Record<BossTier, typeof Skull> = {
  Goblin: Skull,
  DarkElf: Swords,
  Troll: ShieldAlert,
  Wyrm: Flame,
  Archlich: Crown,
};

// Flat jewel-toned art-panel colors per tier, like rarity gems on a fantasy
// trading card — dark, saturated, no gradients.
export const TIER_COLORS: Record<BossTier, { bg: string; icon: string }> = {
  Goblin: { bg: 'bg-emerald-800', icon: 'text-emerald-200' },
  DarkElf: { bg: 'bg-violet-800', icon: 'text-violet-200' },
  Troll: { bg: 'bg-amber-800', icon: 'text-amber-200' },
  Wyrm: { bg: 'bg-red-800', icon: 'text-red-200' },
  Archlich: { bg: 'bg-slate-700', icon: 'text-slate-200' },
};

interface BossCardProps {
  debt: Debt;
  currency: string;
  // Position in the battlefield's strategy order (1 = front line). Omitted
  // for debts that are defeated/closed and no longer in the live order.
  rank?: number;
  onEdit?: () => void;
  onAttack?: (amount: number) => void;
  onReborrow?: (amount: number) => void;
  isPaying?: boolean;
}

const BossCard = ({
  debt,
  currency,
  rank,
  onEdit,
  onAttack,
  onReborrow,
  isPaying,
}: BossCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPayOpen, setIsPayOpen] = useState(false);

  const isClosed = Boolean(debt.closedAt);
  // A paid-off revolving line stays open (and reborrow-able) until explicitly closed —
  // only a non-revolving payoff is treated as a permanent defeat.
  const isDefeated = Boolean(debt.defeatedAt) && !isClosed && !debt.isRevolving;
  const isDone = isDefeated || isClosed;
  const isRevolvingOpen = Boolean(debt.isRevolving) && !isClosed;
  const TierIcon = TIER_ICONS[debt.tier];
  const canReborrow = isRevolvingOpen && Boolean(onReborrow);
  const canAttack = debt.currentBalance > 0 && Boolean(onAttack);
  // The back of the card is just stats/advice — nothing to flip to once a
  // debt is defeated/closed and there's no balance left to discuss.
  const canFlip = !isDone;
  const canPay = canAttack || canReborrow;

  const [action, setAction] = useState<'attack' | 'reborrow'>(
    canAttack ? 'attack' : 'reborrow'
  );
  const [amount, setAmount] = useState(String(debt.minimumPayment));
  const parsedAmount = parseDecimal(amount) || 0;

  const hpOrUsagePercent =
    debt.totalAmount > 0
      ? Math.round((debt.currentBalance / debt.totalAmount) * 100)
      : 0;
  const utilizationNote =
    hpOrUsagePercent > 60
      ? {
          text: 'High utilization hurts your FICO score',
          color: 'text-red-400',
        }
      : hpOrUsagePercent > 30
        ? {
            text: 'Elevated — pay down when you can',
            color: 'text-arcane-gold',
          }
        : {
            text: 'Healthy usage — no need to clear it to zero',
            color: 'text-arcane-blue',
          };

  const debtQuality = getDebtQuality(debt.interestRate);
  const aprChip = isDone
    ? 'bg-slate-800 text-slate-500'
    : debtQuality === 'good'
      ? 'bg-emerald-900/70 text-emerald-300'
      : debtQuality === 'bad'
        ? 'bg-red-900/70 text-red-300'
        : 'bg-arcane-navy text-slate-400';

  const availableToReborrow = Math.max(
    0,
    debt.totalAmount - debt.currentBalance
  );
  const attackPresets = [
    { label: '½ Min', value: Math.round(debt.minimumPayment * 0.5) },
    { label: 'Min', value: debt.minimumPayment },
    { label: '2× Min', value: Math.round(debt.minimumPayment * 2) },
  ];
  const reborrowPresets = [
    { label: '25%', value: Math.round(availableToReborrow * 0.25) },
    { label: '50%', value: Math.round(availableToReborrow * 0.5) },
    { label: 'Max', value: availableToReborrow },
  ];
  const presets = action === 'attack' ? attackPresets : reborrowPresets;

  const [hitFx, setHitFx] = useState<{
    id: number;
    text: string;
    positive: boolean;
  } | null>(null);

  const handleSubmit = () => {
    if (parsedAmount <= 0) return;
    const isReborrowAction = action === 'reborrow';
    if (isReborrowAction) {
      if (!onReborrow) return;
      onReborrow(parsedAmount);
    } else {
      if (!onAttack) return;
      onAttack(parsedAmount);
    }

    const isCriticalHit =
      !isReborrowAction && parsedAmount > debt.minimumPayment;
    setHitFx({
      id: Date.now(),
      text: isCriticalHit
        ? `Critical! -${currency}${parsedAmount.toLocaleString()}`
        : `${isReborrowAction ? '+' : '-'}${currency}${parsedAmount.toLocaleString()}`,
      positive: isReborrowAction,
    });
    window.setTimeout(() => setHitFx(null), 650);
    setAmount(String(debt.minimumPayment));
    setIsPayOpen(false);
  };

  const frameClasses = isDone
    ? 'border-arcane-black bg-black/20 opacity-60'
    : isRevolvingOpen
      ? 'border-arcane-blue bg-black/30'
      : 'border-arcane-navy-light bg-black/30';

  // The advice on the back — a one-line read on how to treat this debt.
  const advice =
    debtQuality === 'bad'
      ? 'High-cost debt — prioritize this. Extra payments save the most here.'
      : debtQuality === 'good'
        ? 'Low-cost debt — minimums are fine, no rush to clear it.'
        : 'Moderate rate — steady payments keep it in check.';

  // Minimum-payment payoff time, plus the same at double the minimum — so
  // the back makes the trade-off concrete: pay just the minimum and it
  // takes this long, pay more and here's how much faster it goes.
  const payoffAtMin = estimatePayoffMonths(
    debt.currentBalance,
    debt.interestRate,
    debt.minimumPayment
  );
  const payoffAtDouble = estimatePayoffMonths(
    debt.currentBalance,
    debt.interestRate,
    debt.minimumPayment * 2
  );

  // A manually picked bank color overrides the automatic tier color.
  const colorOverride = getCardColorOption(debt.cardColor);
  const artBg = isDone
    ? 'bg-slate-900'
    : colorOverride?.bg ?? TIER_COLORS[debt.tier].bg;
  const artIcon = colorOverride?.icon ?? TIER_COLORS[debt.tier].icon;

  // Shared between both faces so the boss is recognizable either way.
  const artPanel = (
    <div
      className={`relative h-16 flex items-center justify-center shrink-0 ${artBg}`}
    >
      {rank !== undefined && (
        <span className="absolute top-1.5 left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-arcane-navy border border-arcane-gold flex items-center justify-center text-[9px] font-display font-bold text-arcane-gold-light">
          {rank}
        </span>
      )}
      {isDone ? (
        <span className="text-2xl leading-none">{'\u{1F480}'}</span>
      ) : (
        <TierIcon size={28} className={artIcon} />
      )}
    </div>
  );

  const namePlate = (
    <div className="px-2.5 py-2 bg-black/40">
      <h3 className="font-display text-[11px] font-semibold text-arcane-gold-light leading-tight truncate">
        {debt.bossName}
      </h3>
      <p className="text-[9px] text-slate-500 truncate">
        {getTierLabel(debt.tier)} · {debt.creditor}
        {isRevolvingOpen && <span className="text-arcane-blue"> · ↻</span>}
      </p>
    </div>
  );

  // Front-only: a quiet, single-color indicator of how much is left to pay —
  // the detailed usage warnings/advice live on the back instead.
  const remainingIndicator = !isDone && (
    <div className="px-2.5 pb-2 bg-black/40">
      <div className="h-1.5 rounded-full bg-black/60 overflow-hidden">
        <div
          className="h-full rounded-full bg-arcane-gold/80"
          style={{ width: `${Math.min(100, hpOrUsagePercent)}%` }}
        />
      </div>
      <p className="mt-1 text-[9px] text-slate-500">
        <span className="text-arcane-gold-light font-semibold tabular-nums">
          {currency}{debt.currentBalance.toLocaleString()}
        </span>{' '}
        left of {currency}{debt.totalAmount.toLocaleString()}
      </p>
    </div>
  );

  const footerButtons = (
    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
      {canPay && (
        <button
          type="button"
          onClick={() => setIsPayOpen(true)}
          className="flex-1 min-h-10 text-[10px] font-display font-bold uppercase tracking-widest border border-arcane-gold text-arcane-gold hover:bg-arcane-gold/10 transition-colors cursor-pointer"
        >
          Pay
        </button>
      )}
      {onEdit && (
        <button
          type="button"
          aria-label="Edit debt details"
          onClick={onEdit}
          className="flex-1 min-h-10 px-3 flex items-center justify-center gap-1.5 text-[9px] font-display font-bold uppercase tracking-widest border border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light transition-colors cursor-pointer"
        >
          <Pencil size={12} /> Edit
        </button>
      )}
    </div>
  );

  return (
    <div className="relative w-full max-w-[260px] aspect-[3/4] flip-card-scene">
      <div
        key={hitFx?.id ?? 'idle'}
        onClick={() => canFlip && setIsFlipped((f) => !f)}
        className={`absolute inset-0 flip-card-card ${isFlipped ? 'is-flipped' : ''} ${
          canFlip ? 'cursor-pointer' : ''
        } ${hitFx ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      >
        {hitFx && (
          <div className="absolute inset-x-0 top-12 flex justify-center pointer-events-none z-30">
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-display font-bold whitespace-nowrap animate-[float-up_0.65s_ease-out_forwards] ${
                hitFx.positive
                  ? 'text-arcane-blue bg-black/70'
                  : 'text-red-400 bg-black/70'
              }`}
            >
              {hitFx.text}
            </span>
          </div>
        )}

        {/* Front face — basic identity card: art, name, how much is left */}
        <div
          className={`absolute inset-0 rounded-xl border-2 overflow-hidden flex flex-col flip-card-face ${frameClasses}`}
        >
          {artPanel}
          {namePlate}
          {remainingIndicator}

          <div className="flex-1 flex flex-col justify-end gap-1.5 px-2.5 pb-2.5 pt-1 border-t border-arcane-navy">
            {isClosed && debt.closedAt ? (
              <p className="text-[10px] uppercase text-slate-600">
                Closed {new Date(debt.closedAt).toLocaleDateString()}
              </p>
            ) : isDefeated && debt.defeatedAt ? (
              <p className="text-[10px] uppercase text-slate-600">
                Defeated {new Date(debt.defeatedAt).toLocaleDateString()}
              </p>
            ) : null}
            {footerButtons}
          </div>
        </div>

        {/* Back face — stats and advice; no name plate here, it's just the
            same text already on the front and costs space these need more. */}
        {canFlip && (
          <div
            className={`absolute inset-0 rounded-xl border-2 overflow-hidden flex flex-col flip-card-face flip-card-face-back ${frameClasses}`}
          >
            {artPanel}

            <div className="flex-1 flex flex-col gap-2 px-2.5 pb-1 pt-2 overflow-y-auto">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[8px] uppercase tracking-wide text-slate-500">
                    Remaining
                  </p>
                  <p className="text-[11px] font-semibold text-arcane-gold-light tabular-nums truncate">
                    {currency}{debt.currentBalance.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-wide text-slate-500">
                    Minimum / mo
                  </p>
                  <p className="text-[11px] font-semibold text-arcane-gold-light tabular-nums truncate">
                    {currency}{debt.minimumPayment.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${aprChip}`}
                >
                  {debt.interestRate}% APR
                </span>
              </div>
              {isRevolvingOpen && (
                <p className={`text-[9px] ${utilizationNote.color}`}>
                  {utilizationNote.text}
                </p>
              )}
              <p className="text-[10px] text-slate-400 leading-snug">
                {advice}
              </p>
              {debt.currentBalance > 0 && (
                <div className="text-[9px] uppercase tracking-wide text-slate-500 space-y-0.5">
                  <p>
                    Pay only the min:{' '}
                    <span
                      className={
                        payoffAtMin === null
                          ? 'text-red-400'
                          : 'text-arcane-gold-light'
                      }
                    >
                      {payoffAtMin === null
                        ? 'never pays off'
                        : formatPayoffDuration(payoffAtMin)}
                    </span>
                  </p>
                  {payoffAtDouble !== null && (
                    <p>
                      Pay 2× the min:{' '}
                      <span className="text-arcane-blue">
                        {formatPayoffDuration(payoffAtDouble)}
                      </span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="px-2.5 pb-2.5 pt-1 border-t border-arcane-navy">
              {footerButtons}
            </div>
          </div>
        )}
      </div>

      {/* Payment sheet — full attack/reborrow form, independent of card size */}
      {isPayOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 animate-[toast-in_0.15s_ease-out]"
          role="presentation"
          onClick={() => setIsPayOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm max-h-[85vh] overflow-y-auto rounded-t-xl sm:rounded-xl bg-arcane-black border border-arcane-navy animate-[pop-in_0.2s_ease-out]"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-arcane-navy">
              <h3 className="font-display text-sm font-semibold text-arcane-gold-light truncate">
                Pay {debt.bossName}
              </h3>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setIsPayOpen(false)}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-arcane-gold-light hover:bg-black/40 cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            <div className="flex flex-col gap-3 p-4">
              {canAttack && canReborrow && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAction('attack')}
                    className={`flex-1 min-h-10 text-[10px] font-display font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                      action === 'attack'
                        ? 'border-arcane-gold text-arcane-gold'
                        : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
                    }`}
                  >
                    ⚔ Attack
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction('reborrow')}
                    className={`flex-1 min-h-10 text-[10px] font-display font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                      action === 'reborrow'
                        ? 'border-arcane-blue text-arcane-blue'
                        : 'border-arcane-navy text-slate-400 hover:border-arcane-blue hover:text-arcane-blue'
                    }`}
                  >
                    ↻ Reborrow
                  </button>
                </div>
              )}

              <div className="flex gap-1.5">
                {presets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setAmount(String(preset.value))}
                    disabled={preset.value <= 0}
                    className="flex-1 min-h-10 px-1 text-[10px] uppercase tracking-wide border border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Input
                label="Amount"
                hideLabel
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`${currency}${debt.minimumPayment.toLocaleString()} min.`}
              />

              <Button
                variant="outline"
                className="w-full text-sm"
                disabled={isPaying || parsedAmount <= 0}
                onClick={handleSubmit}
              >
                {action === 'attack' ? '⚔ Attack' : '↻ Reborrow'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BossCard;
