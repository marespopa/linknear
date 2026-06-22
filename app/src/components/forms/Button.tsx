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
    'min-h-11 px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2';

  // Variant specific styles
  const variants = {
    primary: 'bg-arcane-navy text-arcane-gold-light hover:bg-arcane-navy-light',
    outline:
      'border border-arcane-navy text-arcane-gold hover:border-arcane-gold hover:text-arcane-gold-light',
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
