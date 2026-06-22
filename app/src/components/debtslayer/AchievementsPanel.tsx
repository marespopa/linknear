import { Lock, Trophy } from 'lucide-react';
import { useAchievements } from '../../hooks/useAchievements.ts';

const AchievementsPanel = () => {
  const { achievements, unlockedCount } = useAchievements();

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="uppercase text-[10px] text-slate-500">Achievements</p>
        <span className="text-[10px] text-slate-500">
          {unlockedCount} / {achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {achievements.map((a) => (
          <div
            key={a.id}
            className={`flex items-start gap-3 border rounded p-3 transition-all duration-500 ${
              a.unlocked
                ? 'border-arcane-gold/60 bg-arcane-gold/5'
                : 'border-arcane-navy opacity-50'
            }`}
          >
            {a.unlocked ? (
              <Trophy size={16} className="text-arcane-gold-light mt-0.5 shrink-0" />
            ) : (
              <Lock size={16} className="text-slate-500 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={`text-xs uppercase tracking-wide ${
                  a.unlocked ? 'text-arcane-gold-light' : 'text-slate-400'
                }`}
              >
                {a.title}
              </p>
              <p className="text-[11px] text-slate-500">{a.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AchievementsPanel;
