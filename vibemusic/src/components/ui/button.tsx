'use client';

import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'accent' | 'secondary' | 'outline' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  accent:
    'btn-accent font-semibold hover:brightness-110 active:brightness-95 disabled:opacity-40 disabled:shadow-none',
  secondary:
    'bg-white/[0.06] text-white/90 border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.14]',
  outline:
    'border border-white/[0.12] text-white/80 hover:text-white hover:border-white/25 hover:bg-white/[0.04]',
  ghost: 'text-white/60 hover:text-white hover:bg-white/[0.06]',
  danger: 'bg-red-500/15 text-red-300 border border-red-500/25 hover:bg-red-500/25',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] rounded-lg gap-1.5',
  md: 'h-10 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-[15px] rounded-2xl gap-2',
  icon: 'h-9 w-9 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', loading, children, disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibe-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
});
