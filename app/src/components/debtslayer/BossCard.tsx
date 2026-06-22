import { useState } from 'react';
import { Crown, Flame, Pencil, ShieldAlert, Skull, Swords } from 'lucide-react';
import type { Debt } from '../../logic/types.ts';
import {
  getDebtQuality,
  getTierLabel,
  type BossTier,
} from '../../logic/boss.ts';
import { parseDecimal } from '../../logic/currency.ts';
import HPBar from '../ui/HPBar.tsx';
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
  const [isSelected, setIsSelected] = useState(false);

  const isClosed = Boolean(debt.closedAt);
  // A paid-off revolving line stays open (and reborrow-able) until explicitly closed —
  // only a non-revolving payoff is treated as a permanent defeat.
  const isDefeated = Boolean(debt.defeatedAt) && !isClosed && !debt.isRevolving;
  const isDone = isDefeated || isClosed;
  const isRevolvingOpen = Boolean(debt.isRevolving) && !isClosed;
  const TierIcon = TIER_ICONS[debt.tier];
  const canReborrow = isRevolvingOpen && Boolean(onReborrow);
  const canAttack = debt.currentBalance > 0 && Boolean(onAttack);

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
  };

  const frameClasses = isDone
    ? 'border-arcane-black bg-black/20 opacity-60'
    : isRevolvingOpen
      ? 'border-arcane-blue bg-black/30'
      : 'border-arcane-navy-light bg-black/30';

  return (
    <div className="w-full h-full max-w-[260px]">
      <div
        key={hitFx?.id ?? 'idle'}
        onClick={() => setIsSelected((s) => !s)}
        className={`relative h-full rounded-xl border-2 overflow-hidden flex flex-col cursor-pointer transition-all ${frameClasses} ${
          isSelected
            ? 'ring-2 ring-offset-2 ring-offset-arcane-black ring-white'
            : ''
        } ${hitFx ? 'animate-[shake_0.4s_ease-in-out]' : ''}`}
      >
        {hitFx && (
          <div className="absolute inset-x-0 top-12 flex justify-center pointer-events-none z-20">
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

        {rank !== undefined && (
          <span className="absolute top-1.5 left-1.5 z-10 min-w-[18px] h-[18px] px-1 rounded-full bg-arcane-navy border border-arcane-gold flex items-center justify-center text-[9px] font-display font-bold text-arcane-gold-light">
            {rank}
          </span>
        )}
        {onEdit && (
          <span
            role="button"
            tabIndex={0}
            aria-label="Edit debt details"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                onEdit();
              }
            }}
            className="absolute top-1 right-1 z-10 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-arcane-gold-light hover:bg-black/40 cursor-pointer"
          >
            <Pencil size={13} />
          </span>
        )}

        {/* Art panel */}
        <div
          className={`h-16 flex items-center justify-center shrink-0 ${
            isDone ? 'bg-slate-900' : TIER_COLORS[debt.tier].bg
          }`}
        >
          {isDone ? (
            <span className="text-2xl leading-none">{'\u{1F480}'}</span>
          ) : (
            <TierIcon size={28} className={TIER_COLORS[debt.tier].icon} />
          )}
        </div>

        {/* Name plate */}
        <div className="px-2.5 py-2 flex flex-col gap-1.5 bg-black/40">
          <div>
            <h3 className="font-display text-[11px] font-semibold text-arcane-gold-light leading-tight truncate">
              {debt.bossName}
            </h3>
            <p className="text-[9px] text-slate-500 truncate">
              {getTierLabel(debt.tier)} · {debt.creditor}
              {isRevolvingOpen && (
                <span className="text-arcane-blue"> · ↻</span>
              )}
            </p>
          </div>
          <HPBar
            current={debt.currentBalance}
            max={debt.totalAmount}
            mode={isRevolvingOpen ? 'usage' : 'hp'}
            label={`${currency}${debt.currentBalance.toLocaleString()} / ${currency}${debt.totalAmount.toLocaleString()}`}
          />
          {isRevolvingOpen && (
            <p className={`text-[9px] -mt-1 ${utilizationNote.color}`}>
              {utilizationNote.text}
            </p>
          )}
        </div>

        {/* APR / quality row */}
        <div className="flex items-center gap-1.5 px-2.5 pb-1.5 shrink-0">
          <span
            className={`flex-1 text-center rounded-md py-1 text-[10px] font-semibold ${aprChip}`}
          >
            {debt.interestRate}% APR
          </span>
          {debtQuality !== 'moderate' && !isDone && (
            <span
              className={
                debtQuality === 'good'
                  ? 'text-emerald-400 text-[9px]'
                  : 'text-red-400 text-[9px]'
              }
            >
              {debtQuality === 'good' ? 'Good debt' : 'High-cost'}
            </span>
          )}
        </div>

        {/* Action area — always on the front, no flip required */}
        <div className="flex-1 flex flex-col justify-end px-2.5 pb-2.5 pt-1 border-t border-arcane-navy">
          {isClosed && debt.closedAt ? (
            <p className="text-[10px] uppercase text-slate-600">
              Closed {new Date(debt.closedAt).toLocaleDateString()}
            </p>
          ) : isDefeated && debt.defeatedAt ? (
            <p className="text-[10px] uppercase text-slate-600">
              Defeated {new Date(debt.defeatedAt).toLocaleDateString()}
            </p>
          ) : (
            (canAttack || canReborrow) && (
              <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                {canAttack && canReborrow && (
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAction('attack')}
                      className={`flex-1 min-h-9 text-[9px] font-display font-bold uppercase tracking-widest border transition-all cursor-pointer ${
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
                      className={`flex-1 min-h-9 text-[9px] font-display font-bold uppercase tracking-widest border transition-all cursor-pointer ${
                        action === 'reborrow'
                          ? 'border-arcane-blue text-arcane-blue'
                          : 'border-arcane-navy text-slate-400 hover:border-arcane-blue hover:text-arcane-blue'
                      }`}
                    >
                      ↻ Reborrow
                    </button>
                  </div>
                )}

                <div className="flex gap-1">
                  {presets.map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAmount(String(preset.value))}
                      disabled={preset.value <= 0}
                      className="flex-1 min-h-9 px-1 text-[8px] uppercase tracking-wide border border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light transition-colors cursor-pointer disabled:opacity-40 disabled:pointer-events-none"
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
                  className="w-full"
                  disabled={isPaying || parsedAmount <= 0}
                  onClick={handleSubmit}
                >
                  {action === 'attack' ? '⚔ Attack' : '↻ Reborrow'}
                </Button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};

export default BossCard;
