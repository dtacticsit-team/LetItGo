import type { ButtonHTMLAttributes, ReactNode, Ref } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
  children: ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-amber-500 text-[#101010] hover:bg-amber-400 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.55)]',
  secondary: 'bg-white/[0.06] text-[#F5F2EA] border border-white/10 hover:bg-white/[0.12]',
  ghost: 'bg-transparent text-[#A7A29A] hover:text-[#F5F2EA] hover:bg-white/[0.05]',
};

export default function Button({ variant = 'primary', size = 'md', className = '', children, ref, ...rest }: ButtonProps) {
  const sizing = size === 'lg' ? 'px-8 py-4 text-lg min-h-14' : 'px-5 py-3 text-base min-h-12';
  return (
    <button
      ref={ref}
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-wide transition-all duration-300 select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] ${variants[variant]} ${sizing} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
