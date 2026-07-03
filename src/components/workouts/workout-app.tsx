"use client"

import * as React from "react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  NotebookPen,
  Plus,
  X,
} from "lucide-react"

import { ExerciseSheet } from "@/components/workouts/exercise-sheet"
import { cn } from "@/lib/utils"
import {
  formatDurationInputValue,
  formatDurationMaskValue,
  normalizeDurationMaskValue,
  parseMinutesSeconds,
} from "@/lib/workouts/duration"
import {
  buildAttendanceGrid,
  formatSessionDate,
  formatTarget,
} from "@/lib/workouts/formatting"
import {
  appendGlobalSessionContext,
  appendNoteLine,
  formatExerciseQuickNote,
} from "@/lib/workouts/quick-notes"
import type {
  ExerciseGroupView,
  ExerciseLogType,
  ExerciseView,
  RoutineSummary,
  RoutineWithStructure,
  WorkoutPageData,
} from "@/lib/workouts/types"
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea"
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  ExerciseQuickNoteDialog,
  SessionQuickNoteChips,
} from "@/components/workouts/quick-note-controls"

const weekDays = ["L", "M", "M", "J", "V", "S", "D"]

type SubmissionState =
  | { type: "idle"; message: string }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

type SlotAssignments = Record<string, string>
type DayExerciseAssignments = Record<string, string[]>
type WorkoutSessionDraft = {
  version: 1
  routineId: string
  note: string
  values: Record<string, string>
  slotAssignments: SlotAssignments
  dayExercisesByGroupId: DayExerciseAssignments
  confirmedKeys?: string[]
}

export type SessionExerciseView = ExerciseGroupView["exercises"][number] & {
  slotId: string
  originalExerciseName: string
  assignedExerciseId: string
  isSwapped: boolean
  isDayExercise: boolean
  groupId: string | null
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

type WakeLockSentinelLike = {
  released: boolean
  release: () => Promise<void>
}

const EMPTY_TIMER_STATE: ExerciseTimerState = {
  openTimerKey: null,
  runningTimerKey: null,
  startedAtMs: null,
  elapsedByTimerKey: {},
}
const WORKOUT_SESSION_DRAFT_KEY_PREFIX = "gym-app.workout-session-draft:"
const SESSION_NOTE_TEXTAREA_ID = "session-note-textarea"
const GROUP_ADVANCE_SCROLL_DELAY_MS = 220
const MANUAL_INPUT_SELECT_DELAY_MS = 0

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

function splitRoutineTitle(name: string) {
  const match = name.match(/^(Día\s*\d+)\s*[·\-:]\s*(.+)$/i)

  if (match) {
    return { kicker: `Hoy · ${match[1]}`, title: match[2] }
  }

  return { kicker: "Hoy", title: name }
}

function getSeriesProgress(
  routine: SessionRoutineWithStructure | undefined,
  confirmedKeys: string[]
) {
  const confirmedSet = new Set(confirmedKeys)
  const perGroup: Record<string, { done: number; total: number }> = {}
  let confirmedSeries = 0
  let totalSeries = 0

  for (const section of routine?.sections ?? []) {
    for (const group of section.groups) {
      if (group.exercises.length === 0) {
        continue
      }

      const groupProgress = { done: 0, total: group.series }

      for (let setNumber = 1; setNumber <= group.series; setNumber += 1) {
        totalSeries += 1

        const isSetConfirmed = group.exercises.every((exercise) =>
          confirmedSet.has(buildWeightInputKey(exercise.id, setNumber))
        )

        if (isSetConfirmed) {
          confirmedSeries += 1
          groupProgress.done += 1
        }
      }

      perGroup[group.id] = groupProgress
    }
  }

  return { confirmedSeries, totalSeries, perGroup }
}

function countRoutineBlocksAndSeries(routine: RoutineWithStructure | undefined) {
  let blocks = 0
  let series = 0

  for (const section of routine?.sections ?? []) {
    for (const group of section.groups) {
      if (group.exercises.length === 0) {
        continue
      }

      blocks += 1
      series += group.series
    }
  }

  return { blocks, series }
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

function getLoggableExercisesById(routines: RoutineWithStructure[]) {
  return new Map(
    routines.flatMap((routine) =>
      routine.sections.flatMap((section) =>
        section.groups.flatMap((group) =>
          group.exercises
            .filter((exercise) => isExerciseLoggable(exercise.logType))
            .map((exercise) => [exercise.id, exercise] as const)
        )
      )
    )
  )
}

function buildSessionRoutine(
  routine: RoutineWithStructure | undefined,
  slotAssignments: SlotAssignments,
  dayExercisesByGroupId: DayExerciseAssignments,
  exerciseCatalogById: Map<string, ExerciseGroupView["exercises"][number]>
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
        exercises: [
          ...group.exercises
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
                isDayExercise: false,
                groupId: null,
              }
            }),
          ...(dayExercisesByGroupId[group.id] ?? [])
            .map((exerciseId) => exerciseCatalogById.get(exerciseId))
            .filter(
              (exercise): exercise is ExerciseGroupView["exercises"][number] =>
                exercise !== undefined
            )
            .map((exercise) => ({
              ...exercise,
              slotId: `day-${group.id}-${exercise.id}`,
              originalExerciseName: exercise.name,
              assignedExerciseId: exercise.id,
              isSwapped: false,
              isDayExercise: true,
              groupId: group.id,
            })),
        ],
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

  return []
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

          if (!shouldPrefillExerciseValue(exercise)) {
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

function buildExerciseValues(
  exercise: ExerciseGroupView["exercises"][number],
  series: number
) {
  if (!shouldPrefillExerciseValue(exercise)) {
    return {}
  }

  return exercise.lastLogValues.reduce<Record<string, string>>(
    (exerciseValues, value, index) => {
      const setNumber = index + 1

      if (setNumber > series) {
        return exerciseValues
      }

      exerciseValues[buildWeightInputKey(exercise.id, setNumber)] = value

      return exerciseValues
    },
    {}
  )
}

function getDraftStorageKey(routineId: string) {
  return `${WORKOUT_SESSION_DRAFT_KEY_PREFIX}${routineId}`
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every((entry) => typeof entry === "string")
  )
}

function isDayExerciseAssignments(
  value: unknown
): value is DayExerciseAssignments {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.values(value).every(
      (entry) =>
        Array.isArray(entry) &&
        entry.every((exerciseId) => typeof exerciseId === "string")
    )
  )
}

function readWorkoutSessionDraft(
  routineId: string
): WorkoutSessionDraft | null {
  if (typeof window === "undefined") {
    return null
  }

  try {
    const savedDraft = window.localStorage.getItem(
      getDraftStorageKey(routineId)
    )

    if (!savedDraft) {
      return null
    }

    const parsedDraft = JSON.parse(savedDraft) as Partial<WorkoutSessionDraft>

    if (
      parsedDraft.version !== 1 ||
      parsedDraft.routineId !== routineId ||
      typeof parsedDraft.note !== "string" ||
      !isStringRecord(parsedDraft.values) ||
      !isStringRecord(parsedDraft.slotAssignments) ||
      !isDayExerciseAssignments(parsedDraft.dayExercisesByGroupId)
    ) {
      return null
    }

    return {
      version: 1,
      routineId,
      note: parsedDraft.note,
      values: parsedDraft.values,
      slotAssignments: parsedDraft.slotAssignments,
      dayExercisesByGroupId: parsedDraft.dayExercisesByGroupId,
      confirmedKeys: Array.isArray(parsedDraft.confirmedKeys)
        ? parsedDraft.confirmedKeys.filter(
            (key): key is string => typeof key === "string"
          )
        : [],
    }
  } catch {
    return null
  }
}

function writeWorkoutSessionDraft(draft: WorkoutSessionDraft) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.setItem(
      getDraftStorageKey(draft.routineId),
      JSON.stringify(draft)
    )
  } catch {
    // Draft persistence is best-effort and should not block the workout flow.
  }
}

function removeWorkoutSessionDraft(routineId: string) {
  if (typeof window === "undefined") {
    return
  }

  try {
    window.localStorage.removeItem(getDraftStorageKey(routineId))
  } catch {
    // Ignore storage errors.
  }
}

function clearWorkoutSessionDrafts() {
  if (typeof window === "undefined") {
    return
  }

  try {
    for (let index = window.localStorage.length - 1; index >= 0; index -= 1) {
      const key = window.localStorage.key(index)

      if (key?.startsWith(WORKOUT_SESSION_DRAFT_KEY_PREFIX)) {
        window.localStorage.removeItem(key)
      }
    }
  } catch {
    // Ignore storage errors.
  }
}

function areStringRecordsEqual(
  firstRecord: Record<string, string>,
  secondRecord: Record<string, string>
) {
  const firstEntries = Object.entries(firstRecord)
  const secondKeys = Object.keys(secondRecord)

  return (
    firstEntries.length === secondKeys.length &&
    firstEntries.every(([key, value]) => secondRecord[key] === value)
  )
}

function areDayExerciseAssignmentsEqual(
  firstAssignments: DayExerciseAssignments,
  secondAssignments: DayExerciseAssignments
) {
  const firstEntries = Object.entries(firstAssignments)
  const secondKeys = Object.keys(secondAssignments)

  return (
    firstEntries.length === secondKeys.length &&
    firstEntries.every(([key, exerciseIds]) => {
      const secondExerciseIds = secondAssignments[key]

      return (
        secondExerciseIds !== undefined &&
        exerciseIds.length === secondExerciseIds.length &&
        exerciseIds.every(
          (exerciseId, index) => secondExerciseIds[index] === exerciseId
        )
      )
    })
  )
}

function buildDraftValues(
  values: Record<string, string>,
  initialValues: Record<string, string>
) {
  return Object.fromEntries(
    Object.entries(values).filter(
      ([key, value]) => value.length > 0 || key in initialValues
    )
  )
}

function hasWorkoutSessionDraftChanges({
  note,
  values,
  slotAssignments,
  dayExercisesByGroupId,
  confirmedKeys,
  initialValues,
  initialSlotAssignments,
}: {
  note: string
  values: Record<string, string>
  slotAssignments: SlotAssignments
  dayExercisesByGroupId: DayExerciseAssignments
  confirmedKeys: string[]
  initialValues: Record<string, string>
  initialSlotAssignments: SlotAssignments
}) {
  return (
    note.trim().length > 0 ||
    confirmedKeys.length > 0 ||
    !areStringRecordsEqual(values, initialValues) ||
    !areStringRecordsEqual(slotAssignments, initialSlotAssignments) ||
    !areDayExerciseAssignmentsEqual(dayExercisesByGroupId, {})
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

function shouldPrefillExerciseValue(
  exercise: Pick<ExerciseView, "logType" | "durationFormat">
) {
  return !(exercise.logType === "time" && exercise.durationFormat === "mmss")
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
    <section className="space-y-2">
      <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
        Rutinas
      </div>
      <div className="space-y-2">
        {routines.map((routine) => (
          <button
            key={routine.id}
            className={cn(
              "flex min-h-[52px] w-full items-center justify-between rounded-xl border px-3 py-2 text-left transition",
              routine.id === selectedRoutineId
                ? "border-accent/40 bg-accent-soft"
                : "border-border bg-card hover:bg-muted/60"
            )}
            onClick={() => onSelect(routine.id)}
            type="button"
          >
            <div className="space-y-0.5">
              <div
                className={cn(
                  "text-sm font-bold",
                  routine.id === selectedRoutineId
                    ? "text-accent-soft-foreground"
                    : "text-foreground"
                )}
              >
                {routine.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {routine.summary}
              </div>
            </div>
            <ChevronRight className="size-5 text-muted-foreground" />
          </button>
        ))}
      </div>
    </section>
  )
}

function getAttendanceInsights(history: WorkoutPageData["history"]) {
  if (history.length < 2) {
    return null
  }

  const weekMs = 7 * 24 * 60 * 60 * 1000
  const sessionDates = history.map((entry) => new Date(entry.performedAt))
  const weekStarts = new Set(
    sessionDates.map((date) => getWeekStart(date).getTime())
  )

  let weekStreak = 0
  let cursor = getWeekStart(new Date()).getTime()

  while (weekStarts.has(cursor)) {
    weekStreak += 1
    cursor = getWeekStart(new Date(cursor - weekMs)).getTime()
  }

  const oldestMs = Math.min(...sessionDates.map((date) => date.getTime()))
  const spanWeeks = Math.max(1, (Date.now() - oldestMs) / weekMs)
  const sessionsPerWeek = history.length / spanWeeks

  return { weekStreak, sessionsPerWeek }
}

function AttendanceCard({
  attendance,
  history,
}: Pick<WorkoutPageData, "attendance" | "history">) {
  const [isOpen, setIsOpen] = useState(false)
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
  const isCurrentMonthVisible =
    visibleMonthDate.getFullYear() === today.getFullYear() &&
    visibleMonthDate.getMonth() === today.getMonth()
  const insights = getAttendanceInsights(history)

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <section className="border-t border-border pt-3">
        <CollapsibleTrigger asChild>
          <button
            className="flex min-h-[52px] w-full items-center justify-between gap-4 rounded-xl px-1 text-left transition-colors hover:bg-muted/60"
            type="button"
          >
            <div>
              <div className="text-base font-bold text-foreground">
                Asistencia
              </div>
              <div className="text-xs text-muted-foreground">
                Sesiones registradas del mes
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden">
          <div className="space-y-4 px-1 pt-3">
            <div>
              <div className="text-[44px] font-bold leading-none tabular-nums text-foreground">
                {visibleAttendance.daysWithSessions.length}
              </div>
              <div className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {visibleAttendance.daysWithSessions.length === 1
                  ? "día entrenado"
                  : "días entrenados"}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <button
                aria-label="Mes anterior"
                className="inline-flex size-10 items-center justify-center rounded-[11px] border border-border bg-card text-muted-foreground transition hover:bg-muted"
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
              <div className="text-center text-sm font-bold text-foreground">
                {(() => {
                  const label = new Intl.DateTimeFormat("es-UY", {
                    month: "long",
                    year: "numeric",
                  }).format(visibleMonthDate)

                  return label.charAt(0).toUpperCase() + label.slice(1)
                })()}
              </div>
              <button
                aria-label="Mes siguiente"
                className="inline-flex size-10 items-center justify-center rounded-[11px] border border-border bg-card text-muted-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40"
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

            <div>
              <div className="mb-2 grid grid-cols-7 gap-1.5">
                {weekDays.map((label, index) => (
                  <div
                    key={`${label}-${index}`}
                    className="text-center text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
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
                        "flex aspect-square items-center justify-center rounded-[11px] text-sm font-semibold",
                        cell.completed
                          ? "bg-accent font-bold text-accent-foreground"
                          : "bg-muted text-muted-foreground",
                        isCurrentMonthVisible &&
                          cell.day === today.getDate() &&
                          !cell.completed &&
                          "bg-card text-accent-soft-foreground shadow-[inset_0_0_0_2px_var(--accent)]"
                      )}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded-[11px] bg-transparent"
                    />
                  )
                )}
              </div>
            </div>

            {insights ? (
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-[13px] border border-border px-3 py-2.5">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {insights.weekStreak}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {insights.weekStreak === 1
                      ? "semana seguida activo"
                      : "semanas seguidas activo"}
                  </div>
                </div>
                <div className="rounded-[13px] border border-border px-3 py-2.5">
                  <div className="text-2xl font-bold tabular-nums text-foreground">
                    {insights.sessionsPerWeek.toFixed(1).replace(".", ",")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    sesiones/semana prom.
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </section>
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
  const [isOpen, setIsOpen] = useState(false)
  const [openEntryId, setOpenEntryId] = useState<string | null>(null)

  return (
    <Collapsible onOpenChange={setIsOpen} open={isOpen}>
      <section className="border-t border-border pt-3">
        <CollapsibleTrigger asChild>
          <button
            className="flex min-h-[52px] w-full items-center justify-between gap-4 rounded-xl px-1 text-left transition-colors hover:bg-muted/60"
            type="button"
          >
            <div>
              <div className="text-base font-bold text-foreground">
                Historial
              </div>
              <div className="text-xs text-muted-foreground">
                Últimas 10 sesiones
              </div>
            </div>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="overflow-hidden">
          <div className="space-y-0 px-1 pt-1">
            {history.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
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
                        className="flex min-h-[52px] w-full items-center justify-between gap-3 py-2 text-left"
                        type="button"
                      >
                        <div>
                          <div className="text-[15px] font-bold text-foreground">
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
                      <div className="space-y-2 py-2">
                        {entry.note ? (
                          <div className="rounded-[11px] bg-accent-soft px-3 py-2 text-sm text-accent-soft-foreground">
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
          </div>
        </CollapsibleContent>
      </section>
    </Collapsible>
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
        className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-lg sm:max-w-2xl"
      >
        <DialogHeader className="space-y-3 border-b border-border px-4 py-4 text-left">
          <DialogTitle className="text-lg font-bold">
            Intercambiar ejercicio
          </DialogTitle>
          {sourceExercise ? (
            <div className="rounded-xl bg-accent-soft px-3 py-2">
              <div className="text-[10px] font-bold uppercase tracking-widest text-accent-soft-foreground/80">
                Origen
              </div>
              <div className="text-sm font-bold text-accent-soft-foreground">
                {sourceExercise.name}
              </div>
            </div>
          ) : null}
        </DialogHeader>

        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
          {candidateSections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
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

function DayExerciseDialog({
  open,
  routineDetails,
  selectedExerciseIds,
  onOpenChange,
  onSelectExercise,
}: {
  open: boolean
  routineDetails: RoutineWithStructure[]
  selectedExerciseIds: Set<string>
  onOpenChange: (open: boolean) => void
  onSelectExercise: (exerciseId: string) => void
}) {
  const candidateRoutines = routineDetails
    .map((routine) => ({
      ...routine,
      sections: routine.sections
        .map((section) => ({
          ...section,
          groups: section.groups
            .map((group) => ({
              ...group,
              exercises: group.exercises.filter(
                (exercise) =>
                  isExerciseLoggable(exercise.logType) &&
                  !selectedExerciseIds.has(exercise.id)
              ),
            }))
            .filter((group) => group.exercises.length > 0),
        }))
        .filter((section) => section.groups.length > 0),
    }))
    .filter((routine) => routine.sections.length > 0)

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        aria-describedby={undefined}
        className="flex max-h-[85vh] flex-col overflow-hidden rounded-2xl border border-border bg-card p-0 shadow-lg sm:max-w-2xl"
      >
        <DialogHeader className="border-b border-border px-4 py-4 text-left">
          <DialogTitle className="text-lg font-bold">
            Elegir ejercicio
          </DialogTitle>
        </DialogHeader>
        <Command className="min-h-0">
          <CommandInput placeholder="Buscar ejercicio..." />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>
              No hay ejercicios disponibles para agregar.
            </CommandEmpty>
            {candidateRoutines.map((routine) => (
              <CommandGroup heading={routine.name} key={routine.id}>
                {routine.sections.flatMap((section) =>
                  section.groups.flatMap((group) =>
                    group.exercises.map((exercise) => (
                      <CommandItem
                        key={`${routine.id}-${section.id}-${group.id}-${exercise.id}`}
                        onSelect={() => onSelectExercise(exercise.id)}
                        value={`${routine.name} ${section.name} ${group.name} ${exercise.name}`}
                      >
                        <div className="min-w-0">
                          <div className="truncate font-bold">
                            {exercise.name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground">
                            {section.name}
                          </div>
                        </div>
                      </CommandItem>
                    ))
                  )
                )}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
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
  onOpenGroupIdsChange,
  onNoteChange,
  onValueChange,
  onValueBlur,
  onStartExerciseQuickNote,
  onAddSessionQuickNote,
  onStartSwap,
  onUndoSwap,
  onStartAddDayExercise,
  onRemoveDayExercise,
  onSubmit,
  panelRef,
  confirmedKeys,
  onConfirmValue,
  onUnconfirmValue,
}: {
  routine: SessionRoutineWithStructure
  selectedRoutineId: string
  openGroupIds: string[]
  note: string
  isPending: boolean
  values: Record<string, string>
  confirmedKeys: string[]
  onConfirmValue: (key: string) => void
  onUnconfirmValue: (key: string) => void
  onOpenGroupIdsChange: (groupIds: string[]) => void
  onNoteChange: (value: string) => void
  onValueChange: (key: string, value: string) => void
  onValueBlur: (key: string, value: string) => void
  onStartExerciseQuickNote: (exerciseName: string) => void
  onAddSessionQuickNote: (value: string) => void
  onStartSwap: (slotId: string) => void
  onUndoSwap: (slotId: string) => void
  onStartAddDayExercise: (groupId: string) => void
  onRemoveDayExercise: (groupId: string, exerciseId: string) => void
  onSubmit: () => Promise<void>
  panelRef: React.RefObject<HTMLDivElement | null>
}) {
  const groupsWithTracking = routine.sections.flatMap((section) =>
    section.groups.filter((group) => group.exercises.length > 0)
  )
  const hasWeightedGroups = groupsWithTracking.length > 0
  const [timerState, setTimerState] =
    useState<ExerciseTimerState>(EMPTY_TIMER_STATE)
  const [sheetTarget, setSheetTarget] = useState<{
    exercise: SessionExerciseView
    setNumber: number
  } | null>(null)
  const [timerNowMs, setTimerNowMs] = useState(() => Date.now())
  const timerStateRef = useRef<ExerciseTimerState>(EMPTY_TIMER_STATE)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null)
  const pendingFocusInputKeyRef = useRef<string | null>(null)
  const pendingScrollGroupIdRef = useRef<string | null>(null)
  const pendingManualScrollGroupIdRef = useRef<string | null>(null)
  const pendingScrollTimeoutRef = useRef<number | null>(null)
  const pendingManualInputSelectTimeoutRef = useRef<number | null>(null)
  const suppressNextFocusSelectRef = useRef(false)
  const groupRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    timerStateRef.current = timerState
  }, [timerState])

  useEffect(() => {
    setTimerState(EMPTY_TIMER_STATE)
    setTimerNowMs(Date.now())
    setSheetTarget(null)
  }, [routine.id])

  useEffect(() => {
    return () => {
      if (pendingScrollTimeoutRef.current !== null) {
        window.clearTimeout(pendingScrollTimeoutRef.current)
      }
      if (pendingManualInputSelectTimeoutRef.current !== null) {
        window.clearTimeout(pendingManualInputSelectTimeoutRef.current)
      }
    }
  }, [])

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

  useEffect(() => {
    let effectActive = true

    async function releaseWakeLock() {
      const wakeLock = wakeLockRef.current

      if (!wakeLock) {
        return
      }

      wakeLockRef.current = null

      if (!wakeLock.released) {
        await wakeLock.release()
      }
    }

    async function requestWakeLock() {
      if (
        timerState.runningTimerKey === null ||
        typeof window === "undefined"
      ) {
        await releaseWakeLock()
        return
      }

      const wakeLockApi = (
        navigator as Navigator & {
          wakeLock?: {
            request: (type: "screen") => Promise<WakeLockSentinelLike>
          }
        }
      ).wakeLock

      if (!wakeLockApi) {
        return
      }

      try {
        await releaseWakeLock()
        const nextWakeLock = await wakeLockApi.request("screen")

        if (!effectActive || timerStateRef.current.runningTimerKey === null) {
          if (!nextWakeLock.released) {
            await nextWakeLock.release()
          }

          return
        }

        wakeLockRef.current = nextWakeLock
      } catch {
        wakeLockRef.current = null
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void requestWakeLock()
      }
    }

    void requestWakeLock()
    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      effectActive = false
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [timerState.runningTimerKey])

  const flattenedGroups = React.useMemo(
    () => getFlattenedSessionGroups(routine),
    [routine]
  )

  const groupBoundaryInputs = React.useMemo(() => {
    const map = new Map<string, string>()

    for (let i = 0; i < flattenedGroups.length; i++) {
      const group = flattenedGroups[i]
      const lastSetNumber = group.series
      const lastExercise = group.exercises[group.exercises.length - 1]

      if (lastExercise) {
        map.set(buildWeightInputKey(lastExercise.id, lastSetNumber), group.id)
      }
    }

    return map
  }, [flattenedGroups])

  const scrollToGroupAfterLayout = useCallback((groupElement: HTMLDivElement) => {
    if (pendingScrollTimeoutRef.current !== null) {
      window.clearTimeout(pendingScrollTimeoutRef.current)
    }

    pendingScrollTimeoutRef.current = window.setTimeout(() => {
      groupElement.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
      pendingScrollTimeoutRef.current = null
    }, GROUP_ADVANCE_SCROLL_DELAY_MS)
  }, [])

  useLayoutEffect(() => {
    const pendingInputKey = pendingFocusInputKeyRef.current
    const pendingGroupId = pendingScrollGroupIdRef.current

    if (pendingInputKey && pendingGroupId) {
      const nextInput = inputRefs.current[pendingInputKey]
      const nextGroup = groupRefs.current[pendingGroupId]

      if (!nextInput || !nextGroup) {
        return
      }

      pendingFocusInputKeyRef.current = null
      pendingScrollGroupIdRef.current = null
      pendingManualScrollGroupIdRef.current = null
      suppressNextFocusSelectRef.current = true
      nextInput.focus({ preventScroll: true })
      nextInput.select()
      scrollToGroupAfterLayout(nextGroup)
      return
    }

    const pendingManualGroupId = pendingManualScrollGroupIdRef.current

    if (!pendingManualGroupId || !openGroupIds.includes(pendingManualGroupId)) {
      return
    }

    const nextGroup = groupRefs.current[pendingManualGroupId]

    if (!nextGroup) {
      return
    }

    pendingManualScrollGroupIdRef.current = null
    scrollToGroupAfterLayout(nextGroup)
  }, [openGroupIds, scrollToGroupAfterLayout])

  function handleOpenGroupChange(groupId: string, nextOpen: boolean) {
    if (nextOpen) {
      pendingManualScrollGroupIdRef.current = groupId
      onOpenGroupIdsChange([groupId])
      return
    }

    if (pendingManualScrollGroupIdRef.current === groupId) {
      pendingManualScrollGroupIdRef.current = null
    }

    onOpenGroupIdsChange(
      openGroupIds.filter((currentGroupId) => currentGroupId !== groupId)
    )
  }

  function handleWorkoutInputFocus(event: React.FocusEvent<HTMLInputElement>) {
    if (suppressNextFocusSelectRef.current) {
      suppressNextFocusSelectRef.current = false
      return
    }

    if (pendingManualInputSelectTimeoutRef.current !== null) {
      window.clearTimeout(pendingManualInputSelectTimeoutRef.current)
    }

    const input = event.currentTarget

    if (input.value.length === 0) {
      return
    }

    pendingManualInputSelectTimeoutRef.current = window.setTimeout(() => {
      input.select()
      pendingManualInputSelectTimeoutRef.current = null
    }, MANUAL_INPUT_SELECT_DELAY_MS)
  }

  function handleAdvanceToNextGroup(currentGroupId: string) {
    const currentGroupIndex = flattenedGroups.findIndex(
      (group) => group.id === currentGroupId
    )

    if (currentGroupIndex === -1) {
      return
    }

    if (currentGroupIndex === flattenedGroups.length - 1) {
      onOpenGroupIdsChange([])
      window.requestAnimationFrame(() => {
        const noteTextarea = document.getElementById(SESSION_NOTE_TEXTAREA_ID)

        if (noteTextarea instanceof HTMLTextAreaElement) {
          noteTextarea.focus()
        }
      })
      return
    }

    const nextGroup = flattenedGroups[currentGroupIndex + 1]
    const firstExercise = nextGroup.exercises[0]

    if (!firstExercise) {
      return
    }

    pendingFocusInputKeyRef.current = buildWeightInputKey(firstExercise.id, 1)
    pendingScrollGroupIdRef.current = nextGroup.id
    onOpenGroupIdsChange([nextGroup.id])
  }

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

    if (elapsedSeconds > 0) {
      onConfirmValue(inputKey)
    }
  }

  const confirmedSet = React.useMemo(
    () => new Set(confirmedKeys),
    [confirmedKeys]
  )
  const seriesProgress = React.useMemo(
    () => getSeriesProgress(routine, confirmedKeys),
    [routine, confirmedKeys]
  )
  const savedBarProgressLabel = `${seriesProgress.confirmedSeries}/${seriesProgress.totalSeries}`

  return (
    <div ref={panelRef} className="scroll-mt-20 space-y-3">
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
                  <div className="pb-1">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                      {section.name}
                    </span>
                  </div>
                  {sectionGroups.map((group) => {
                    const isOpen = openGroupIds.includes(group.id)
                    const groupProgress = seriesProgress.perGroup[group.id]
                    const setConfirmations = Array.from(
                      { length: group.series },
                      (_, index) =>
                        group.exercises.every((exercise) =>
                          confirmedSet.has(
                            buildWeightInputKey(exercise.id, index + 1)
                          )
                        )
                    )
                    const currentSetNumber =
                      setConfirmations.findIndex(
                        (isConfirmed) => !isConfirmed
                      ) + 1

                    return (
                      <Collapsible
                        key={group.id}
                        onOpenChange={(nextOpen) =>
                          handleOpenGroupChange(group.id, nextOpen)
                        }
                        open={isOpen}
                      >
                        <div
                          className="scroll-mt-20 border-b border-border pb-3 last:border-b-0"
                          ref={(element) => {
                            groupRefs.current[group.id] = element
                          }}
                        >
                          <CollapsibleTrigger asChild>
                            <button
                              aria-label={
                                shouldHideGroupName(group)
                                  ? getGroupTriggerLabel(group)
                                  : undefined
                              }
                              className="flex min-h-[52px] w-full items-center justify-between gap-3 rounded-xl px-1 py-2 text-left transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                              type="button"
                            >
                              <div className="min-w-0">
                                {!shouldHideGroupName(group) ? (
                                  <div className="truncate text-base font-bold text-foreground">
                                    {group.name}
                                  </div>
                                ) : null}
                                <div className="text-xs text-muted-foreground">
                                  {group.series}{" "}
                                  {group.series === 1 ? "serie" : "series"}
                                  {" × "}
                                  {group.exercises.length}{" "}
                                  {group.exercises.length === 1
                                    ? "ejercicio"
                                    : "ejercicios"}
                                  {group.exercises.length > 1
                                    ? " · en circuito"
                                    : ""}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {groupProgress ? (
                                  <span
                                    className={cn(
                                      "font-mono text-xs font-bold tabular-nums",
                                      groupProgress.done > 0
                                        ? "text-accent-soft-foreground"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {groupProgress.done}/{groupProgress.total}
                                  </span>
                                ) : null}
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
                              <button
                                className="inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-1.5 py-1 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground"
                                onClick={() => onStartAddDayExercise(group.id)}
                                type="button"
                              >
                                <Plus className="size-3.5" />
                                Agregar ejercicio del día
                              </button>
                              {Array.from(
                                { length: group.series },
                                (_, index) => {
                                  const setNumber = index + 1
                                  const isSetConfirmed =
                                    setConfirmations[index] ?? false
                                  const isCurrentSet =
                                    setNumber === currentSetNumber

                                  return (
                                    <div
                                      key={`${group.id}-set-${setNumber}`}
                                      className={cn(
                                        "rounded-2xl px-3 pb-1 pt-2.5",
                                        isSetConfirmed && "opacity-60",
                                        isCurrentSet && "bg-accent-soft"
                                      )}
                                      data-set-container
                                    >
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={cn(
                                            "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest",
                                            isCurrentSet
                                              ? "bg-accent text-accent-foreground"
                                              : "border border-border text-muted-foreground"
                                          )}
                                        >
                                          Serie {setNumber}
                                        </span>
                                        {isSetConfirmed ? (
                                          <span className="text-xs text-muted-foreground">
                                            Completada
                                          </span>
                                        ) : isCurrentSet ? (
                                          <span className="text-xs font-semibold text-accent-soft-foreground">
                                            En curso
                                          </span>
                                        ) : null}
                                      </div>

                                      <div>
                                        {group.exercises.map((exercise) => {
                                          const inputKey = buildWeightInputKey(
                                            exercise.id,
                                            setNumber
                                          )
                                          const inputId = `${inputKey}-input`
                                          const exerciseAnchorId = `exercise-slot-${exercise.slotId}`
                                          const shouldSetAnchor =
                                            setNumber === 1
                                          const targetLabel =
                                            formatTarget(exercise)
                                          const isFieldConfirmed =
                                            confirmedSet.has(inputKey)
                                          const hasFieldValue =
                                            (values[inputKey] ?? "").length > 0

                                          return (
                                            <div
                                              id={
                                                shouldSetAnchor
                                                  ? exerciseAnchorId
                                                  : undefined
                                              }
                                              key={inputKey}
                                              className="grid min-h-[52px] grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-b border-muted-foreground/15 py-2 last:border-b-0"
                                            >
                                              <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                  <button
                                                    aria-label={`Opciones de ${exercise.name} serie ${setNumber}`}
                                                    className="rounded-md -mx-1 px-1 py-0.5 text-left text-sm font-bold text-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                                                    onClick={() =>
                                                      setSheetTarget({
                                                        exercise,
                                                        setNumber,
                                                      })
                                                    }
                                                    type="button"
                                                  >
                                                    {exercise.name}
                                                    <span className="ml-1.5 font-normal text-muted-foreground">
                                                      ›
                                                    </span>
                                                  </button>
                                                  {exercise.isSwapped ? (
                                                    <Badge className="rounded-md bg-warning px-1.5 py-0.5 text-[10px] font-semibold text-warning-foreground hover:bg-warning">
                                                      Swap
                                                    </Badge>
                                                  ) : null}
                                                  {timerState.runningTimerKey ===
                                                  inputKey ? (
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-accent-soft-foreground">
                                                      Crono en curso
                                                    </span>
                                                  ) : null}
                                                </div>
                                                <span className="mt-0.5 block text-xs text-muted-foreground">
                                                  {targetLabel}
                                                </span>
                                              </div>
                                              <div className="flex items-center justify-end gap-1.5">
                                                <input
                                                  aria-label={`${exercise.name} serie ${setNumber}`}
                                                  className={cn(
                                                    "h-[46px] rounded-xl border bg-card px-2 text-center text-lg font-bold tabular-nums outline-none transition-shadow focus:border-solid focus:border-accent focus:text-foreground focus:ring-[3px] focus:ring-accent/20",
                                                    hasFieldValue &&
                                                      !isFieldConfirmed
                                                      ? "border-dashed border-border text-muted-foreground/70"
                                                      : "border-border text-foreground",
                                                    exercise.durationFormat ===
                                                      "mmss"
                                                      ? "w-[84px] placeholder:text-sm placeholder:font-semibold"
                                                      : "w-[76px]"
                                                  )}
                                                  data-workout-input
                                                  enterKeyHint="next"
                                                  id={inputId}
                                                  onFocus={
                                                    handleWorkoutInputFocus
                                                  }
                                                  ref={(element) => {
                                                    inputRefs.current[
                                                      inputKey
                                                    ] = element
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
                                                  onBlur={(event) => {
                                                    const normalizedValue =
                                                      normalizeExerciseInputValueOnBlur(
                                                        exercise,
                                                        event.target.value
                                                      )

                                                    onValueBlur(
                                                      inputKey,
                                                      normalizedValue
                                                    )

                                                    const movedToField =
                                                      event.relatedTarget instanceof
                                                        HTMLInputElement ||
                                                      event.relatedTarget instanceof
                                                        HTMLTextAreaElement

                                                    if (
                                                      normalizedValue.length === 0
                                                    ) {
                                                      onUnconfirmValue(inputKey)
                                                    } else if (movedToField) {
                                                      onConfirmValue(inputKey)
                                                    }

                                                    const boundaryGroupId =
                                                      groupBoundaryInputs.get(
                                                        inputKey
                                                      )

                                                    if (!boundaryGroupId) {
                                                      return
                                                    }

                                                    const nextFocused =
                                                      event.relatedTarget

                                                    if (
                                                      nextFocused instanceof
                                                        HTMLElement &&
                                                      "workoutInput" in
                                                        nextFocused.dataset
                                                    ) {
                                                      return
                                                    }

                                                    if (
                                                      nextFocused instanceof
                                                        HTMLInputElement ||
                                                      nextFocused instanceof
                                                        HTMLTextAreaElement
                                                    ) {
                                                      handleAdvanceToNextGroup(
                                                        boundaryGroupId
                                                      )
                                                    }
                                                  }}
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
                                                <span
                                                  aria-hidden="true"
                                                  className="flex w-4 shrink-0 items-center justify-center"
                                                >
                                                  {isFieldConfirmed ? (
                                                    <Check className="size-4 text-accent" />
                                                  ) : null}
                                                </span>
                                              </div>
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
              <label className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <NotebookPen className="size-3.5" />
                Nota de sesión
              </label>
              <SessionQuickNoteChips
                note={note}
                onAddNote={onAddSessionQuickNote}
              />
              <AutoResizeTextarea
                className="min-h-32 w-full rounded-[13px] border border-border bg-card px-3 py-2 text-sm text-foreground outline-none transition-shadow focus:border-accent focus:ring-[3px] focus:ring-accent/20 sm:min-h-24"
                id={SESSION_NOTE_TEXTAREA_ID}
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Cómo te sentiste, ajustes..."
                value={note}
              />
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/90 backdrop-blur-xl">
              <div className="mx-auto flex max-w-xl items-center gap-3 px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <div className="shrink-0 text-center leading-tight">
                  <div className="text-base font-bold tabular-nums text-foreground">
                    {savedBarProgressLabel}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    series
                  </div>
                </div>
                <Button
                  className="h-[52px] flex-1 text-base"
                  disabled={!hasWeightedGroups || isPending}
                  onClick={() => {
                    void onSubmit()
                  }}
                  type="button"
                  variant="action"
                >
                  {isPending ? "Guardando..." : "Guardar sesión"}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-muted px-3 py-4 text-sm text-muted-foreground">
            Esta rutina no tiene ejercicios con seguimiento de peso.
          </div>
        )}
      {(() => {
        if (!sheetTarget) {
          return null
        }

        const sheetInputKey = buildWeightInputKey(
          sheetTarget.exercise.id,
          sheetTarget.setNumber
        )

        return (
          <ExerciseSheet
            elapsedSeconds={getElapsedTimerSeconds(
              timerState,
              sheetInputKey,
              timerNowMs
            )}
            exercise={sheetTarget.exercise}
            isTimerOpen={timerState.openTimerKey === sheetInputKey}
            isTimerRunning={timerState.runningTimerKey === sheetInputKey}
            onApplyTimer={() =>
              handleApplyTimerValue(
                sheetInputKey,
                sheetInputKey,
                sheetTarget.exercise
              )
            }
            onOpenChange={(open) => {
              if (!open) {
                setSheetTarget(null)
              }
            }}
            onRemoveDayExercise={onRemoveDayExercise}
            onResetTimer={() => handleResetTimer(sheetInputKey)}
            onStartExerciseQuickNote={onStartExerciseQuickNote}
            onStartSwap={onStartSwap}
            onToggleTimerOpen={() => handleToggleTimerPanel(sheetInputKey)}
            onToggleTimerRunning={() =>
              handleToggleTimerRunning(sheetInputKey)
            }
            onUndoSwap={onUndoSwap}
            open
            progressHref={`/progress/${sheetTarget.exercise.movementId}?routineId=${selectedRoutineId}&slotId=${sheetTarget.exercise.slotId}`}
            setNumber={sheetTarget.setNumber}
          />
        )
      })()}
    </div>
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
  const exerciseCatalogById = React.useMemo(
    () => getLoggableExercisesById(routineDetails),
    [routineDetails]
  )
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
  const [confirmedKeys, setConfirmedKeys] = useState<string[]>([])
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignments>({})
  const [swapSourceSlotId, setSwapSourceSlotId] = useState<string | null>(null)
  const [dayExercisesByGroupId, setDayExercisesByGroupId] =
    useState<DayExerciseAssignments>({})
  const [dayExerciseTargetGroupId, setDayExerciseTargetGroupId] = useState<
    string | null
  >(null)
  const [quickNoteExerciseName, setQuickNoteExerciseName] = useState<
    string | null
  >(null)
  const draftHydratedRoutineIdRef = useRef<string | null>(null)
  const skipNextDraftWriteRef = useRef(false)
  const [openGroupIds, setOpenGroupIds] = useState<string[]>(() =>
    getDefaultOpenGroupIds(
      buildSessionRoutine(
        initialSelectedRoutine,
        buildInitialSlotAssignments(initialSelectedRoutine),
        {},
        exerciseCatalogById
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
  const selectedRoutineInitialValues = React.useMemo(
    () => buildInitialValues(selectedRoutine),
    [selectedRoutine]
  )
  const selectedRoutineInitialSlotAssignments = React.useMemo(
    () => buildInitialSlotAssignments(selectedRoutine),
    [selectedRoutine]
  )
  const sessionRoutine = React.useMemo(
    () =>
      buildSessionRoutine(
        selectedRoutine,
        slotAssignments,
        dayExercisesByGroupId,
        exerciseCatalogById
      ),
    [
      dayExercisesByGroupId,
      exerciseCatalogById,
      selectedRoutine,
      slotAssignments,
    ]
  )
  const swapSourceExercise = React.useMemo(
    () => getSessionExerciseBySlotId(sessionRoutine, swapSourceSlotId),
    [sessionRoutine, swapSourceSlotId]
  )
  const heroTitle = splitRoutineTitle(selectedRoutine?.name ?? "Sin rutina")
  const routineTotals = React.useMemo(
    () => countRoutineBlocksAndSeries(sessionRoutine),
    [sessionRoutine]
  )
  const confirmedSeriesCount = React.useMemo(
    () => getSeriesProgress(sessionRoutine, confirmedKeys).confirmedSeries,
    [sessionRoutine, confirmedKeys]
  )
  const handleConfirmValue = useCallback((key: string) => {
    setConfirmedKeys((currentKeys) =>
      currentKeys.includes(key) ? currentKeys : [...currentKeys, key]
    )
  }, [])
  const handleUnconfirmValue = useCallback((key: string) => {
    setConfirmedKeys((currentKeys) =>
      currentKeys.includes(key)
        ? currentKeys.filter((currentKey) => currentKey !== key)
        : currentKeys
    )
  }, [])
  const selectedExerciseIds = React.useMemo(
    () =>
      new Set(
        sessionRoutine?.sections.flatMap((section) =>
          section.groups.flatMap((group) =>
            group.exercises.map((exercise) => exercise.id)
          )
        ) ?? []
      ),
    [sessionRoutine]
  )

  useEffect(() => {
    if (preferredRoutineId) {
      setSelectedRoutineId(preferredRoutineId)
    }
  }, [preferredRoutineId])

  useEffect(() => {
    const savedDraft = selectedRoutine
      ? readWorkoutSessionDraft(selectedRoutine.id)
      : null

    const hydratedValues = savedDraft?.values ?? selectedRoutineInitialValues

    setValues(hydratedValues)
    setConfirmedKeys(
      (savedDraft?.confirmedKeys ?? []).filter(
        (key) => (hydratedValues[key] ?? "").length > 0
      )
    )
    setSlotAssignments(
      savedDraft?.slotAssignments ?? selectedRoutineInitialSlotAssignments
    )
    setSwapSourceSlotId(null)
    setDayExercisesByGroupId(savedDraft?.dayExercisesByGroupId ?? {})
    setDayExerciseTargetGroupId(null)
    setQuickNoteExerciseName(null)
    setNote(savedDraft?.note ?? "")
    setStatus({
      type: "idle",
      message:
        "Guardá una sesión para actualizar asistencia, últimos registros e historial.",
    })
    draftHydratedRoutineIdRef.current = selectedRoutine?.id ?? null
    skipNextDraftWriteRef.current = true
  }, [
    selectedRoutine,
    selectedRoutineInitialSlotAssignments,
    selectedRoutineInitialValues,
  ])

  useEffect(() => {
    if (
      !selectedRoutine ||
      draftHydratedRoutineIdRef.current !== selectedRoutine.id
    ) {
      return
    }

    if (skipNextDraftWriteRef.current) {
      skipNextDraftWriteRef.current = false
      return
    }

    const draftValues = buildDraftValues(values, selectedRoutineInitialValues)
    const hasDraftChanges = hasWorkoutSessionDraftChanges({
      note,
      values: draftValues,
      slotAssignments,
      dayExercisesByGroupId,
      confirmedKeys,
      initialValues: selectedRoutineInitialValues,
      initialSlotAssignments: selectedRoutineInitialSlotAssignments,
    })

    if (!hasDraftChanges) {
      removeWorkoutSessionDraft(selectedRoutine.id)
      return
    }

    writeWorkoutSessionDraft({
      version: 1,
      routineId: selectedRoutine.id,
      note,
      values: draftValues,
      slotAssignments,
      dayExercisesByGroupId,
      confirmedKeys,
    })
  }, [
    confirmedKeys,
    dayExercisesByGroupId,
    note,
    selectedRoutine,
    selectedRoutineInitialSlotAssignments,
    selectedRoutineInitialValues,
    slotAssignments,
    values,
  ])

  useEffect(() => {
    setOpenGroupIds(
      getDefaultOpenGroupIds(
        buildSessionRoutine(
          selectedRoutine,
          buildInitialSlotAssignments(selectedRoutine),
          {},
          exerciseCatalogById
        ),
        requestedSlotId
      )
    )
  }, [exerciseCatalogById, selectedRoutine, requestedSlotId])

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

  function handleStartAddDayExercise(groupId: string) {
    setDayExerciseTargetGroupId(groupId)
  }

  function handleSelectDayExercise(exerciseId: string) {
    const groupId = dayExerciseTargetGroupId
    const exercise = exerciseCatalogById.get(exerciseId)
    const group = getFlattenedSessionGroups(sessionRoutine).find(
      (currentGroup) => currentGroup.id === groupId
    )

    if (
      !groupId ||
      !exercise ||
      !group ||
      selectedExerciseIds.has(exerciseId)
    ) {
      setDayExerciseTargetGroupId(null)
      return
    }

    setDayExercisesByGroupId((currentAssignments) => {
      const groupExerciseIds = currentAssignments[groupId] ?? []

      if (groupExerciseIds.includes(exerciseId)) {
        return currentAssignments
      }

      return {
        ...currentAssignments,
        [groupId]: [...groupExerciseIds, exerciseId],
      }
    })
    setValues((currentValues) => ({
      ...currentValues,
      ...buildExerciseValues(exercise, group.series),
    }))
    setDayExerciseTargetGroupId(null)
  }

  function handleRemoveDayExercise(groupId: string, exerciseId: string) {
    setDayExercisesByGroupId((currentAssignments) => {
      const nextGroupExerciseIds = (currentAssignments[groupId] ?? []).filter(
        (currentExerciseId) => currentExerciseId !== exerciseId
      )

      if (nextGroupExerciseIds.length === 0) {
        return Object.fromEntries(
          Object.entries(currentAssignments).filter(
            ([currentGroupId]) => currentGroupId !== groupId
          )
        )
      }

      return {
        ...currentAssignments,
        [groupId]: nextGroupExerciseIds,
      }
    })
    setValues((currentValues) =>
      Object.fromEntries(
        Object.entries(currentValues).filter(
          ([key]) => !key.startsWith(`${exerciseId}:`)
        )
      )
    )
  }

  function handleAddExerciseQuickNote(
    selectedValues: string[],
    detail: string
  ) {
    if (!quickNoteExerciseName) {
      return
    }

    const quickNote = formatExerciseQuickNote(
      quickNoteExerciseName,
      selectedValues,
      detail
    )

    if (quickNote.length === 0) {
      return
    }

    setNote((currentNote) => appendNoteLine(currentNote, quickNote))
    setQuickNoteExerciseName(null)
    setStatus({
      type: "success",
      message: "Nota agregada",
    })
  }

  function handleAddSessionQuickNote(value: string) {
    setNote((currentNote) => appendGlobalSessionContext(currentNote, value))
    setStatus({
      type: "success",
      message: "Nota actualizada",
    })
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

            return exercise.isDayExercise
              ? {
                  exerciseId: exercise.id,
                  groupId: exercise.groupId ?? group.id,
                  setNumber,
                  value,
                }
              : {
                  exerciseId: exercise.id,
                  slotExerciseId: exercise.slotId,
                  setNumber,
                  value,
                }
          }).filter(Boolean) as Array<{
            exerciseId: string
            slotExerciseId?: string
            groupId?: string
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

      clearWorkoutSessionDrafts()
      skipNextDraftWriteRef.current = true
      setValues({})
      setConfirmedKeys([])
      setSlotAssignments(buildInitialSlotAssignments(selectedRoutine))
      setSwapSourceSlotId(null)
      setDayExercisesByGroupId({})
      setDayExerciseTargetGroupId(null)
      setQuickNoteExerciseName(null)
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
    <div className="mx-auto w-full">
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
      <DayExerciseDialog
        onOpenChange={(open) => {
          if (!open) {
            setDayExerciseTargetGroupId(null)
          }
        }}
        onSelectExercise={handleSelectDayExercise}
        open={dayExerciseTargetGroupId !== null}
        routineDetails={routineDetails}
        selectedExerciseIds={selectedExerciseIds}
      />
      <ExerciseQuickNoteDialog
        exerciseName={quickNoteExerciseName}
        onAddNote={handleAddExerciseQuickNote}
        onOpenChange={(open) => {
          if (!open) {
            setQuickNoteExerciseName(null)
          }
        }}
        open={quickNoteExerciseName !== null}
      />

      <section className="mb-5 space-y-2">
        <div className="text-[11px] font-bold uppercase tracking-widest text-accent-soft-foreground">
          {heroTitle.kicker}
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {heroTitle.title}
        </h1>
        <p className="text-[13px] text-muted-foreground">
          {routineTotals.blocks}{" "}
          {routineTotals.blocks === 1 ? "bloque" : "bloques"} ·{" "}
          {routineTotals.series} series
        </p>
        <div className="pt-1">
          <div className="h-[7px] w-full overflow-hidden rounded-full bg-border">
            <span
              className="block h-full rounded-full bg-accent transition-all"
              style={{
                width: `${
                  routineTotals.series > 0
                    ? Math.round(
                        (confirmedSeriesCount / routineTotals.series) * 100
                      )
                    : 0
                }%`,
              }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {confirmedSeriesCount} de {routineTotals.series} series confirmadas
          </p>
        </div>
      </section>

      <div className="grid gap-4">
        <RoutineList
          onSelect={handleSelectRoutine}
          routines={routines}
          selectedRoutineId={selectedRoutineId}
        />

        <div className="grid gap-3">
          {sessionRoutine ? (
            <SessionPanel
              isPending={isPending || isSubmitting}
              note={note}
              onOpenGroupIdsChange={setOpenGroupIds}
              onNoteChange={setNote}
              onAddSessionQuickNote={handleAddSessionQuickNote}
              onRemoveDayExercise={handleRemoveDayExercise}
              onStartExerciseQuickNote={setQuickNoteExerciseName}
              onStartAddDayExercise={handleStartAddDayExercise}
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
              confirmedKeys={confirmedKeys}
              onConfirmValue={handleConfirmValue}
              onUnconfirmValue={handleUnconfirmValue}
            />
          ) : null}
        </div>

        <AttendanceCard attendance={attendance} history={history} />
        <SessionHistory history={history} />
      </div>
    </div>
  )
}
