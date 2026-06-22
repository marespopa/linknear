import { Crown, Flame, Shield, Sparkles, Swords, User } from 'lucide-react';
import { usePlayer } from '../../hooks/usePlayer.ts';
import { useStreak } from '../../hooks/useStreak.ts';
import XPBar from '../ui/XPBar.tsx';

const TITLE_ICONS: Record<string, typeof User> = {
  Novice: User,
  Adept: Shield,
  Champion: Swords,
  Master: Crown,
  Archmage: Sparkles,
};

const STREAK_COLOR: Record<string, string> = {
  active: 'text-arcane-gold',
  grace: 'text-orange-400',
  broken: 'text-slate-500',
};

const PlayerCard = () => {
  const player = usePlayer();
  const { streakCount, status } = useStreak();
  const TitleIcon = TITLE_ICONS[player.title] ?? User;

  return (
    <div className="bg-black/40 p-4 rounded-lg border border-arcane-navy space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full border border-arcane-gold/50 bg-black/60 flex items-center justify-center shrink-0">
            <TitleIcon size={18} className="text-arcane-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="font-display uppercase tracking-wide text-sm text-arcane-gold-light truncate">
              {player.name || 'Adventurer'}
            </h3>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">
              {player.title}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center w-10 h-10 rounded-full border border-arcane-navy bg-black/60 shrink-0">
          <span className="text-[8px] uppercase text-slate-500 leading-none">Lv</span>
          <span className="font-display text-xs text-arcane-gold-light leading-none">
            {player.level}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-500">
          <span>XP</span>
          <span className="text-slate-400">
            {player.progress.current.toLocaleString()}
            {player.progress.needed > 0
              ? ` / ${player.progress.needed.toLocaleString()}`
              : ' (MAX)'}
          </span>
        </div>
        <XPBar percent={player.progress.percent} />
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <span
          className={`flex items-center gap-1 uppercase tracking-widest font-bold ${STREAK_COLOR[status]}`}
        >
          <Flame size={12} />
          Streak {streakCount}mo ({status})
        </span>
        {player.multiplier > 1 && (
          <span className="text-arcane-gold uppercase tracking-widest font-bold">
            {player.multiplier}x XP
          </span>
        )}
      </div>
    </div>
  );
};

export default PlayerCard;
