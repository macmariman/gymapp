"use client";
import Link from 'next/link';
import { ThemeToggle } from '@/components/layout/theme-toggle';

function Header() {
  return (
    <header className="w-full border-b bg-background/95 sticky top-0 z-50">
      <div className="flex items-center justify-between h-16 px-4 md:px-12">
        {/* Logo */}
        <Link href="/" className="group">
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Next.js Boilerplate
          </span>
        </Link>

        {/* Nav - Add your navigation items here */}
        <nav className="flex items-center gap-3">
          {/* Example navigation items can be added here */}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

export { Header };
