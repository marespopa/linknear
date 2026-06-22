import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react';
import {
  currencyAtom,
  currentViewAtom,
  hasOnboardedAtom,
  playerAtom,
  themeAtom,
  type Theme,
} from '../store/atoms.ts';
import { getTierLabel, type BossTier } from '../logic/boss.ts';
import { TIER_ICONS, TIER_COLORS } from './debtslayer/BossCard.tsx';
import HPBar from './ui/HPBar.tsx';
import Button from './forms/Button.tsx';
import Input from './forms/Input.tsx';

const BESTIARY_ORDER: BossTier[] = [
  'Goblin',
  'DarkElf',
  'Troll',
  'Wyrm',
  'Archlich',
];

const CURRENCY_OPTIONS = ['$', '€', '£', '¥', 'lei'];

const STEP_COUNT = 5;

const Onboarding = () => {
  const setView = useSetAtom(currentViewAtom);
  const setHasOnboarded = useSetAtom(hasOnboardedAtom);
  const setPlayer = useSetAtom(playerAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const [currency, setCurrency] = useAtom(currencyAtom);
  const [name, setName] = useState('');
  const [step, setStep] = useState(0);

  const start = () => {
    setPlayer((prev) => ({ ...prev, name: name.trim() || 'Adventurer' }));
    setHasOnboarded(true);
    setView('setup');
  };

  return (
    <div className="min-h-screen bg-arcane-black text-slate-300 font-sans flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6 border border-arcane-navy rounded-lg p-8 bg-black/40">
        <h1 className="font-display text-2xl uppercase tracking-[0.3em] text-arcane-gold-light">
          LinkNear
        </h1>

        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: STEP_COUNT }, (_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-arcane-gold' : 'w-1.5 bg-arcane-navy'
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div className="space-y-5 animate-[pop-in_0.25s_ease-out]">
            <p className="text-xs uppercase tracking-widest text-arcane-gold font-display">
              The Realm Calls
            </p>
            <p className="text-sm text-slate-300">
              Beyond the ledgers and statements lies a realm under siege.
              Goblins, Dark Elves, Trolls, Wyrms, and even the dread Archlich
              have claimed your gold as their hoard. Only a debt-slayer brave
              enough to track every coin can drive them out.
            </p>
            <div className="flex justify-center gap-3">
              {BESTIARY_ORDER.map((tier) => {
                const TierIcon = TIER_ICONS[tier];
                return (
                  <div
                    key={tier}
                    className="flex flex-col items-center gap-1 w-14"
                  >
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center ${TIER_COLORS[tier].bg}`}
                    >
                      <TierIcon size={20} className={TIER_COLORS[tier].icon} />
                    </div>
                    <span className="text-[8px] uppercase text-slate-500 leading-tight">
                      {getTierLabel(tier).split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-[pop-in_0.25s_ease-out]">
            <p className="text-xs uppercase tracking-widest text-arcane-gold font-display">
              How To Fight
            </p>
            <p className="text-sm text-slate-300">
              Every debt is a monster with HP equal to its balance. Log a
              payment to attack — pay more than the minimum to land a{' '}
              <span className="text-arcane-gold-light">Critical Hit</span>.
              Defeat a monster fully to claim its bounty in XP.
            </p>
            <div className="border border-arcane-navy rounded-lg p-3 text-left space-y-2">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                The Chase Goblin Skulker
              </p>
              <HPBar
                current={1700}
                max={4250}
                label={`${currency}1,700 / ${currency}4,250`}
              />
              <p className="text-[10px] text-slate-500">
                One good hit, and this Goblin falls.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-[pop-in_0.25s_ease-out]">
            <p className="text-xs uppercase tracking-widest text-arcane-gold font-display">
              Choose Your Realm
            </p>
            <p className="text-sm text-slate-300">
              Walk the realm by torchlight, or under open sky — pick the look of
              your campaign. You can change this anytime.
            </p>
            <div className="flex gap-2">
              {(
                [
                  { id: 'dark', label: 'Shadow Realm', Icon: Moon },
                  { id: 'light', label: 'Sunlit Realm', Icon: Sun },
                ] as { id: Theme; label: string; Icon: typeof Moon }[]
              ).map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTheme(id)}
                  className={`flex-1 font-display min-h-16 px-2 py-2 text-[10px] uppercase tracking-widest border transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    theme === id
                      ? 'border-arcane-gold text-arcane-gold'
                      : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
                  }`}
                >
                  <Icon size={18} />
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-[pop-in_0.25s_ease-out]">
            <p className="text-xs uppercase tracking-widest text-arcane-gold font-display">
              Choose Your Coin
            </p>
            <p className="text-sm text-slate-300">
              Every bounty, every payment — shown in the coin of your realm.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {CURRENCY_OPTIONS.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => setCurrency(symbol)}
                  className={`min-h-11 min-w-11 px-3 font-display text-sm border transition-all cursor-pointer ${
                    currency === symbol
                      ? 'border-arcane-gold text-arcane-gold'
                      : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
                  }`}
                >
                  {symbol}
                </button>
              ))}
            </div>
            <Input
              label="Or Enter A Custom Symbol"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="e.g. $, €, ¥"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4 animate-[pop-in_0.25s_ease-out]">
            <p className="text-xs uppercase tracking-widest text-arcane-gold font-display">
              Name Your Hero
            </p>
            <p className="text-sm text-slate-300">
              The bestiary is waiting. What shall the realm call you?
            </p>
            <Input
              label="Your Hero Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder=""
            />
          </div>
        )}

        <div className="flex gap-2">
          {step > 0 && (
            <Button
              type="button"
              variant="outline"
              className="shrink-0"
              onClick={() => setStep((s) => s - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
          )}
          {step < STEP_COUNT - 1 ? (
            <Button
              type="button"
              variant="primary"
              className="w-full"
              onClick={() => setStep((s) => s + 1)}
            >
              Continue
              <ChevronRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" onClick={start} className="w-full">
              Add Your First Monster
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
