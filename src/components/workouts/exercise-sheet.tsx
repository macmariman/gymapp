"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  ChevronRight,
  NotebookPen,
  Pause,
  Play,
  RotateCcw,
  Timer,
  TrendingUp,
  X,
} from "lucide-react"

import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer"
import { cn } from "@/lib/utils"
import { formatMinutesSeconds } from "@/lib/workouts/duration"
import { formatRelativeSessionDate } from "@/lib/workouts/formatting"
import type { SessionExerciseView } from "@/components/workouts/workout-app"

type ExerciseSheetProps = {
  exercise: SessionExerciseView | null
  setNumber: number
  progressHref: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onStartSwap: (slotId: string) => void
  onUndoSwap: (slotId: string) => void
  onStartExerciseQuickNote: (exerciseName: string) => void
  onRemoveDayExercise: (groupId: string, exerciseId: string) => void
  isTimerOpen: boolean
  isTimerRunning: boolean
  elapsedSeconds: number
  onToggleTimerOpen: () => void
  onToggleTimerRunning: () => void
  onResetTimer: () => void
  onApplyTimer: () => void
}

function SheetItem({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      className={cn(
        "flex min-h-[53px] w-full items-center gap-3 rounded-xl px-1 text-left text-sm font-semibold text-foreground transition hover:bg-muted/60",
        className
      )}
      type="button"
      {...props}
    />
  )
}

export function ExerciseSheet({
  exercise,
  setNumber,
  progressHref,
  open,
  onOpenChange,
  onStartSwap,
  onUndoSwap,
  onStartExerciseQuickNote,
  onRemoveDayExercise,
  isTimerOpen,
  isTimerRunning,
  elapsedSeconds,
  onToggleTimerOpen,
  onToggleTimerRunning,
  onResetTimer,
  onApplyTimer,
}: ExerciseSheetProps) {
  const router = useRouter()

  if (!exercise) {
    return null
  }

  const isTimeExercise = exercise.logType === "time"
  const hasPreviousData =
    exercise.lastLogValues.length > 0 || exercise.previousNote !== null
  const canApplyTimer = elapsedSeconds > 0

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="overflow-y-auto">
          <DrawerTitle className="mb-3">{exercise.name}</DrawerTitle>

          {hasPreviousData ? (
            <div className="mb-3 rounded-xl bg-accent-soft px-3 py-2.5">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent-soft-foreground">
                Última vez
                {exercise.previousNote
                  ? ` · ${formatRelativeSessionDate(
                      exercise.previousNote.performedAt
                    ).toLowerCase()}`
                  : ""}
              </div>
              {exercise.lastLogValues.length > 0 ? (
                <div className="mt-1 text-sm font-bold tabular-nums text-accent-soft-foreground">
                  {exercise.lastLogValues.join(" · ")}
                </div>
              ) : null}
              {exercise.previousNote ? (
                <div className="mt-1 text-sm italic text-accent-soft-foreground">
                  “{exercise.previousNote.text}”
                </div>
              ) : null}
            </div>
          ) : null}

          {!exercise.isDayExercise ? (
            <SheetItem
              onClick={() => {
                onOpenChange(false)

                if (exercise.isSwapped) {
                  onUndoSwap(exercise.slotId)
                } else {
                  onStartSwap(exercise.slotId)
                }
              }}
            >
              <ArrowRightLeft className="size-4 shrink-0 text-muted-foreground" />
              {exercise.isSwapped ? "Deshacer intercambio" : "Cambiar ejercicio"}
            </SheetItem>
          ) : null}

          {isTimeExercise ? (
            <>
              <SheetItem
                aria-expanded={isTimerOpen}
                onClick={onToggleTimerOpen}
              >
                <Timer className="size-4 shrink-0 text-muted-foreground" />
                Cronómetro
                {isTimerRunning ? (
                  <span className="ml-auto text-xs font-semibold text-accent-soft-foreground">
                    en curso
                  </span>
                ) : null}
              </SheetItem>
              {isTimerOpen ? (
                <div className="mb-1 flex items-center gap-2 rounded-[13px] bg-muted px-3 py-2.5">
                  <div
                    aria-live="polite"
                    className="min-w-0 flex-1 font-mono text-[26px] font-bold leading-none tabular-nums text-foreground"
                  >
                    {formatMinutesSeconds(elapsedSeconds)}
                  </div>
                  <button
                    aria-label={isTimerRunning ? "Pausar" : "Iniciar"}
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted"
                    onClick={onToggleTimerRunning}
                    type="button"
                  >
                    {isTimerRunning ? (
                      <Pause className="size-4" />
                    ) : (
                      <Play className="size-4" />
                    )}
                  </button>
                  <button
                    aria-label="Reiniciar"
                    className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition hover:bg-muted disabled:opacity-50"
                    disabled={!canApplyTimer && !isTimerRunning}
                    onClick={onResetTimer}
                    type="button"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                  <button
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition hover:bg-accent/90 disabled:opacity-50"
                    disabled={!canApplyTimer}
                    onClick={() => {
                      onApplyTimer()
                      onOpenChange(false)
                    }}
                    type="button"
                  >
                    Usar
                  </button>
                </div>
              ) : null}
            </>
          ) : null}

          <SheetItem
            onClick={() => {
              onOpenChange(false)
              onStartExerciseQuickNote(exercise.name)
            }}
          >
            <NotebookPen className="size-4 shrink-0 text-muted-foreground" />
            Agregar nota
          </SheetItem>

          {exercise.isDayExercise && exercise.groupId ? (
            <SheetItem
              onClick={() => {
                onOpenChange(false)
                onRemoveDayExercise(exercise.groupId as string, exercise.id)
              }}
            >
              <X className="size-4 shrink-0 text-muted-foreground" />
              Quitar
            </SheetItem>
          ) : null}

          <div className="my-1.5 border-t border-border" />

          <Link
            className="flex min-h-[53px] w-full items-center gap-3 rounded-xl px-1 text-left text-sm font-semibold text-foreground transition hover:bg-muted/60"
            href={progressHref}
            onClick={(event) => {
              event.preventDefault()
              onOpenChange(false)
              router.push(progressHref)
            }}
          >
            <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
            Ver progreso / historial
            <ChevronRight className="ml-auto size-4 shrink-0 text-muted-foreground" />
          </Link>

          <div className="mt-1 text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Serie {setNumber}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
