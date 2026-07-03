"use client"

import Link from "next/link"
import { BarChart3, Dumbbell } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/layout/theme-toggle"

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="rounded-xl bg-foreground p-2 text-background">
            <Dumbbell className="size-4" />
          </div>
          <div className="text-sm font-bold text-foreground">Gym App</div>
        </Link>

        <div className="flex items-center gap-2">
          <Button
            asChild
            className="hover:bg-transparent hover:text-current active:bg-transparent dark:hover:bg-transparent dark:hover:text-current dark:active:bg-transparent"
            size="icon"
            variant="ghost"
          >
            <Link aria-label="Ver progreso general" href="/progress">
              <BarChart3 className="size-4" />
            </Link>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

export { Header }
