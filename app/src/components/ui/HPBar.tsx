import { getBossHpPercent } from '../../logic/boss.ts';

interface HPBarProps {
  current: number;
  max: number;
  label?: string;
  // 'hp' (default): a boss's remaining balance — full bar is bad, low/critical
  // pulses red since it's about to be defeated.
  // 'usage': a revolving line's utilization — low is good, high hurts your
  // credit score, so the color ramp and pulse threshold flip accordingly.
  mode?: 'hp' | 'usage';
  title?: string;
}

const SEGMENT_COUNT = 10;

// Flat color bands (light → dark), no gradients — classic pixel-art fake
// shading applied across the lit segments left-to-right.
const HP_SHADES = ['bg-red-400', 'bg-red-500', 'bg-red-600', 'bg-red-700'];
const HP_CRITICAL_SHADES = ['bg-red-500', 'bg-red-600', 'bg-red-700', 'bg-red-800'];
const USAGE_HEALTHY_SHADES = ['bg-arcane-blue/60', 'bg-arcane-blue/75', 'bg-arcane-blue/90', 'bg-arcane-blue'];
const USAGE_ELEVATED_SHADES = ['bg-arcane-gold/60', 'bg-arcane-gold/75', 'bg-arcane-gold/90', 'bg-arcane-gold'];

const HPBar = ({ current, max, label, mode = 'hp', title }: HPBarProps) => {
  const percent = getBossHpPercent(current, max);
  const roundedPercent = Math.round(percent);

  const isUsage = mode === 'usage';
  const isCritical = isUsage ? percent > 60 : percent > 0 && percent <= 20;
  const shades = isUsage
    ? percent > 60
      ? HP_CRITICAL_SHADES
      : percent > 30
        ? USAGE_ELEVATED_SHADES
        : USAGE_HEALTHY_SHADES
    : isCritical
      ? HP_CRITICAL_SHADES
      : HP_SHADES;
  const percentColor = isUsage
    ? percent > 60
      ? 'text-red-400'
      : percent > 30
        ? 'text-arcane-gold'
        : 'text-arcane-blue'
    : isCritical
      ? 'text-red-400'
      : 'text-slate-400';

  const litSegments = Math.ceil((percent / 100) * SEGMENT_COUNT);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-slate-500">
        <span>{title ?? (isUsage ? 'Usage' : 'HP')}</span>
        <div className="flex items-center gap-1.5">
          {label && <span className="text-slate-400">{label}</span>}
          <span className={`tabular-nums ${percentColor}`}>{roundedPercent}%</span>
        </div>
      </div>
      <div className="flex gap-[3px] p-[3px] bg-black border-2 border-arcane-black">
        {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
          const isLit = i < litSegments;
          // Banded shade across the lit run, light at the start fading to
          // dark towards the tip — flat color steps, no blending.
          const shadeIndex = litSegments > 1
            ? Math.floor((i / Math.max(1, litSegments - 1)) * (shades.length - 1))
            : 0;

          return (
            <div
              key={i}
              className={`flex-1 h-4 transition-colors duration-300 ${
                isLit
                  ? `${shades[shadeIndex]} ${isCritical ? 'animate-pulse' : ''}`
                  : 'bg-black/80 border border-arcane-navy/60'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};

export default HPBar;
