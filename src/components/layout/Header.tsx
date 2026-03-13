"use client";
import Link from 'next/link';
import { Dumbbell } from 'lucide-react';
import { ThemeToggle } from '@/components/layout/theme-toggle';

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/40 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-950 p-2 text-white shadow-lg shadow-slate-950/10">
            <Dumbbell className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-[0.16em] text-slate-950 uppercase">
              Gym App
            </div>
            <div className="text-xs text-slate-500">Rutina y progreso</div>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export { Header };
