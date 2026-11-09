'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn('field h-10', className)} {...props} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return <textarea ref={ref} className={cn('field min-h-[84px] resize-none', className)} {...props} />;
  },
);

export function Label({ className, hint, ...props }: React.LabelHTMLAttributes<HTMLLabelElement> & { hint?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between">
      <label className={cn('text-[12px] font-medium uppercase tracking-wider text-white/45', className)} {...props} />
      {hint && <span className="text-[11px] text-white/25">{hint}</span>}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2.5 text-sm text-white/70"
      aria-pressed={checked}
    >
      <span
        className={cn(
          'relative h-5 w-9 rounded-full border transition-colors',
          checked ? 'border-vibe-400/60 bg-vibe-400/30' : 'border-white/10 bg-white/[0.06]',
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all',
            checked ? 'left-[18px] bg-vibe-300' : 'left-0.5 bg-white/40',
          )}
        />
      </span>
      {label}
    </button>
  );
}
