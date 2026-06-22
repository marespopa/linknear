import { useAtomValue } from 'jotai';
import { Sparkles, Trophy } from 'lucide-react';
import { toastsAtom, type ToastVariant } from '../../store/atoms.ts';

const ICONS: Record<ToastVariant, typeof Sparkles> = {
  level: Sparkles,
  achievement: Trophy,
  info: Sparkles,
};

const ToastStack = () => {
  const toasts = useAtomValue(toastsAtom);

  if (toasts.length === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 inset-x-0 z-50 flex flex-col items-center gap-2 px-4 pointer-events-none max-h-[70vh] overflow-hidden"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            className="animate-[toast-in_0.25s_ease-out] flex items-center gap-2 bg-black/90 border border-arcane-gold text-arcane-gold-light text-[10px] uppercase tracking-widest font-display font-bold px-4 py-2.5 rounded-full shadow-lg shadow-black/50"
          >
            <Icon size={14} className="text-arcane-gold shrink-0" />
            {t.message}
          </div>
        );
      })}
    </div>
  );
};

export default ToastStack;
