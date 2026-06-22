import { useSetAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { confirmRequestAtom } from '../store/atoms';

interface ConfirmOptions {
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'danger';
}

export function useConfirm() {
  const setConfirmRequest = useSetAtom(confirmRequestAtom);

  const confirm = (message: string, options: ConfirmOptions = {}): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmRequest({
        id: nanoid(),
        title: options.title ?? 'Are you sure?',
        message,
        confirmLabel: options.confirmLabel ?? 'Confirm',
        cancelLabel: options.cancelLabel ?? 'Cancel',
        variant: options.variant ?? 'primary',
        resolve,
      });
    });
  };

  return { confirm };
}
