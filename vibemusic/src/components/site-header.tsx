'use client';

import { BookOpen, Bot, Compass, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { WalletButton } from '@/components/wallet-button';
import { IS_DEMO } from '@/lib/api';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/#discover', label: 'Explore', icon: Compass, match: '/' },
  { href: '/agent', label: 'Agent', icon: Bot, match: '/agent' },
  { href: '/create', label: 'Create', icon: PlusCircle, match: '/create' },
  { href: '/docs', label: 'Docs', icon: BookOpen, match: '/docs' },
];

export function SiteHeader() {
  const pathname = usePathname() || '/';

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.05] bg-ink-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Logo />

        <nav className="ml-2 hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = item.match === '/' ? pathname === '/' : pathname.startsWith(item.match);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13.5px] font-medium transition',
                  active ? 'bg-white/[0.07] text-white' : 'text-white/50 hover:bg-white/[0.04] hover:text-white/85',
                )}
              >
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {IS_DEMO && (
            <span
              className="hidden items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-medium text-amber-200 sm:flex"
              title="NEXT_PUBLIC_API_BASE is empty — jars, tips and the agent run locally in your browser."
            >
              Demo mode
            </span>
          )}
          <ThemeToggle />
          <WalletButton />
        </div>
      </div>

      {/* mobile nav */}
      <nav className="no-scrollbar flex items-center gap-1 overflow-x-auto border-t border-white/[0.04] px-4 pb-2 pt-1.5 md:hidden">
        {NAV.map((item) => {
          const active = item.match === '/' ? pathname === '/' : pathname.startsWith(item.match);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition',
                active ? 'bg-white/[0.07] text-white' : 'text-white/45',
              )}
            >
              <item.icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
