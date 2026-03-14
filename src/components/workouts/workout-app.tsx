"use client"

import * as React from "react"
import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRightLeft,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Dumbbell,
  NotebookPen,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  buildAttendanceGrid,
  formatRelativeSessionDate,
  formatSessionDate,
  formatTarget,
} from "@/lib/workouts/formatting"
import type {
  ExerciseLogType,
  ExerciseGroupView,
  RoutineSummary,
  RoutineWithStructure,
  WorkoutPageData,
} from "@/lib/workouts/types"
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
  DialogDescription,
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

type SessionRoutineSectionView = Omit<RoutineWithStructure["sections"][number], "groups"> & {
  groups: SessionGroupView[]
}

type SessionRoutineWithStructure = Omit<RoutineWithStructure, "sections"> & {
  sections: SessionRoutineSectionView[]
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
          "pointer-events-auto flex w-full max-w-md items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.45)] backdrop-blur",
          status.type === "error"
            ? "border-red-200 bg-red-50/95 text-red-700"
            : "border-emerald-200 bg-emerald-50/95 text-emerald-700"
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

function buildInitialSlotAssignments(routine: RoutineWithStructure | undefined) {
  if (!routine) {
    return {}
  }

  return routine.sections.reduce<SlotAssignments>((sectionAccumulator, section) => {
    section.groups.forEach((group) => {
      group.exercises.forEach((exercise) => {
        if (!isExerciseLoggable(exercise.logType)) {
          return
        }

        sectionAccumulator[exercise.id] = exercise.id
      })
    })

    return sectionAccumulator
  }, {})
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
            const assignedExerciseId = slotAssignments[exercise.id] ?? exercise.id
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

function buildInitialValues(routine: RoutineWithStructure | undefined) {
  if (!routine) {
    return {}
  }

  return routine.sections.reduce<Record<string, string>>((sectionAccumulator, section) => {
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

          sectionAccumulator[buildWeightInputKey(exercise.id, setNumber)] = value
        })
      })
    })

    return sectionAccumulator
  }, {})
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

function getInputPlaceholder(logType: ExerciseLogType) {
  if (logType === "weight") {
    return "kg"
  }

  if (logType === "time") {
    return "s"
  }

  return "reps"
}

function getInputMode(logType: ExerciseLogType) {
  return logType === "weight" ? "decimal" : "numeric"
}

function getStatusLabel(logType: ExerciseLogType, summary: string | null) {
  if (summary) {
    return `Último: ${summary}`
  }

  if (logType === "time") {
    return "Sin tiempo registrado todavía"
  }

  if (logType === "reps") {
    return "Sin repeticiones registradas todavía"
  }

  if (logType === "weight") {
    return "Sin peso registrado todavía"
  }

  return "Sin registro todavía"
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
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <CardTitle className="text-xl text-slate-950">Rutinas</CardTitle>
        <CardDescription>Elegí la rutina de hoy.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        {routines.map((routine) => (
          <button
            key={routine.id}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition",
              routine.id === selectedRoutineId
                ? "border-emerald-300 bg-emerald-50"
                : "border-slate-200 bg-slate-50 hover:border-slate-300 hover:bg-white"
            )}
            onClick={() => onSelect(routine.id)}
            type="button"
          >
            <div className="space-y-1">
              <div className="text-sm font-semibold text-slate-950">
                {routine.name}
              </div>
              <div className="text-xs text-slate-500">{routine.summary}</div>
              <div className="text-xs text-slate-600">
                {formatRelativeSessionDate(routine.lastSessionAt)}
              </div>
            </div>
            <ChevronRight className="size-4 text-slate-400" />
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
      <Card className="gap-0 rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
        <CardHeader className="px-5 pb-0">
          <CollapsibleTrigger asChild>
            <button
              className="flex w-full items-start justify-between gap-4 text-left"
              type="button"
            >
              <div className="space-y-1">
                <CardTitle className="text-xl text-slate-950">
                  Asistencia
                </CardTitle>
                <CardDescription>
                  Los días marcados salen de sesiones reales guardadas.
                </CardDescription>
              </div>
              <ChevronDown
                className={cn(
                  "mt-1 size-5 shrink-0 text-slate-500 transition-transform duration-200",
                  isOpen ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
          </CollapsibleTrigger>
        </CardHeader>
        <CollapsibleContent className="overflow-hidden">
          <CardContent className="space-y-4 px-5 pt-4">
            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <button
                  aria-label="Mes anterior"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
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
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-950">
                    {new Intl.DateTimeFormat("es-UY", {
                      month: "long",
                      year: "numeric",
                    }).format(visibleMonthDate)}
                  </div>
                  <div className="text-xs text-slate-500">
                    Asistencia del mes actual
                  </div>
                </div>
                <button
                  aria-label="Mes siguiente"
                  className="rounded-full border border-slate-200 bg-white p-2 text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                <div className="text-2xl font-semibold text-slate-950">
                  {visibleAttendance.daysWithSessions.length}
                </div>
                <div className="text-xs text-slate-500">
                  {visibleAttendance.daysWithSessions.length === 1
                    ? "día entrenado"
                    : "días entrenados"}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className="mb-3 grid grid-cols-7 gap-2">
                {weekDays.map((label) => (
                  <div
                    key={label}
                    className="text-center text-[11px] font-medium uppercase tracking-[0.16em] text-slate-400"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {cells.map((cell, index) =>
                  cell.day ? (
                    <div
                      key={`${cell.day}-${index}`}
                      className={cn(
                        "flex aspect-square items-center justify-center rounded-2xl text-sm font-semibold",
                        cell.completed
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {cell.day}
                    </div>
                  ) : (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square rounded-2xl bg-transparent"
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

function SessionHistory({ history }: Pick<WorkoutPageData, "history">) {
  const [openEntryId, setOpenEntryId] = useState<string | null>(
    history[0]?.id ?? null
  )

  return (
    <Card className="rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]">
      <CardHeader className="px-5">
        <CardTitle className="text-xl text-slate-950">Historial</CardTitle>
        <CardDescription>
          Sesiones guardadas. Solo lectura en esta versión.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 px-5">
        {history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
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
              <div className="rounded-2xl border border-slate-200 bg-slate-50">
                <CollapsibleTrigger asChild>
                  <button
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
                    type="button"
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-950">
                        {entry.routineName}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                        <CalendarDays className="size-3.5" />
                        {formatSessionDate(entry.performedAt)}
                      </div>
                    </div>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-slate-400 transition-transform duration-200",
                        openEntryId === entry.id ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="overflow-hidden">
                  <div className="space-y-3 border-t border-slate-200 px-4 py-4">
                    {entry.note ? (
                      <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-600">
                        {entry.note}
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      {entry.exercises.length === 0 ? (
                        <div className="text-sm text-slate-500">
                          Sin registros guardados.
                        </div>
                      ) : (
                        entry.exercises.map((exercise) => (
                          <div
                            key={`${entry.id}-${exercise.exerciseId}`}
                            className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3"
                          >
                            <div className="text-sm text-slate-700">
                              {exercise.exerciseName}
                            </div>
                            <div className="text-sm font-medium text-slate-950">
                              {exercise.valueSummary}
                            </div>
                          </div>
                        ))
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
                exercise.slotId !== sourceExercise?.slotId && !exercise.isSwapped
            ),
          }))
          .filter((group) => group.exercises.length > 0),
      }))
      .filter((section) => section.groups.length > 0) ?? []

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="max-h-[85vh] overflow-hidden rounded-[28px] border border-slate-200 bg-white p-0 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.45)] sm:max-w-2xl">
        <DialogHeader className="space-y-3 border-b border-slate-200 px-6 py-5 text-left">
          <DialogTitle className="text-xl text-slate-950">
            Intercambiar ejercicio de hoy
          </DialogTitle>
          <DialogDescription className="text-sm leading-6 text-slate-600">
            Elegí otro ejercicio de esta rutina para intercambiar su posición
            solo en la sesión de hoy.
          </DialogDescription>
          {sourceExercise ? (
            <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">
                Ejercicio origen
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950">
                {sourceExercise.name}
              </div>
              <div className="mt-1 text-xs text-slate-600">
                {formatTarget(sourceExercise)}
              </div>
            </div>
          ) : null}
        </DialogHeader>

        <div className="space-y-4 overflow-y-auto px-6 py-5">
          {candidateSections.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No hay otros ejercicios disponibles para intercambiar ahora.
            </div>
          ) : (
            candidateSections.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
                  {section.name}
                </div>

                {section.groups.map((group) => (
                  <div
                    key={group.id}
                    className="space-y-3 rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        {!shouldHideGroupName(group) ? (
                          <div className="text-sm font-semibold text-slate-950">
                            {group.name}
                          </div>
                        ) : null}
                        <div className="text-xs text-slate-500">
                          {group.series} series
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="rounded-full border-slate-200 bg-white text-slate-700"
                      >
                        {group.exercises.length} candidato
                        {group.exercises.length === 1 ? "" : "s"}
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {group.exercises.map((exercise) => (
                        <button
                          key={exercise.slotId}
                          className="flex w-full items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left transition hover:border-emerald-300 hover:bg-emerald-50/50"
                          onClick={() => onSelectTarget(exercise.slotId)}
                          type="button"
                        >
                          <div className="space-y-1">
                            <div className="text-sm font-semibold text-slate-950">
                              {exercise.name}
                            </div>
                            <div className="text-xs text-slate-500">
                              {formatTarget(exercise)}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-600">
                              <Clock3 className="size-3.5 text-slate-400" />
                              {getStatusLabel(
                                exercise.logType,
                                exercise.lastLogSummary
                              )}
                            </div>
                          </div>
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            Usar
                          </span>
                        </button>
                      ))}
                    </div>
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
  note,
  isPending,
  values,
  onNoteChange,
  onValueChange,
  onStartSwap,
  onUndoSwap,
  onSubmit,
  panelRef,
}: {
  routine: SessionRoutineWithStructure
  note: string
  isPending: boolean
  values: Record<string, string>
  onNoteChange: (value: string) => void
  onValueChange: (key: string, value: string) => void
  onStartSwap: (slotId: string) => void
  onUndoSwap: (slotId: string) => void
  onSubmit: () => Promise<void>
  panelRef: React.RefObject<HTMLDivElement | null>
}) {
  const groupsWithTracking = routine.sections.flatMap((section) =>
    section.groups.filter((group) => group.exercises.length > 0)
  )
  const hasWeightedGroups = groupsWithTracking.length > 0

  return (
    <Card
      ref={panelRef}
      className="scroll-mt-24 rounded-[28px] border-white/60 bg-white/85 py-5 shadow-[0_18px_50px_-30px_rgba(15,23,42,0.35)]"
    >
      <CardHeader className="px-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl text-slate-950">Sesión</CardTitle>
            <CardDescription>
              Registrá toda la rutina en una sola carga, con valores por serie y
              una nota opcional.
            </CardDescription>
          </div>
          <div className="rounded-2xl bg-emerald-100 p-2 text-emerald-800">
            <Dumbbell className="size-4" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 px-5">
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-slate-950">
                {routine.name}
              </div>
              <div className="mt-1 text-xs text-slate-500">
                {routine.summary}
              </div>
            </div>
            <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
              {formatRelativeSessionDate(routine.lastSessionAt)}
            </Badge>
          </div>
        </div>

        {hasWeightedGroups ? (
          <>
            <div className="text-xs text-slate-500">
              Completá los ejercicios con seguimiento real de esta rutina.
            </div>

            {routine.sections.map((section) => {
              const sectionGroups = section.groups.filter(
                (group) => group.exercises.length > 0
              )

              if (sectionGroups.length === 0) {
                return null
              }

              return (
                <div key={section.id} className="space-y-3">
                  <div className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-700">
                    {section.name}
                  </div>
                  {sectionGroups.map((group) => {
                    return (
                      <div
                        key={group.id}
                        className="space-y-4 rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            {!shouldHideGroupName(group) ? (
                              <div className="text-sm font-semibold text-slate-950">
                                {group.name}
                              </div>
                            ) : null}
                            <div className="text-xs text-slate-500">
                              {group.series} series
                            </div>
                          </div>
                          <Badge
                            variant="outline"
                            className="rounded-full border-emerald-200 bg-white text-emerald-700"
                          >
                            {group.exercises.length} ejercicio
                            {group.exercises.length === 1 ? "" : "s"}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          {Array.from({ length: group.series }, (_, index) => {
                            const setNumber = index + 1

                            return (
                              <div
                                key={`${group.id}-set-${setNumber}`}
                                className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4"
                              >
                                <div className="text-sm font-semibold text-slate-950">
                                  Serie {setNumber}
                                </div>

                                <div className="space-y-3">
                                  {group.exercises.map((exercise) => {
                                    const inputKey = buildWeightInputKey(
                                      exercise.id,
                                      setNumber
                                    )
                                    const inputId = `${inputKey}-input`

                                    return (
                                      <div
                                        key={inputKey}
                                        className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                      >
                                        <div className="min-w-0 space-y-1">
                                          <div className="flex items-start gap-2">
                                            <button
                                              aria-label={
                                                exercise.isSwapped
                                                  ? "Deshacer intercambio"
                                                  : "Intercambiar"
                                              }
                                              className={cn(
                                                "mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full transition",
                                                exercise.isSwapped
                                                  ? "text-amber-700 hover:bg-amber-100 hover:text-amber-800"
                                                  : "text-slate-400 hover:bg-slate-200 hover:text-emerald-700"
                                              )}
                                              onClick={() =>
                                                exercise.isSwapped
                                                  ? onUndoSwap(exercise.slotId)
                                                  : onStartSwap(exercise.slotId)
                                              }
                                              type="button"
                                            >
                                              <ArrowRightLeft className="size-3.5" />
                                            </button>
                                            <div className="min-w-0">
                                              <div className="flex flex-wrap items-center gap-2">
                                                <label
                                                  className="block text-sm font-medium text-slate-950"
                                                  htmlFor={inputId}
                                                >
                                                  {exercise.name}
                                                </label>
                                                {exercise.isSwapped ? (
                                                  <Badge className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-800 hover:bg-amber-100">
                                                    Intercambiado hoy
                                                  </Badge>
                                                ) : null}
                                              </div>
                                            </div>
                                          </div>
                                          <span className="block text-xs text-slate-500">
                                            {formatTarget(exercise)}
                                          </span>
                                          {exercise.isSwapped ? (
                                            <span className="block text-xs font-medium text-amber-700">
                                              En lugar de:{" "}
                                              {exercise.originalExerciseName}
                                            </span>
                                          ) : null}
                                          <span className="flex items-center gap-2 text-xs text-slate-600">
                                            <Clock3 className="size-3.5 text-slate-400" />
                                            {getStatusLabel(
                                              exercise.logType,
                                              exercise.lastLogSummary
                                            )}
                                          </span>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                          <input
                                            aria-label={`${exercise.name} serie ${setNumber}`}
                                            className="h-9 w-20 rounded-xl border border-slate-200 bg-white px-3 text-right text-sm font-semibold text-slate-950 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                                            id={inputId}
                                            inputMode={getInputMode(
                                              exercise.logType
                                            )}
                                            onFocus={(event) => {
                                              if (
                                                event.target.value.length > 0
                                              ) {
                                                event.target.select()
                                              }
                                            }}
                                            onChange={(event) =>
                                              onValueChange(
                                                inputKey,
                                                event.target.value
                                              )
                                            }
                                            placeholder={getInputPlaceholder(
                                              exercise.logType
                                            )}
                                            value={values[inputKey] ?? ""}
                                          />
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <NotebookPen className="size-4" />
                Nota de la sesión
              </label>
              <textarea
                className="min-h-24 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                maxLength={500}
                onChange={(event) => onNoteChange(event.target.value)}
                placeholder="Opcional. Cómo te sentiste, ajustes o algo a recordar."
                value={note}
              />
            </div>

            <Button
              className="h-11 w-full rounded-full bg-slate-950 text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
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
  const [isPending, startTransition] = useTransition()
  const [selectedRoutineId, setSelectedRoutineId] = useState(() =>
    getSuggestedRoutineId(routines, history)
  )
  const [shouldScrollToRoutine, setShouldScrollToRoutine] = useState(false)
  const [note, setNote] = useState("")
  const [values, setValues] = useState<Record<string, string>>({})
  const [slotAssignments, setSlotAssignments] = useState<SlotAssignments>({})
  const [swapSourceSlotId, setSwapSourceSlotId] = useState<string | null>(null)
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

      const sourceExerciseId =
        currentAssignments[sourceSlotId] ?? sourceSlotId
      const targetExerciseId =
        currentAssignments[targetSlotId] ?? targetSlotId

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
    <main className="mx-auto max-w-6xl px-2 py-6 md:px-6 md:py-8">
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

      <section className="relative mb-6 overflow-hidden rounded-[32px] border border-slate-200/80 bg-[linear-gradient(135deg,rgba(255,255,255,0.96),rgba(240,247,244,0.92))] px-5 py-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.28)] md:px-7 md:py-7">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-40 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.16),transparent_72%)]" />
        <div className="relative">
          <div className="mb-3 inline-flex items-center rounded-full border border-emerald-200 bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">
            Gym App
          </div>
          <div className="max-w-3xl space-y-3">
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
              Tu entrenamiento de hoy
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
              Elegí la rutina, completá tus series y seguí tu constancia mes a
              mes.
            </p>
          </div>
          <div className="mt-5 flex items-start justify-between gap-3">
            <div className="min-w-0 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Rutina activa
              </div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-950">
                {selectedRoutine?.name ?? "Sin rutina"}
              </div>
            </div>
            <div className="shrink-0 rounded-2xl border border-white/80 bg-white/85 px-4 py-3 text-right shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Días entrenados
              </div>
              <div className="mt-1 text-sm font-semibold text-slate-950">
                {attendance.daysWithSessions.length === 1
                  ? "1 día"
                  : `${attendance.daysWithSessions.length} días`}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="grid gap-4">
          <AttendanceCard attendance={attendance} history={history} />
          <RoutineList
            onSelect={handleSelectRoutine}
            routines={routines}
            selectedRoutineId={selectedRoutineId}
          />
        </div>

        <div className="grid gap-4">
          {sessionRoutine ? (
            <SessionPanel
              isPending={isPending || isSubmitting}
              note={note}
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
              panelRef={sessionPanelRef}
              routine={sessionRoutine}
              values={values}
            />
          ) : null}
        </div>
      </div>

      <div className="mt-4">
        <SessionHistory history={history} />
      </div>
    </main>
  )
}
