"use client"

import { cn } from "@/lib/utils"

export function ProgressSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (value: T) => void
  label?: string
}) {
  return (
    <div className="space-y-1.5">
      {label ? (
        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((option) => {
          const isActive = option.value === value

          return (
            <button
              key={option.value}
              aria-pressed={isActive}
              className={cn(
                "min-h-[38px] rounded-[10px] px-3.5 py-1.5 text-sm font-semibold transition",
                isActive
                  ? "bg-accent font-bold text-accent-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-muted"
              )}
              onClick={() => onChange(option.value)}
              type="button"
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
