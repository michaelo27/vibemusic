'use client';

import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import * as React from 'react';
import { cn } from '@/lib/utils';

type ToastTone = 'success' | 'error' | 'info';
type ToastItem = { id: number; title: string; description?: string; tone: ToastTone };

const ToastCtx = React.createContext<{
  toast: (t: { title: string; description?: string; tone?: ToastTone }) => void;
}>({ toast: () => {} });

export function useToast() {
  return React.useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback((t: { title: string; description?: string; tone?: ToastTone }) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, title: t.title, description: t.description, tone: t.tone ?? 'info' }]);
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 6000);
  }, []);

  return (
    <ToastCtx.Provider value={{ toast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:right-6 sm:left-auto sm:items-end">
        {items.map((i) => (
          <div
            key={i.id}
            className={cn(
              'pointer-events-auto flex w-full max-w-sm animate-fade-up items-start gap-3 rounded-2xl border p-3.5 shadow-2xl backdrop-blur-2xl',
              i.tone === 'success' && 'border-vibe-400/30 bg-vibe-500/10',
              i.tone === 'error' && 'border-red-400/30 bg-red-500/10',
              i.tone === 'info' && 'border-white/10 bg-white/[0.06]',
            )}
          >
            <span className="mt-0.5">
              {i.tone === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-vibe-300" />
              ) : i.tone === 'error' ? (
                <XCircle className="h-4 w-4 text-red-300" />
              ) : (
                <Info className="h-4 w-4 text-white/60" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white/90">{i.title}</p>
              {i.description && <p className="mt-0.5 break-words text-[12px] leading-relaxed text-white/50">{i.description}</p>}
            </div>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== i.id))}
              className="rounded-md p-1 text-white/30 transition hover:bg-white/10 hover:text-white/70"
              aria-label="dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
