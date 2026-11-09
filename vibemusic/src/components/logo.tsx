import Link from 'next/link';
import { cn } from '@/lib/utils';

export function VibeMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-vibe-300 via-vibe-400 to-aura-400 shadow-[0_8px_24px_-8px_rgba(43,231,155,0.7)]',
        className,
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
        <path
          d="M13.6 2.4 5.2 13.1c-.4.5 0 1.2.6 1.2h4.1l-1.4 7.1c-.1.7.7 1.1 1.2.6l8.3-10.7c.4-.5 0-1.2-.6-1.2h-4.1l1.5-7.1c.1-.7-.7-1.1-1.2-.6Z"
          fill="#05060A"
        />
      </svg>
    </span>
  );
}

export function Logo({ className, href = '/' }: { className?: string; href?: string }) {
  return (
    <Link href={href} className={cn('group flex items-center gap-2.5', className)}>
      <VibeMark className="transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-105" />
      <span className="text-[17px] font-semibold tracking-tight text-white">
        Vibe<span className="text-vibe-300">Music</span>
      </span>
    </Link>
  );
}
