import { useId, useState, type InputHTMLAttributes } from 'react';
import { Copy, Check } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hideLabel?: boolean;
  canCopy?: boolean;
}

const Input = ({
  label,
  hideLabel,
  canCopy,
  className,
  ...props
}: InputProps) => {
  const [copied, setCopied] = useState(false);
  const inputId = useId();

  const handleCopy = async () => {
    if (!props.value) return;
    try {
      await navigator.clipboard.writeText(String(props.value));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy failed', err);
    }
  };

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <label
        htmlFor={inputId}
        className={`text-xs font-bold uppercase tracking-wider text-slate-500 font-display ${hideLabel ? 'sr-only' : ''}`}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={inputId}
          {...props}
          className={`
            bg-black
            border border-arcane-navy
            text-slate-300
            text-base
            p-2
            h-11
            w-full
            outline-none
            focus:border-arcane-gold
            disabled:opacity-50
            transition-all
            ${props.readOnly ? 'cursor-default focus:border-arcane-navy' : 'cursor-text'}
            ${canCopy ? 'pr-10' : ''} 
            ${className || ''}
          `}
        />

        {canCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-1 p-2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
          >
            {copied ? (
              <Check size={16} className="text-green-500" />
            ) : (
              <Copy size={16} />
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
