import { useState } from 'react';
import { useSetAtom } from 'jotai';
import { currentViewAtom } from '../store/atoms.ts';
import SectionHeader from '../components/ui/SectionHeader.tsx';
import SetupWizard from '../components/debtslayer/SetupWizard.tsx';
import ImportWizard from '../components/debtslayer/ImportWizard.tsx';

type SetupTab = 'manual' | 'import';

const TABS: { id: SetupTab; label: string }[] = [
  { id: 'manual', label: 'Manual Entry' },
  { id: 'import', label: 'Import PDF' },
];

const Setup = () => {
  const setView = useSetAtom(currentViewAtom);
  const [tab, setTab] = useState<SetupTab>('manual');

  return (
    <section className="space-y-4">
      <SectionHeader title="Setup" />

      <div className="flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`font-display px-3 py-1.5 text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${
              tab === item.id
                ? 'border-arcane-gold text-arcane-gold'
                : 'border-arcane-navy text-slate-400 hover:border-arcane-gold hover:text-arcane-gold-light'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'manual' ? (
        <SetupWizard onComplete={() => setView('dashboard')} />
      ) : (
        <ImportWizard onComplete={() => setView('dashboard')} />
      )}
    </section>
  );
};

export default Setup;
