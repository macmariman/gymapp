"use client"

import { Clock3 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { formatMinutesSeconds } from "@/lib/workouts/duration"

type ExerciseTimerTriggerProps = {
  exerciseName: string
  setNumber: number
  isOpen: boolean
  onToggleOpen: () => void
}

type ExerciseTimerBandProps = {
  elapsedSeconds: number
  isRunning: boolean
  timerId: string
  onApply: () => void
  onReset: () => void
  onToggleRunning: () => void
}

export function ExerciseTimerTrigger({
  exerciseName,
  setNumber,
  isOpen,
  onToggleOpen,
}: ExerciseTimerTriggerProps) {
  return (
    <button
      aria-expanded={isOpen}
      aria-label={`${isOpen ? "Ocultar" : "Usar"} cronómetro en ${exerciseName} serie ${setNumber}`}
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-md border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        isOpen
          ? "border-accent/60 bg-accent/10 text-accent-foreground hover:bg-accent/15"
          : "border-border bg-muted/50 text-foreground hover:bg-muted"
      )}
      onClick={onToggleOpen}
      type="button"
    >
      <Clock3 className="size-3.5" />
    </button>
  )
}

export function ExerciseTimerBand({
  elapsedSeconds,
  isRunning,
  timerId,
  onApply,
  onReset,
  onToggleRunning,
}: ExerciseTimerBandProps) {
  const canApply = elapsedSeconds > 0

  return (
    <div
      className="w-full rounded-lg bg-muted/45 px-3 py-3 sm:px-4"
      id={timerId}
    >
      <div
        aria-live="polite"
        className="text-center text-[2rem] font-black leading-none tabular-nums text-foreground"
      >
        {formatMinutesSeconds(elapsedSeconds)}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-1.5 sm:mx-auto sm:max-w-xs">
        <Button
          className="h-8 w-full rounded-md px-2 text-xs"
          onClick={onToggleRunning}
          size="sm"
          type="button"
          variant="outline"
        >
          {isRunning ? "Pausar" : elapsedSeconds > 0 ? "Seguir" : "Iniciar"}
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
  )
}
