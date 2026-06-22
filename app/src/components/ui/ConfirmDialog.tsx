import { useAtom } from 'jotai';
import { ShieldAlert } from 'lucide-react';
import { confirmRequestAtom } from '../../store/atoms.ts';
import Button from '../forms/Button.tsx';

const ConfirmDialog = () => {
  const [request, setConfirmRequest] = useAtom(confirmRequestAtom);

  if (!request) return null;

  const respond = (confirmed: boolean) => {
    request.resolve(confirmed);
    setConfirmRequest(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 animate-[toast-in_0.15s_ease-out]"
      role="presentation"
      onClick={() => respond(false)}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-arcane-black border border-arcane-gold rounded-lg p-5 space-y-4 shadow-lg shadow-black/50 animate-[pop-in_0.2s_ease-out]"
      >
        <div className="flex items-center gap-2">
          <ShieldAlert
            size={16}
            className={request.variant === 'danger' ? 'text-red-400' : 'text-arcane-gold'}
          />
          <h2
            id="confirm-dialog-title"
            className="font-display uppercase tracking-widest text-sm text-arcane-gold-light"
          >
            {request.title}
          </h2>
        </div>

        <p className="text-xs text-slate-400">{request.message}</p>

        <div className="flex gap-2">
          <Button variant="outline" className="w-full" onClick={() => respond(false)}>
            {request.cancelLabel}
          </Button>
          <Button
            variant={request.variant === 'danger' ? 'danger' : 'primary'}
            className="w-full"
            onClick={() => respond(true)}
          >
            {request.confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
