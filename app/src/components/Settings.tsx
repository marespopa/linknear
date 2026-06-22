import { useId, useRef, useState, type ChangeEvent } from 'react';
import { useAtom } from 'jotai';
import { Download, Upload } from 'lucide-react';
import Button from './forms/Button';
import Input from './forms/Input';
import {
  currencyAtom,
  debtsAtom,
  playerAtom,
  strategyAtom,
  unlockedAchievementsAtom,
} from '../store/atoms';
import type { Debt, Player } from '../logic/types';
import type { Strategy } from '../logic/strategy';
import { useConfirm } from '../hooks/useConfirm';

interface SaveFile {
  version: 1;
  exportedAt: string;
  debts: Debt[];
  player: Player;
  strategy: Strategy;
  unlockedAchievements: string[];
  currency: string;
}

const Settings: React.FC = () => {
  const [currency, setCurrency] = useAtom(currencyAtom);
  const [player, setPlayer] = useAtom(playerAtom);
  const [debts, setDebts] = useAtom(debtsAtom);
  const [strategy, setStrategy] = useAtom(strategyAtom);
  const [unlockedAchievements, setUnlockedAchievements] = useAtom(unlockedAchievementsAtom);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const { confirm } = useConfirm();

  const handleExport = () => {
    const save: SaveFile = {
      version: 1,
      exportedAt: new Date().toISOString(),
      debts,
      player,
      strategy,
      unlockedAchievements,
      currency,
    };

    const blob = new Blob([JSON.stringify(save, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `linknear-save-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as Partial<SaveFile>;

      if (!Array.isArray(data.debts) || !data.player) {
        throw new Error('This file does not look like a LinkNear save.');
      }

      const confirmed = await confirm(
        'It will overwrite your current debts, progress, and achievements.',
        { title: 'Import this save?', confirmLabel: 'Import', variant: 'danger' }
      );
      if (!confirmed) return;

      setDebts(data.debts);
      setPlayer(data.player);
      if (data.strategy) setStrategy(data.strategy);
      if (Array.isArray(data.unlockedAchievements)) {
        setUnlockedAchievements(data.unlockedAchievements);
      }
      if (data.currency) setCurrency(data.currency);
    } catch (err) {
      setImportError(
        err instanceof Error ? err.message : 'Could not read this save file.'
      );
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-black/40 p-4 rounded-lg text-sm text-slate-300 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-arcane-navy rounded-lg">
        <Input
          type="text"
          placeholder="Adventurer"
          value={player.name}
          label="Hero Name"
          onChange={(e) => setPlayer({ ...player, name: e.target.value })}
        />
        <p className="text-xs text-arcane-gold">
          Your name as it appears on the Player card.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-arcane-navy rounded-lg">
        <Input
          type="text"
          placeholder="Enter a symbol..."
          value={currency}
          label="Currency Symbol"
          onChange={(e) => setCurrency(e.target.value)}
        />
        <p className="text-xs text-arcane-gold">
          Set your preferred currency symbol (e.g., $, €, ¥).
        </p>
      </div>

      <div className="p-4 border border-arcane-navy rounded-lg space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-display">
          Game Data
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" className="w-full" onClick={handleExport}>
            <Download size={14} />
            Export Save
          </Button>
          <label
            htmlFor={fileInputId}
            className="min-h-11 px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest border border-arcane-navy text-arcane-gold hover:border-arcane-gold hover:text-arcane-gold-light transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 w-full"
          >
            <Upload size={14} />
            Import Save
          </label>
          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="application/json"
            onChange={handleImport}
            className="sr-only"
          />
        </div>
        <p className="text-xs text-arcane-gold">
          Export downloads your debts, XP, level, and achievements as a backup file. Import
          restores one — this overwrites your current progress.
        </p>
        {importError && <p className="text-xs text-red-400">{importError}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-center p-4 border border-arcane-navy rounded-lg">
        <Button
          variant="danger"
          className="w-full md:w-auto"
          onClick={async () => {
            const confirmed = await confirm('This cannot be undone.', {
              title: 'Reset all progress?',
              confirmLabel: 'Reset',
              variant: 'danger',
            });
            if (confirmed) {
              localStorage.clear();
              window.location.reload();
            }
          }}
        >
          Reset Progress
        </Button>
        <p className="text-xs text-arcane-gold">
          Warning: This permanently clears all debts, XP, and achievements.
        </p>
      </div>
    </div>
  );
};

export default Settings;
