"use client"

import * as React from "react"
import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  formatDurationInputValue,
  formatDurationMaskValue,
  normalizeDurationMaskValue,
  parseMinutesSeconds,
} from "@/lib/workouts/duration"
import {
  buildAttendanceGrid,
  formatRelativeSessionDate,
  formatSessionDate,
  formatTarget,
} from "@/lib/workouts/formatting"
import type {
  ExerciseGroupView,
  ExerciseLogType,
  RoutineSummary,
  RoutineWithStructure,
  WorkoutPageData,
} from "@/lib/workouts/types"
import {
  ExerciseTimerBand,
  ExerciseTimerTrigger,
} from "@/components/workouts/exercise-timer-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const weekDays = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"]

type SubmissionState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

type SlotAssignments = Record<string, string>

type SessionExerciseView = ExerciseGroupView["exercises"][number] & {
  slotId: string
  originalExerciseName: string
  assignedExerciseId: string
  isSwapped: boolean
}

type SessionGroupView = Omit<ExerciseGroupView, "exercises"> & {
  exercises: SessionExerciseView[]
}

type SessionRoutineSectionView = Omit<
  RoutineWithStructure["sections"][number],
  "groups"
> & {
  groups: SessionGroupView[]
}

type SessionRoutineWithStructure = Omit<RoutineWithStructure, "sections"> & {
  sections: SessionRoutineSectionView[]
}

type ExerciseTimerState = {
  openTimerKey: string | null
  runningTimerKey: string | null
  startedAtMs: number | null
  elapsedByTimerKey: Record<string, number>
}

const EMPTY_TIMER_STATE: ExerciseTimerState = {
  openTimerKey: null,
  runningTimerKey: null,
  startedAtMs: null,
  elapsedByTimerKey: {},
}

function FloatingToast({
  status,
  onClose,
}: {
  status: Exclude<SubmissionState, { type: "idle"; message: string }>
  onClose: () => void
}) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div
        className={cn(
          "pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-xl border px-3 py-2.5 shadow-sm",
          status.type === "error"
            ? "border-red-200 bg-red-50 text-red-700"
            : "border-border bg-card text-foreground"
        )}
        role="status"
      >
        <div className="text-sm font-medium">{status.message}</div>
        <button
          aria-label="Cerrar notificación"
          className="rounded-full p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
          onClick={onClose}
          type="button"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  )
}

function buildWeightInputKey(exerciseId: string, setNumber: number) {
  return `${exerciseId}:${setNumber}`
}

function buildInitialSlotAssignments(
  routine: RoutineWithStructure | undefined
) {
  if (!routine) {
    return {}
  }

  return routine.sections.reduce<SlotAssignments>(
    (sectionAccumulator, section) => {
      section.groups.forEach((group) => {
        group.exercises.forEach((exercise) => {
          if (!isExerciseLoggable(exercise.logType)) {
            return
          }

          sectionAccumulator[exercise.id] = exercise.id
        })
      })

      return sectionAccumulator
    },
    {}
  )
}

function findSlotIdByAssignedExercise(
  slotAssignments: SlotAssignments,
  exerciseId: string
) {
  return (
    Object.entries(slotAssignments).find(
      ([, assignedExerciseId]) => assignedExerciseId === exerciseId
    )?.[0] ?? null
  )
}

function buildSessionRoutine(
  routine: RoutineWithStructure | undefined,
  slotAssignments: SlotAssignments
): SessionRoutineWithStructure | undefined {
  if (!routine) {
    return undefined
  }

  const exerciseById = new Map(
    routine.sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.exercises
          .filter((exercise) => isExerciseLoggable(exercise.logType))
          .map((exercise) => [exercise.id, exercise] as const)
      )
    )
  )

  return {
    ...routine,
    sections: routine.sections.map((section) => ({
      ...section,
      groups: section.groups.map((group) => ({
        ...group,
        exercises: group.exercises
          .filter((exercise) => isExerciseLoggable(exercise.logType))
          .map((exercise) => {
            const assignedExerciseId =
              slotAssignments[exercise.id] ?? exercise.id
            const assignedExercise =
              exerciseById.get(assignedExerciseId) ?? exercise

            return {
              ...assignedExercise,
              slotId: exercise.id,
              originalExerciseName: exercise.name,
              assignedExerciseId,
              isSwapped: assignedExerciseId !== exercise.id,
            }
          }),
      })),
    })),
  }
}

function getSessionExerciseBySlotId(
  routine: SessionRoutineWithStructure | undefined,
  slotId: string | null
) {
  if (!routine || !slotId) {
    return null
  }

  for (const section of routine.sections) {
    for (const group of section.groups) {
      const exercise = group.exercises.find((entry) => entry.slotId === slotId)

      if (exercise) {
        return exercise
      }
    }
  }

  return null
}

function getFlattenedSessionGroups(
  routine: SessionRoutineWithStructure | undefined
) {
  if (!routine) {
    return []
  }

  return routine.sections.flatMap((section) =>
    section.groups.filter((group) => group.exercises.length > 0)
  )
}

function getDefaultOpenGroupIds(
  routine: SessionRoutineWithStructure | undefined,
  requestedSlotId: string | null
) {
  const groups = getFlattenedSessionGroups(routine)

  if (groups.length === 0) {
    return []
  }

  if (requestedSlotId) {
    const matchingGroup = groups.find((group) =>
      group.exercises.some((exercise) => exercise.slotId === requestedSlotId)
    )

    if (matchingGroup) {
      return [matchingGroup.id]
    }
  }

  return [groups[0].id]
}

function getGroupTriggerLabel(group: SessionGroupView) {
  return `${group.name} ${group.series} series ${group.exercises.length} ejercicio${
    group.exercises.length === 1 ? "" : "s"
  }`
}

function buildInitialValues(routine: RoutineWithStructure | undefined) {
  if (!routine) {
    return {}
  }

  return routine.sections.reduce<Record<string, string>>(
    (sectionAccumulator, section) => {
      section.groups.forEach((group) => {
        group.exercises.forEach((exercise) => {
          if (!isExerciseLoggable(exercise.logType)) {
            return
          }

          exercise.lastLogValues.forEach((value, index) => {
            const setNumber = index + 1

            if (setNumber > group.series) {
              return
            }

            sectionAccumulator[buildWeightInputKey(exercise.id, setNumber)] =
              value
          })
        })
      })

      return sectionAccumulator
    },
    {}
  )
}

function getWeekStart(date: Date) {
  const weekStart = new Date(date)
  const day = weekStart.getDay()
  const diff = day === 0 ? -6 : 1 - day

  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() + diff)

  return weekStart
}

function getSuggestedRoutineId(
  routines: RoutineSummary[],
  history: WorkoutPageData["history"]
) {
  if (routines.length === 0) {
    return ""
  }

  const weekStart = getWeekStart(new Date())
  const completedRoutineIds = new Set(
    history
      .filter((entry) => new Date(entry.performedAt) >= weekStart)
      .map((entry) => entry.routineId)
  )

  return (
    routines.find((routine) => !completedRoutineIds.has(routine.id))?.id ??
    routines[0].id
  )
}

function isExerciseLoggable(logType: ExerciseLogType) {
  return logType !== "none"
}

function getInputPlaceholderForFormat(
  logType: ExerciseLogType,
  durationFormat: SessionExerciseView["durationFormat"]
) {
  if (logType === "weight") {
    return "kg"
  }

  if (logType === "time") {
    return durationFormat === "mmss" ? "mm:ss" : "s"
  }

  return "rep"
}

function getInputModeForFormat(
  logType: ExerciseLogType,
  durationFormat: SessionExerciseView["durationFormat"]
) {
  if (logType === "time" && durationFormat === "mmss") {
    return "numeric"
  }

  return logType === "weight" ? "decimal" : "numeric"
}

function formatExerciseInputValue(
  exercise: SessionExerciseView,
  value: string
) {
  if (exercise.logType === "time" && exercise.durationFormat === "mmss") {
    return formatDurationMaskValue(value)
  }

  return value
}

function normalizeExerciseInputValueOnBlur(
  exercise: SessionExerciseView,
  value: string
) {
  const trimmedValue = value.trim()

  if (exercise.logType === "time" && exercise.durationFormat === "mmss") {
    const maskedValue = normalizeDurationMaskValue(trimmedValue)
    const parsedDuration = parseMinutesSeconds(maskedValue)

    if (parsedDuration === null) {
      return trimmedValue
    }

    return formatDurationInputValue(parsedDuration, exercise.durationFormat)
  }

  return trimmedValue
}

function getElapsedTimerSeconds(
  timerState: ExerciseTimerState,
  timerKey: string,
  nowMs: number
) {
  const elapsedSeconds = timerState.elapsedByTimerKey[timerKey] ?? 0

  if (
    timerState.runningTimerKey !== timerKey ||
    timerState.startedAtMs === null
  ) {
    return elapsedSeconds
  }

  return (
    elapsedSeconds +
    Math.max(0, Math.floor((nowMs - timerState.startedAtMs) / 1000))
  )
}

function pauseRunningTimer(
  timerState: ExerciseTimerState,
  nowMs: number
): ExerciseTimerState {
  const { runningTimerKey } = timerState

  if (!runningTimerKey || timerState.startedAtMs === null) {
    return timerState
  }

  return {
    ...timerState,
    runningTimerKey: null,
    startedAtMs: null,
    elapsedByTimerKey: {
      ...timerState.elapsedByTimerKey,
      [runningTimerKey]: getElapsedTimerSeconds(
        timerState,
        runningTimerKey,
        nowMs
      ),
    },
  }
}

function RoutineList({
  routines,
  selectedRoutineId,
  onSelect,
}: {
  routines: RoutineSummary[]
  selectedRoutineId: string
  onSelect: (routineId: string) => void
}) {
  return (
    <Card>
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg uppercase tracking-wide">
          Rutinas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 pt-3">
        {routines.map((routine) => (
          <button
            key={routine.id}
            className={cn(
              "flex w-full items-center justify-between rounded-md border-2 px-3 py-2 text-left transition",
              routine.id === selectedRoutineId
                ? "border-accent bg-accent/10 shadow-brutal-sm"
                : "border-border bg-card hover:border-foreground"
            )}
            onClick={() => onSelect(routine.id)}
            type="button"
          >
            <div className="space-y-0.5">
              <div className="text-sm font-bold text-foreground">
                {routine.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {routine.summary}
              </div>
            </div>
            <ChevronRight className="size-5 text-foreground" />
          </button>
        ))}
      </CardContent>
    </Card>
  )
}

function AttendanceCard({
  attendance,
  history,
}: Pick<WorkoutPageData, "attendance" | "history">) {
  const [isOpen, setIsOpen] = useState(true)
  const [visibleMonthDate, setVisibleMonthDate] = useState(
    () => new Date(attendance.year, attendance.month - 1, 1)
  )
  const today = new Date()
  const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const visibleMonthStart = new Date(
    visibleMonthDate.getFullYear(),
    visibleMonthDate.getMonth(),
    1
  )
  const canGoForward = visibleMonthStart < currentMonthStart
  const visibleAttendance = React.useMemo(() => {
    const daysWithSessions = [
      ...new Set(
        history
          .map((entry) => new Date(entry.performedAt))
          .filter(
            (date) =>
              date.getFullYear() === visibleMonthDate.getFullYear() &&
              date.getMonth() === visibleMonthDate.getMonth()
          )
          .map((date) => date.getDate())
      ),
    ].sort((left, right) => left - right)

    return {
      year: visibleMonthDate.getFullYear(),
      month: visibleMonthDate.getMonth() + 1,
      daysWithSessions,
    }
  }, [history, visibleMonthDate])
  const cells = buildAttendanceGrid(visibleAttendance)

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <Card className="gap-0 rounded-xl border-border bg-card">
        <CardHeader className="pb-0">
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-start justify-between gap-4 text-left"
              type="button"
            >
              <div className="space-y-1">
                <CardTitle className="text-lg text-foreground">
                  Asistencia
                </CardTitle>
                <CardDescription>
                  Los días marcados salen de sesiones reales guardadas.
                </CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 text-muted-foreground transition-transform duration-200",
                  isOpen ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent className="overflow-hidden">
          <CardContent className="space-y-3 pt-3">
            <div className="flex items-center justify-between border-b border-dashed border-border pb-3">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Mes anterior"
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground transition hover:bg-muted"
                  onClick={() =>
                    setVisibleMonthDate(
                      (currentDate) =>
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() - 1,
                          1
                        )
                    )
                  }
                  type="button"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">
                    {new Intl.DateTimeFormat("es-UY", {
                      month: "long",
                      year: "numeric",
                    }).format(visibleMonthDate)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Asistencia del mes actual
                  </div>
                </div>
                <button
                  aria-label="Mes siguiente"
                  className="rounded-lg border border-border bg-card p-1.5 text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={!canGoForward}
                  onClick={() =>
                    setVisibleMonthDate(
                      (currentDate) =>
                        new Date(
                          currentDate.getFullYear(),
                          currentDate.getMonth() + 1,
                          1
                        )
                    )
                  }
                  type="button"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
              <div className="text-right">
                <div className="text-2xl font-semibold text-foreground">
                  {visibleAttendance.daysWithSessions.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  {visibleAttendance.daysWithSessions.length === 1
                    ? "día entrenado"
                    : "días entrenados"}
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="mb-2 grid grid-cols-7 gap-1.5">
                {weekDays.map((label) => (
                  <div
                    key={label}
                    className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {cells.map((cell, index) =>
                  cell.day ? (
                    <div
                      key={`${cell.day}-${index}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-lg text-sm font-semibold",
                        cell.completed
                          ? "bg-accent text-accent-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded-lg bg-transparent"
                    />
                  )
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function shouldHideGroupName(group: ExerciseGroupView) {
  return group.name === group.sectionName
}

function splitValueSummary(valueSummary: string) {
  const match = valueSummary.match(/^(.*)\s(kg|rep|s)$/)

  if (!match) {
    return { values: valueSummary, unit: "" }
  }

  return {
    values: match[1],
    unit: match[2],
  }
}

function SessionHistory({ history }: Pick<WorkoutPageData, "history">) {
  const [openEntryId, setOpenEntryId] = useState<string | null>(
    history[0]?.id ?? null
  )

  return (
    <Card>
      <CardHeader className="border-b-2 border-border">
        <CardTitle className="text-lg uppercase tracking-wide">
          Historial
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0 pt-2">
        {history.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
            Todavía no hay sesiones guardadas.
          </div>
        ) : (
          history.map((entry) => (
            <Collapsible
              key={entry.id}
              onOpenChange={(isOpen) =>
                setOpenEntryId(isOpen ? entry.id : null)
              }
              open={openEntryId === entry.id}
            >
              <div className="border-b border-border last:border-b-0">
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center justify-between gap-3 py-2 text-left"
                    type="button"
                  >
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {entry.routineName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {formatSessionDate(entry.performedAt)}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                        openEntryId === entry.id ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <div className="space-y-2 border-t border-dashed border-border py-3">
                    {entry.note ? (
                      <div className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {entry.note}
                      </div>
                    ) : null}
                    <div className="space-y-1">
                      {entry.exercises.length === 0 ? (
                        <div className="text-sm text-muted-foreground">
                          Sin registros guardados.
                        </div>
                      ) : (
                        entry.exercises.map((exercise) => {
                          const { values, unit } = splitValueSummary(
                            exercise.valueSummary
                          )

                          return (
                            <div
                              key={`${entry.id}-${exercise.exerciseId}`}
                              className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-1.5"
                            >
                              <div className="min-w-0 text-sm text-muted-foreground">
                                {exercise.exerciseName}
                              </div>
                              <div className="grid grid-cols-[auto_1.6rem] items-baseline gap-1 whitespace-nowrap text-sm font-bold tabular-nums text-foreground">
                                <span className="text-right">{values}</span>
                                <span className="text-right">{unit}</span>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function ExerciseSwapDialog({
  open,
  sourceExercise,
  routine,
  onOpenChange,
  onSelectTarget,
}: {
  open: boolean
  sourceExercise: SessionExerciseView | null
  routine: SessionRoutineWithStructure | undefined
  onOpenChange: (open: boolean) => void
  onSelectTarget: (targetSlotId: string) => void
}) {
  const candidateSections =
    routine?.sections
      .map((section) => ({
        ...section,
        groups: section.groups
          .map((group) => ({
            ...group,
            exercises: group.exercises.filter(
              (exercise) =>
                exercise.slotId !== sourceExercise?.slotId &&
                !exercise.isSwapped
            ),
          }))
          .filter((group) => group.exercises.length > 0),
      }))
      .filter((section) => section.groups.length > 0) ?? []

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85vh] flex-col overflow-hidden rounded-lg border-2 border-border bg-card p-0 shadow-brutal sm:max-w-2xl"
      >
        <DialogHeader className="space-y-3 border-b-2 border-border px-4 py-4 text-left">
          <DialogTitle className="text-lg font-bold uppercase tracking-wide">
            Intercambiar ejercicio
          </DialogTitle>
          {sourceExercise ? (
            <div className="rounded border-2 border-accent bg-accent px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/70">
                Origen
              </div>
              <div className="text-sm font-bold text-accent-foreground">
                {sourceExercise.name}
              </div>
            </div>
          ) : null}
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {candidateSections.length === 0 ? (
            <div className="rounded border-2 border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
              No hay otros ejercicios disponibles para intercambiar ahora.
            </div>
          ) : (
            candidateSections.map((section) => (
              <div key={section.id} className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {section.name}
                </div>

                {section.groups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    {!shouldHideGroupName(group) ? (
                      <div className="text-xs text-muted-foreground">
                        {group.name}
                      </div>
                    ) : null}
                    {group.exercises.map((exercise) => (
                      <button
                        key={exercise.slotId}
                        className="flex w-full items-center justify-between gap-3 py-1.5 text-left transition hover:bg-muted rounded px-2 -mx-2"
                        onClick={() => onSelectTarget(exercise.slotId)}
                        type="button"
                      >
                        <span className="text-sm font-bold text-foreground">
                          {exercise.name}
                        </span>
                        <span className="rounded bg-accent px-2 py-1 text-xs font-bold text-accent-foreground">
                          Usar
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function SessionPanel({
  routine,
  selectedRoutineId,
  openGroupIds,
  note,
  isPending,
  values,
  onGroupOpenChange,
  onNoteChange,
  onValueChange,
  onValueBlur,
  onStartSwap,
  onUndoSwap,
  onSubmit,
  panelRef,
}: {
  routine: SessionRoutineWithStructure
  selectedRoutineId: string
  openGroupIds: string[]
  note: string
  isPending: boolean
  values: Record<string, string>
  onGroupOpenChange: (groupId: string, isOpen: boolean) => void
  onNoteChange: (value: string) => void
  onValueChange: (key: string, value: string) => void
  onValueBlur: (key: string, value: string) => void
  onStartSwap: (slotId: string) => void
  onUndoSwap: (slotId: string) => void
  onSubmit: () => Promise<void>
  panelRef: React.RefObject<HTMLDivElement | null>
}) {
  const groupsWithTracking = routine.sections.flatMap((section) =>
    section.groups.filter((group) => group.exercises.length > 0)
  )
  const hasWeightedGroups = groupsWithTracking.length > 0
  const [timerState, setTimerState] = useState<ExerciseTimerState>(
    EMPTY_TIMER_STATE
  )
  const [timerNowMs, setTimerNowMs] = useState(() => Date.now())
  const timerStateRef = useRef<ExerciseTimerState>(EMPTY_TIMER_STATE)

  useEffect(() => {
    timerStateRef.current = timerState
  }, [timerState])

  useEffect(() => {
    setTimerState(EMPTY_TIMER_STATE)
    setTimerNowMs(Date.now())
  }, [routine.id])

  useEffect(() => {
    if (timerState.runningTimerKey === null) {
      return
    }

    setTimerNowMs(Date.now())
    const intervalId = window.setInterval(() => {
      setTimerNowMs(Date.now())
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [timerState.runningTimerKey])

  function handleToggleTimerPanel(timerKey: string) {
    setTimerState((currentTimerState) => {
      const nowMs = Date.now()

      if (currentTimerState.openTimerKey === timerKey) {
        const nextTimerState =
          currentTimerState.runningTimerKey === timerKey
            ? pauseRunningTimer(currentTimerState, nowMs)
            : currentTimerState

        return {
          ...nextTimerState,
          openTimerKey: null,
        }
      }

      const nextTimerState =
        currentTimerState.runningTimerKey &&
        currentTimerState.runningTimerKey !== timerKey
          ? pauseRunningTimer(currentTimerState, nowMs)
          : currentTimerState

      return {
        ...nextTimerState,
        openTimerKey: timerKey,
      }
    })
  }

  function handleToggleTimerRunning(timerKey: string) {
    setTimerState((currentTimerState) => {
      const nowMs = Date.now()

      if (currentTimerState.runningTimerKey === timerKey) {
        return pauseRunningTimer(currentTimerState, nowMs)
      }

      const nextTimerState =
        currentTimerState.runningTimerKey &&
        currentTimerState.runningTimerKey !== timerKey
          ? pauseRunningTimer(currentTimerState, nowMs)
          : currentTimerState

      return {
        ...nextTimerState,
        openTimerKey: timerKey,
        runningTimerKey: timerKey,
        startedAtMs: nowMs,
      }
    })
  }

  function handleResetTimer(timerKey: string) {
    setTimerState((currentTimerState) => {
      const nextTimerState =
        currentTimerState.runningTimerKey === timerKey
          ? pauseRunningTimer(currentTimerState, Date.now())
          : currentTimerState

      return {
        ...nextTimerState,
        elapsedByTimerKey: {
          ...nextTimerState.elapsedByTimerKey,
          [timerKey]: 0,
        },
      }
    })
  }

  function handleApplyTimerValue(
    timerKey: string,
    inputKey: string,
    exercise: SessionExerciseView
  ) {
    const nowMs = Date.now()
    const currentTimerState = timerStateRef.current
    const elapsedSeconds = getElapsedTimerSeconds(
      currentTimerState,
      timerKey,
      nowMs
    )

    if (elapsedSeconds <= 0) {
      return
    }

    const nextTimerState =
      currentTimerState.runningTimerKey === timerKey
        ? pauseRunningTimer(currentTimerState, nowMs)
        : currentTimerState

    setTimerState({
      ...nextTimerState,
      elapsedByTimerKey: {
        ...nextTimerState.elapsedByTimerKey,
        [timerKey]: elapsedSeconds,
      },
    })
    onValueChange(
      inputKey,
      formatDurationInputValue(elapsedSeconds, exercise.durationFormat)
    )
  }

  return (
    <Card
      ref={panelRef}
      className="scroll-mt-20 rounded-xl border-border bg-card"
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{routine.name}</CardTitle>
            <CardDescription>{routine.summary}</CardDescription>
          </div>
          <Badge className="rounded border-2 border-border bg-card px-2 py-1 text-xs font-bold text-foreground">
            {formatRelativeSessionDate(routine.lastSessionAt)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasWeightedGroups ? (
          <>
            {routine.sections.map((section) => {
              const sectionGroups = section.groups.filter(
                (group) => group.exercises.length > 0
              )

              if (sectionGroups.length === 0) {
                return null
              }

              return (
                <div key={section.id} className="space-y-2">
                  <div className="border-b-2 border-border pb-2">
                    <span className="text-sm font-bold uppercase tracking-wide text-foreground">
                      {section.name}
                    </span>
                  </div>
                  {sectionGroups.map((group) => {
                    const isOpen = openGroupIds.includes(group.id)

                    return (
                      <Collapsible
                        key={group.id}
                        onOpenChange={(nextOpen) =>
                          onGroupOpenChange(group.id, nextOpen)
                        }
                        open={isOpen}
                      >
                        <div className="border-b border-dashed border-border pb-3 last:border-b-0">
                          <CollapsibleTrigger asChild>
                            <button
                              aria-label={
                                shouldHideGroupName(group)
                                  ? getGroupTriggerLabel(group)
                                  : undefined
                              }
                              className={cn(
                                "flex w-full items-center justify-between gap-3 rounded-lg px-1 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                                isOpen ? "bg-muted/40" : ""
                              )}
                              type="button"
                            >
                              <div className="min-w-0">
                                {!shouldHideGroupName(group) ? (
                                  <div className="text-sm font-semibold text-foreground">
                                    {group.name}
                                  </div>
                                ) : null}
                                <div className="text-xs text-muted-foreground">
                                  {group.series} series
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant="outline"
                                  className="rounded-md border-border bg-card text-muted-foreground"
                                >
                                  {group.exercises.length} ejercicio
                                  {group.exercises.length === 1 ? "" : "s"}
                                </Badge>
                                <ChevronDown
                                  aria-hidden="true"
                                  className={cn(
                                    "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                                    isOpen ? "rotate-180" : "rotate-0"
                                  )}
                                />
                              </div>
                            </button>
                          </CollapsibleTrigger>

                          <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                            <div className="space-y-2 pt-2">
                              {Array.from(
                                { length: group.series },
                                (_, index) => {
                                  const setNumber = index + 1

                                  return (
                                    <div
                                      key={`${group.id}-set-${setNumber}`}
                                      className="space-y-1 py-1"
                                    >
                                      <div className="inline-block rounded bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                                        Serie {setNumber}
                                      </div>

                                      <div className="space-y-1">
                                        {group.exercises.map((exercise) => {
                                          const inputKey = buildWeightInputKey(
                                            exercise.id,
                                            setNumber
                                          )
                                          const inputId = `${inputKey}-input`
                                          const timerId = `${inputId}-timer`
                                          const exerciseAnchorId = `exercise-slot-${exercise.slotId}`
                                          const shouldSetAnchor =
                                            setNumber === 1
                                          const isTimeExercise =
                                            exercise.logType === "time"
                                          const isTimerOpen =
                                            timerState.openTimerKey === inputKey
                                          const elapsedSeconds =
                                            getElapsedTimerSeconds(
                                              timerState,
                                              inputKey,
                                              timerNowMs
                                            )
                                          const targetLabel =
                                            formatTarget(exercise)

                                          return (
                                            <div
                                              id={
                                                shouldSetAnchor
                                                  ? exerciseAnchorId
                                                  : undefined
                                              }
                                              key={inputKey}
                                              className={cn(
                                                "grid min-h-[44px] grid-cols-[minmax(0,1fr)_auto] gap-2 py-2",
                                                isTimerOpen
                                                  ? "items-start"
                                                  : "items-center"
                                              )}
                                            >
                                              <div className="min-w-0 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-x-2">
                                                <button
                                                  aria-label={
                                                    exercise.isSwapped
                                                      ? "Deshacer intercambio"
                                                      : "Intercambiar"
                                                  }
                                                  className={cn(
                                                    "inline-flex size-6 shrink-0 items-center justify-center rounded-md transition",
                                                    exercise.isSwapped
                                                      ? "text-amber-600 hover:bg-amber-100"
                                                      : "text-muted-foreground hover:bg-muted hover:text-muted-foreground"
                                                  )}
                                                  onClick={() =>
                                                    exercise.isSwapped
                                                      ? onUndoSwap(
                                                          exercise.slotId
                                                        )
                                                      : onStartSwap(
                                                          exercise.slotId
                                                        )
                                                  }
                                                  type="button"
                                                >
                                                  <ArrowRightLeft className="size-3.5" />
                                                </button>
                                                <div className="min-w-0">
                                                  <div className="flex flex-wrap items-center gap-1.5">
                                                    <Link
                                                      aria-label={`Ver progreso de ${exercise.name}`}
                                                      className="rounded-md -mx-1 px-1 py-0.5 text-sm font-bold text-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                                      href={`/progress/${exercise.movementId}?routineId=${selectedRoutineId}&slotId=${exercise.slotId}`}
                                                    >
                                                      {exercise.name}
                                                      <span className="ml-1.5 font-normal text-muted-foreground">
                                                        &gt;
                                                      </span>
                                                    </Link>
                                                    {exercise.isSwapped ? (
                                                      <Badge className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 hover:bg-amber-100">
                                                        Swap
                                                      </Badge>
                                                    ) : null}
                                                  </div>
                                                </div>
                                                <div className="col-start-2 min-w-0">
                                                  <span className="mt-0.5 block text-xs text-muted-foreground">
                                                    {targetLabel}
                                                  </span>
                                                </div>
                                              </div>
                                              <div className="flex items-center justify-end gap-1.5">
                                                {isTimeExercise ? (
                                                  <ExerciseTimerTrigger
                                                    exerciseName={exercise.name}
                                                    isOpen={isTimerOpen}
                                                    onToggleOpen={() =>
                                                      handleToggleTimerPanel(
                                                        inputKey
                                                      )
                                                    }
                                                    setNumber={setNumber}
                                                  />
                                                ) : null}
                                                <input
                                                  aria-label={`${exercise.name} serie ${setNumber}`}
                                                  className={cn(
                                                    "h-8 rounded border-2 border-border bg-card px-2 text-right text-sm font-bold text-foreground outline-none focus:border-accent",
                                                    exercise.durationFormat ===
                                                      "mmss"
                                                      ? "w-16 placeholder:text-[0.78rem] placeholder:font-semibold"
                                                      : "w-14"
                                                  )}
                                                  id={inputId}
                                                  onFocus={(event) => {
                                                    if (
                                                      event.target.value
                                                        .length > 0
                                                    ) {
                                                      event.target.select()
                                                    }
                                                  }}
                                                  onChange={(event) =>
                                                    onValueChange(
                                                      inputKey,
                                                      formatExerciseInputValue(
                                                        exercise,
                                                        event.target.value
                                                      )
                                                    )
                                                  }
                                                  onBlur={(event) =>
                                                    onValueBlur(
                                                      inputKey,
                                                      normalizeExerciseInputValueOnBlur(
                                                        exercise,
                                                        event.target.value
                                                      )
                                                    )
                                                  }
                                                  placeholder={getInputPlaceholderForFormat(
                                                    exercise.logType,
                                                    exercise.durationFormat
                                                  )}
                                                  inputMode={getInputModeForFormat(
                                                    exercise.logType,
                                                    exercise.durationFormat
                                                  )}
                                                  value={values[inputKey] ?? ""}
                                                />
                                              </div>
                                              {isTimeExercise && isTimerOpen ? (
                                                <div className="col-span-2 pt-1">
                                                  <ExerciseTimerBand
                                                    elapsedSeconds={
                                                      elapsedSeconds
                                                    }
                                                    isRunning={
                                                      timerState.runningTimerKey ===
                                                      inputKey
                                                    }
                                                    onApply={() =>
                                                      handleApplyTimerValue(
                                                        inputKey,
                                                        inputKey,
                                                        exercise
                                                      )
                                                    }
                                                    onReset={() =>
                                                      handleResetTimer(inputKey)
                                                    }
                                                    onToggleRunning={() =>
                                                      handleToggleTimerRunning(
                                                        inputKey
                                                      )
                                                    }
                                                    timerId={timerId}
                                                  />
                                                </div>
                                              ) : null}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </div>
                                  )
                                }
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )
                  })}
                </div>
              )
            })}

            <div className="space-y-1.5 pt-2">
              <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-foreground">
                <NotebookPen className="size-3.5" />
                Nota
              </label>
              <textarea
                className="min-h-16 w-full rounded-md border-2 border-border bg-muted px-3 py-2 text-sm text-foreground outline-none focus:border-accent focus:bg-accent/10"
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Cómo te sentiste, ajustes..."
                value={note}
              />
            </div>

            <Button
              className="h-12 w-full rounded-md border-2 border-border bg-accent text-accent-foreground font-bold uppercase tracking-wide shadow-brutal hover:bg-accent hover:text-accent-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!hasWeightedGroups || isPending}
              onClick={() => {
                void onSubmit()
              }}
              type="button"
            >
              {isPending ? "Guardando..." : "Guardar sesión"}
            </Button>
          </>
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
            Esta rutina no tiene ejercicios con seguimiento de peso.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export function WorkoutApp({
  routines,
  routineDetails,
  attendance,
  history,
}: WorkoutPageData) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const requestedRoutineId = searchParams.get("routineId")
  const requestedSlotId = searchParams.get("slotId")
  const preferredRoutineId =
    requestedRoutineId !== null &&
    routines.some((routine) => routine.id === requestedRoutineId)
      ? requestedRoutineId
      : null
  const initialSelectedRoutineId = preferredRoutineId
    ? preferredRoutineId
    : getSuggestedRoutineId(routines, history)
  const initialSelectedRoutine =
    routineDetails.find((routine) => routine.id === initialSelectedRoutineId) ??
    routineDetails[0]
  const [selectedRoutineId, setSelectedRoutineId] = useState(
    initialSelectedRoutineId
  )
  const [shouldScrollToRoutine, setShouldScrollToRoutine] = useState(false)
  const [note, setNote] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignments>({})
  const [swapSourceSlotId, setSwapSourceSlotId] = useState<string | null>(null)
  const [openGroupIds, setOpenGroupIds] = useState<string[]>(() =>
    getDefaultOpenGroupIds(
      buildSessionRoutine(
        initialSelectedRoutine,
        buildInitialSlotAssignments(initialSelectedRoutine)
      ),
      requestedSlotId
    )
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const sessionPanelRef = useRef<HTMLDivElement>(null)
  const [status, setStatus] = useState<SubmissionState>({
    type: "idle",
    message:
      "Guardá una sesión para actualizar asistencia, últimos registros e historial.",
  })

  const selectedRoutine =
    routineDetails.find((routine) => routine.id === selectedRoutineId) ??
    routineDetails[0]
  const sessionRoutine = React.useMemo(
    () => buildSessionRoutine(selectedRoutine, slotAssignments),
    [selectedRoutine, slotAssignments]
  )
  const swapSourceExercise = React.useMemo(
    () => getSessionExerciseBySlotId(sessionRoutine, swapSourceSlotId),
    [sessionRoutine, swapSourceSlotId]
  )

  useEffect(() => {
    if (preferredRoutineId) {
      setSelectedRoutineId(preferredRoutineId)
    }
  }, [preferredRoutineId])

  useEffect(() => {
    setValues(buildInitialValues(selectedRoutine))
    setSlotAssignments(buildInitialSlotAssignments(selectedRoutine))
    setSwapSourceSlotId(null)
    setNote("")
    setStatus({
      type: "idle",
      message:
        "Guardá una sesión para actualizar asistencia, últimos registros e historial.",
    })
  }, [selectedRoutine])

  useEffect(() => {
    setOpenGroupIds(
      getDefaultOpenGroupIds(
        buildSessionRoutine(
          selectedRoutine,
          buildInitialSlotAssignments(selectedRoutine)
        ),
        requestedSlotId
      )
    )
  }, [selectedRoutine, requestedSlotId])

  useEffect(() => {
    if (!shouldScrollToRoutine) {
      return
    }

    sessionPanelRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
    setShouldScrollToRoutine(false)
  }, [selectedRoutineId, shouldScrollToRoutine])

  useEffect(() => {
    if (!requestedSlotId || !selectedRoutine) {
      return
    }

    document
      .getElementById(`exercise-slot-${requestedSlotId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" })
  }, [requestedSlotId, selectedRoutine])

  useEffect(() => {
    if (status.type !== "success") {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setStatus({ type: "idle", message: "" })
    }, 4000)

    return () => window.clearTimeout(timeoutId)
  }, [status])

  function handleSelectRoutine(routineId: string) {
    setSelectedRoutineId(routineId)
    setShouldScrollToRoutine(true)
  }

  function handleStartSwap(slotId: string) {
    setSwapSourceSlotId(slotId)
  }

  function handleConfirmSwap(targetSlotId: string) {
    setSlotAssignments((currentAssignments) => {
      const sourceSlotId = swapSourceSlotId

      if (!sourceSlotId || sourceSlotId === targetSlotId) {
        return currentAssignments
      }

      const sourceExerciseId = currentAssignments[sourceSlotId] ?? sourceSlotId
      const targetExerciseId = currentAssignments[targetSlotId] ?? targetSlotId

      return {
        ...currentAssignments,
        [sourceSlotId]: targetExerciseId,
        [targetSlotId]: sourceExerciseId,
      }
    })
    setSwapSourceSlotId(null)
  }

  function handleUndoSwap(slotId: string) {
    setSlotAssignments((currentAssignments) => {
      const partnerSlotId = findSlotIdByAssignedExercise(
        currentAssignments,
        slotId
      )

      if (!partnerSlotId || partnerSlotId === slotId) {
        return currentAssignments
      }

      return {
        ...currentAssignments,
        [slotId]: slotId,
        [partnerSlotId]: partnerSlotId,
      }
    })
    setSwapSourceSlotId(null)
  }

  async function handleSubmit() {
    if (!selectedRoutine || !sessionRoutine || isSubmitting) {
      return
    }

    const setLogs = sessionRoutine.sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.exercises.flatMap((exercise) => {
          return Array.from({ length: group.series }, (_, index) => {
            const setNumber = index + 1
            const key = buildWeightInputKey(exercise.id, setNumber)
            const value = values[key]?.trim()

            if (!value) {
              return null
            }

            return {
              exerciseId: exercise.id,
              slotExerciseId: exercise.slotId,
              setNumber,
              value,
            }
          }).filter(Boolean) as Array<{
            exerciseId: string
            slotExerciseId: string
            setNumber: number
            value: string
          }>
        })
      )
    )

    if (setLogs.length === 0) {
      setStatus({
        type: "error",
        message: "Ingresá al menos un registro antes de guardar la sesión.",
      })
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch("/api/workout-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          routineId: selectedRoutine.id,
          note,
          setLogs,
        }),
      })

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string }
        throw new Error(payload.message ?? "No se pudo guardar la sesión.")
      }

      setValues({})
      setSlotAssignments(buildInitialSlotAssignments(selectedRoutine))
      setSwapSourceSlotId(null)
      setNote("")
      setStatus({
        type: "success",
        message: "Sesión guardada correctamente.",
      })

      startTransition(() => {
        router.refresh()
      })
    } catch (error) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "No se pudo guardar la sesión.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-2 py-4 md:px-6 md:py-6">
      {status.type !== "idle" ? (
        <FloatingToast
          onClose={() => setStatus({ type: "idle", message: "" })}
          status={status}
        />
      ) : null}

      <ExerciseSwapDialog
        onOpenChange={(open) => {
          if (!open) {
            setSwapSourceSlotId(null)
          }
        }}
        onSelectTarget={handleConfirmSwap}
        open={swapSourceExercise !== null}
        routine={sessionRoutine}
        sourceExercise={swapSourceExercise}
      />

      <section className="relative mb-4 overflow-hidden rounded-lg border-2 border-border bg-card px-4 py-4 shadow-brutal md:px-5 md:py-5">
        <div className="space-y-3">
          <div className="inline-flex items-center rounded border-2 border-border bg-accent px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-accent-foreground">
            Gym App
          </div>
          <div className="max-w-3xl">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground md:text-3xl">
              Entrenamiento de hoy
            </h1>
          </div>
          <div className="flex items-center justify-between border-t-2 border-border pt-3 mt-2">
            <div className="min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Rutina seleccionada
              </div>
              <div className="truncate text-sm font-bold text-foreground">
                {selectedRoutine?.name ?? "Sin rutina"}
              </div>
            </div>
            <div className="shrink-0 text-right">
              <div className="text-2xl font-black text-foreground">
                {attendance.daysWithSessions.length}
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                días este mes
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-3 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-3">
          <AttendanceCard attendance={attendance} history={history} />
          <RoutineList
            onSelect={handleSelectRoutine}
            routines={routines}
            selectedRoutineId={selectedRoutineId}
          />
        </div>

        <div className="grid gap-3">
          {sessionRoutine ? (
            <SessionPanel
              isPending={isPending || isSubmitting}
              note={note}
              onGroupOpenChange={(groupId, isOpen) =>
                setOpenGroupIds((currentGroupIds) => {
                  if (isOpen) {
                    return currentGroupIds.includes(groupId)
                      ? currentGroupIds
                      : [...currentGroupIds, groupId]
                  }

                  return currentGroupIds.filter(
                    (currentGroupId) => currentGroupId !== groupId
                  )
                })
              }
              onNoteChange={setNote}
              onStartSwap={handleStartSwap}
              onSubmit={handleSubmit}
              onUndoSwap={handleUndoSwap}
              onValueChange={(key, value) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  [key]: value,
                }))
              }
              onValueBlur={(key, value) =>
                setValues((currentValues) => ({
                  ...currentValues,
                  [key]: value,
                }))
              }
              panelRef={sessionPanelRef}
              openGroupIds={openGroupIds}
              routine={sessionRoutine}
              selectedRoutineId={selectedRoutineId}
              values={values}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-3">
        <SessionHistory history={history} />
      </div>
    </main>
  )
}
