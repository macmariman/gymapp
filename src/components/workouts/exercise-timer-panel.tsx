"use client"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatMinutesSeconds } from "@/lib/workouts/duration"

type ExerciseTimerPanelProps = {
  exerciseName: string
  setNumber: number
  targetLabel: string
  elapsedSeconds: number
  isOpen: boolean
  isRunning: boolean
  timerId: string
  onApply: () => void
  onReset: () => void
  onToggleOpen: () => void
  onToggleRunning: () => void
}

export function ExerciseTimerPanel({
  exerciseName,
  setNumber,
  targetLabel,
  elapsedSeconds,
  isOpen,
  isRunning,
  timerId,
  onApply,
  onReset,
  onToggleOpen,
  onToggleRunning,
}: ExerciseTimerPanelProps) {
  const canApply = elapsedSeconds > 0

  return (
    <div className="mt-0.5 text-xs text-muted-foreground">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>{targetLabel}</span>
        <button
          aria-controls={timerId}
          aria-expanded={isOpen}
          aria-label={`${isOpen ? "Ocultar" : "Usar"} cronómetro en ${exerciseName} serie ${setNumber}`}
          className={cn(
            "inline-flex rounded-md border px-2 py-0.5 font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
            isOpen
              ? "border-accent/60 bg-accent/10 text-accent-foreground hover:bg-accent/15"
              : "border-border bg-muted/50 text-foreground hover:bg-muted"
          )}
          onClick={onToggleOpen}
          type="button"
        >
          {isOpen ? "Cronómetro activo" : "Cronómetro"}
        </button>
      </div>

      {isOpen ? (
        <div className="mt-2 rounded-md bg-muted/45 px-3 py-2.5" id={timerId}>
          <div
            aria-live="polite"
            className="text-center text-[2rem] font-black leading-none tabular-nums text-foreground"
          >
            {formatMinutesSeconds(elapsedSeconds)}
          </div>

          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <Button
              className="h-8 w-full rounded-md px-2 text-xs"
              onClick={onToggleRunning}
              size="sm"
              type="button"
              variant="outline"
            >
              {isRunning
                ? "Pausar"
                : elapsedSeconds > 0
                  ? "Seguir"
                  : "Iniciar"}
            </Button>
            <Button
              className="h-8 w-full rounded-md px-2 text-xs"
              disabled={!canApply && !isRunning}
              onClick={onReset}
              size="sm"
              type="button"
              variant="outline"
            >
              Reiniciar
            </Button>
            <Button
              className="h-8 w-full rounded-md border border-border bg-accent px-2 text-xs text-accent-foreground hover:bg-accent/90"
              disabled={!canApply}
              onClick={onApply}
              size="sm"
              type="button"
            >
              Usar
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
