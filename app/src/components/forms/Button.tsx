import { type ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
  isLoading?: boolean;
}

const Button = ({
  children,
  variant = 'primary',
  isLoading,
  className,
  ...props
}: ButtonProps) => {
  // Base styles that all buttons share
  const baseStyles =
    'px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2';

  // Variant specific styles
  const variants = {
    primary: 'bg-indigo-900 text-indigo-100 hover:bg-indigo-700',
    outline:
      'border border-indigo-900 text-indigo-400 hover:border-indigo-400 hover:text-indigo-200',
    danger:
      'bg-red-900/20 border border-red-900 text-red-400 hover:bg-red-900 hover:text-white',
  };

  return (
    <button
      {...props}
      className={`${baseStyles} ${variants[variant]} ${className || ''}`}
    >
      {isLoading ? (
        <span className="animate-pulse">Processing...</span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
