import { Lightbulb } from 'lucide-react';
import { useAtomValue } from 'jotai';
import { currencyAtom, debtsAtom, playerAtom, strategyAtom } from '../../store/atoms.ts';
import { getSuggestions } from '../../logic/suggestions.ts';

const SuggestionsPanel = () => {
  const debts = useAtomValue(debtsAtom);
  const player = useAtomValue(playerAtom);
  const strategy = useAtomValue(strategyAtom);
  const currency = useAtomValue(currencyAtom);

  const suggestions = getSuggestions(debts, player, strategy, currency);

  if (suggestions.length === 0) {
    return (
      <p className="text-xs text-slate-500">
        Nothing urgent right now — keep slaying.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((s) => (
        <div key={s.id} className="flex items-start gap-3 border border-arcane-navy rounded-lg p-4">
          <Lightbulb size={16} className="text-arcane-gold mt-0.5 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-arcane-gold-light uppercase tracking-wide font-display">
              {s.title}
            </p>
            <p className="text-xs text-slate-400 mt-1">{s.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SuggestionsPanel;
