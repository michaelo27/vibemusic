import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-white/[0.045]', className)}>
      <div className="absolute inset-0 -translate-x-full animate-shimmer shimmer-line" />
    </div>
  );
}
