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
        className={`text-xs font-bold uppercase tracking-wider text-indigo-500 font-mono ${hideLabel ? 'sr-only' : ''}`}
      >
        {label}
      </label>

      <div className="relative flex items-center">
        <input
          id={inputId}
          {...props}
          className={`
            bg-black 
            border border-indigo-900 
            text-indigo-300 
            p-2 
            h-10
            w-full 
            outline-none 
            focus:border-indigo-400 
            font-mono 
            disabled:opacity-50 
            transition-all
            ${props.readOnly ? 'cursor-default focus:border-indigo-900' : 'cursor-text'}
            ${canCopy ? 'pr-10' : ''} 
            ${className || ''}
          `}
        />

        {canCopy && (
          <button
            type="button"
            onClick={handleCopy}
            className="absolute right-2 p-1 text-indigo-500 hover:text-indigo-300 transition-colors"
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
