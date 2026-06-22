import { useSetAtom } from 'jotai';
import { nanoid } from 'nanoid';
import { toastsAtom, type ToastVariant } from '../store/atoms';

const TOAST_DURATION_MS = 3200;

export function useToast() {
  const setToasts = useSetAtom(toastsAtom);

  const addToast = (message: string, variant: ToastVariant = 'info') => {
    const id = nanoid();
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  };

  return { addToast };
}
