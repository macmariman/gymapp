import "server-only"

import type { ExerciseLogType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import {
  formatLogSummary,
  formatValueForInput,
} from "@/lib/workouts/formatting"
import { findLastExerciseNote } from "@/lib/workouts/quick-notes"
import {
  buildSessionSetSummary,
  getAvailableProgressMetrics,
  getMovementDetail,
} from "@/lib/workouts/progress"
import type {
  AttendanceMonth,
  ExerciseGroupView,
  ExerciseProgressPageData,
  ProgressOverviewPageData,
  RoutineSummary,
  RoutineWithStructure,
  SessionExerciseSummary,
  SessionHistoryEntry,
  WorkoutPageData,
} from "@/lib/workouts/types"

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)

  return { start, end }
}

async function getLatestLogData(
  exercises: Array<{
    id: string
    movementId: string
    logType: ExerciseLogType
    durationFormat: "seconds" | "mmss"
  }>
) {
  if (exercises.length === 0) {
    return new Map<string, { summary: string; values: string[] }>()
  }

  const movementIdByExerciseId = new Map(
    exercises.map((exercise) => [exercise.id, exercise.movementId] as const)
  )
  const logTypeByMovementId = new Map(
    exercises.map(
      (exercise) => [exercise.movementId, exercise.logType] as const
    )
  )
  const durationFormatByMovementId = new Map(
    exercises.map(
      (exercise) => [exercise.movementId, exercise.durationFormat] as const
    )
  )

  const setLogs = await prisma.exerciseSetLog.findMany({
    where: {
      exerciseId: {
        in: exercises.map((exercise) => exercise.id),
      },
    },
    orderBy: [
      {
        session: {
          performedAt: "desc",
        },
      },
      {
        setNumber: "asc",
      },
    ],
    select: {
      exerciseId: true,
      sessionId: true,
      weightKg: true,
      repsCount: true,
      durationSeconds: true,
    },
  })

  const sessionByMovement = new Map<string, string>()
  const valuesByMovement = new Map<string, string[]>()

  for (const setLog of setLogs) {
    const movementId = movementIdByExerciseId.get(setLog.exerciseId)

    if (!movementId) {
      continue
    }

    const savedSessionId = sessionByMovement.get(movementId)

    if (!savedSessionId) {
      sessionByMovement.set(movementId, setLog.sessionId)
      valuesByMovement.set(movementId, [])
    }

    if (sessionByMovement.get(movementId) !== setLog.sessionId) {
      continue
    }

    const logType = logTypeByMovementId.get(movementId)

    if (!logType || logType === "none") {
      continue
    }

    const value =
      logType === "weight"
        ? setLog.weightKg?.toString()
        : logType === "time"
          ? setLog.durationSeconds?.toString()
          : setLog.repsCount?.toString()

    if (!value) {
      continue
    }

    valuesByMovement.get(movementId)?.push(value)
  }

  return new Map(
    exercises.map((exercise) => {
      const values = valuesByMovement.get(exercise.movementId) ?? []

      return [
        exercise.id,
        {
          summary: formatLogSummary(
            logTypeByMovementId.get(exercise.movementId) as Exclude<
              ExerciseLogType,
              "none"
            >,
            values,
            durationFormatByMovementId.get(exercise.movementId)
          ),
          values: values.map((value) =>
            formatValueForInput(
              logTypeByMovementId.get(exercise.movementId) as Exclude<
                ExerciseLogType,
                "none"
              >,
              value,
              durationFormatByMovementId.get(exercise.movementId)
            )
          ),
        },
      ] as const
    })
  )
}

async function getPreviousNotesByMovement(
  exercises: Array<{ movementId: string; name: string }>
) {
  const result = new Map<string, { text: string; performedAt: string }>()

  if (exercises.length === 0) {
    return result
  }

  const namesByMovement = new Map<string, Set<string>>()

  for (const exercise of exercises) {
    const names = namesByMovement.get(exercise.movementId) ?? new Set<string>()
    names.add(exercise.name)
    namesByMovement.set(exercise.movementId, names)
  }

  const movementIds = [...namesByMovement.keys()]

  const sessions = await prisma.workoutSession.findMany({
    where: {
      setLogs: {
        some: {
          exercise: {
            movementId: { in: movementIds },
          },
        },
      },
    },
    orderBy: { performedAt: "desc" },
    take: 50,
    select: {
      note: true,
      performedAt: true,
      setLogs: {
        select: {
          exercise: {
            select: { name: true, movementId: true },
          },
        },
      },
    },
  })

  const seenMovements = new Set<string>()

  for (const session of sessions) {
    const movementsInSession = new Map<string, Set<string>>()

    for (const setLog of session.setLogs) {
      const { movementId, name } = setLog.exercise

      if (!namesByMovement.has(movementId)) {
        continue
      }

      const names = movementsInSession.get(movementId) ?? new Set<string>()
      names.add(name)
      movementsInSession.set(movementId, names)
    }

    for (const [movementId, sessionNames] of movementsInSession) {
      if (seenMovements.has(movementId)) {
        continue
      }

      seenMovements.add(movementId)

      if (!session.note) {
        continue
      }

      const candidateNames = new Set<string>([
        ...(namesByMovement.get(movementId) ?? []),
        ...sessionNames,
      ])

      for (const name of candidateNames) {
        const text = findLastExerciseNote(session.note, name)

        if (text) {
          result.set(movementId, {
            text,
            performedAt: session.performedAt.toISOString(),
          })
          break
        }
      }
    }

    if (seenMovements.size === namesByMovement.size) {
      break
    }
  }

  return result
}

export async function getRoutineSummaries(): Promise<RoutineSummary[]> {
  const routines = await prisma.routine.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      name: true,
      summary: true,
      sessions: {
        orderBy: {
          performedAt: "desc",
        },
        take: 1,
        select: {
          performedAt: true,
        },
      },
    },
  })

  return routines.map((routine) => ({
    id: routine.id,
    name: routine.name,
    summary: routine.summary,
    lastSessionAt: routine.sessions[0]?.performedAt.toISOString() ?? null,
  }))
}

export async function getRoutineDetails(): Promise<RoutineWithStructure[]> {
  const routines = await prisma.routine.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      sessions: {
        orderBy: {
          performedAt: "desc",
        },
        take: 1,
        select: {
          performedAt: true,
        },
      },
      sections: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          groups: {
            orderBy: {
              sortOrder: "asc",
            },
            include: {
              exercises: {
                orderBy: {
                  sortOrder: "asc",
                },
                include: {
                  movement: {
                    select: {
                      durationFormat: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  const exercises = routines.flatMap((routine) =>
    routine.sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.exercises
          .filter((exercise) => exercise.logType !== "none")
          .map((exercise) => ({
            id: exercise.id,
            movementId: exercise.movementId,
            logType: exercise.logType,
            durationFormat: exercise.movement.durationFormat,
          }))
      )
    )
  )

  const exercisesWithName = routines.flatMap((routine) =>
    routine.sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.exercises
          .filter((exercise) => exercise.logType !== "none")
          .map((exercise) => ({
            movementId: exercise.movementId,
            name: exercise.name,
          }))
      )
    )
  )

  const [latestLogs, previousNotes] = await Promise.all([
    getLatestLogData(exercises),
    getPreviousNotesByMovement(exercisesWithName),
  ])

  return routines.map((routine) => ({
    id: routine.id,
    name: routine.name,
    summary: routine.summary,
    lastSessionAt: routine.sessions[0]?.performedAt.toISOString() ?? null,
    sections: routine.sections.map((section) => ({
      id: section.id,
      name: section.name,
      groups: section.groups.map(
        (group): ExerciseGroupView => ({
          id: group.id,
          name: group.name,
          sectionName: section.name,
          series: group.series,
          exercises: group.exercises.map((exercise) => ({
            id: exercise.id,
            movementId: exercise.movementId,
            name: exercise.name,
            targetType: exercise.targetType,
            targetValue: exercise.targetValue,
            note: exercise.note,
            logType: exercise.logType,
            durationFormat: exercise.movement.durationFormat,
            lastLogSummary: latestLogs.get(exercise.id)?.summary ?? null,
            lastLogValues: latestLogs.get(exercise.id)?.values ?? [],
            previousNote: previousNotes.get(exercise.movementId) ?? null,
          })),
        })
      ),
    })),
  }))
}

export async function getAttendanceMonth(
  date = new Date()
): Promise<AttendanceMonth> {
  const { start, end } = getMonthBounds(date)
  const sessions = await prisma.workoutSession.findMany({
    where: {
      performedAt: {
        gte: start,
        lt: end,
      },
    },
    select: {
      performedAt: true,
    },
  })

  const daysWithSessions = [
    ...new Set(sessions.map((session) => session.performedAt.getDate())),
  ].sort((left, right) => left - right)

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    daysWithSessions,
  }
}

export async function getWorkoutSessionHistory(): Promise<
  SessionHistoryEntry[]
> {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: {
      performedAt: "desc",
    },
    include: {
      routine: {
        select: {
          id: true,
          name: true,
        },
      },
      setLogs: {
        orderBy: {
          setNumber: "asc",
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true,
              logType: true,
              movement: {
                select: {
                  durationFormat: true,
                },
              },
            },
          },
        },
      },
    },
  })

  return sessions.map((session) => {
    const exerciseMap = new Map<
      string,
      SessionExerciseSummary & { rawValues: string[] }
    >()

    for (const setLog of session.setLogs) {
      const value =
        setLog.weightKg?.toString() ??
        setLog.repsCount?.toString() ??
        setLog.durationSeconds?.toString()

      if (!value || setLog.exercise.logType === "none") {
        continue
      }

      const savedExercise = exerciseMap.get(setLog.exerciseId)

      if (!savedExercise) {
        exerciseMap.set(setLog.exerciseId, {
          exerciseId: setLog.exerciseId,
          exerciseName: setLog.exercise.name,
          valueSummary: formatLogSummary(
            setLog.exercise.logType,
            [value],
            setLog.exercise.movement.durationFormat
          ),
          rawValues: [value],
        })
        continue
      }

      exerciseMap.set(setLog.exerciseId, {
        ...savedExercise,
        rawValues: [...savedExercise.rawValues, value],
        valueSummary: formatLogSummary(
          setLog.exercise.logType,
          [...savedExercise.rawValues, value],
          setLog.exercise.movement.durationFormat
        ),
      })
    }

    return {
      id: session.id,
      routineId: session.routine.id,
      routineName: session.routine.name,
      performedAt: session.performedAt.toISOString(),
      note: session.note,
      exercises: [...exerciseMap.values()].map((exercise) => ({
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.exerciseName,
        valueSummary: exercise.valueSummary,
      })),
    }
  })
}

export async function getExerciseProgressPageData(
  movementId: string
): Promise<ExerciseProgressPageData | null> {
  const movement = await prisma.exerciseMovement.findUnique({
    where: {
      id: movementId,
    },
    select: {
      id: true,
      slug: true,
      name: true,
      logType: true,
      durationFormat: true,
    },
  })

  if (!movement || movement.logType === "none") {
    return null
  }

  const movementLogType = movement.logType

  const setLogs = await prisma.exerciseSetLog.findMany({
    where: {
      exercise: {
        movementId,
      },
    },
    orderBy: [
      {
        session: {
          performedAt: "asc",
        },
      },
      {
        setNumber: "asc",
      },
    ],
    include: {
      session: {
        select: {
          id: true,
          performedAt: true,
          note: true,
          routine: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      exercise: {
        select: {
          targetValue: true,
        },
      },
    },
  })

  const sessionsById = new Map<
    string,
    {
      id: string
      routineId: string
      routineName: string
      performedAt: string
      note: string | null
      values: number[]
      sets: Array<{ setNumber: number; value: number; targetValue: number }>
    }
  >()

  for (const setLog of setLogs) {
    const value =
      movementLogType === "weight"
        ? setLog.weightKg === null
          ? null
          : Number(setLog.weightKg)
        : movementLogType === "time"
          ? setLog.durationSeconds
          : setLog.repsCount

    if (value === null) {
      continue
    }

    const session = sessionsById.get(setLog.sessionId) ?? {
      id: setLog.session.id,
      routineId: setLog.session.routine.id,
      routineName: setLog.session.routine.name,
      performedAt: setLog.session.performedAt.toISOString(),
      note: setLog.session.note,
      values: [],
      sets: [],
    }

    session.values.push(value)
    session.sets.push({
      setNumber: setLog.setNumber,
      value,
      targetValue: setLog.exercise.targetValue,
    })
    sessionsById.set(setLog.sessionId, session)
  }

  const sessions = [...sessionsById.values()].map((session) => ({
    id: session.id,
    routineId: session.routineId,
    routineName: session.routineName,
    performedAt: session.performedAt,
    note: session.note,
    setSummary: buildSessionSetSummary(
      movementLogType,
      session.values,
      movement.durationFormat
    ),
    sets: session.sets,
    metrics:
      movementLogType === "weight"
        ? {
            maxLoad:
              session.values.length > 0
                ? Math.max(...session.values)
                : undefined,
            totalVolume: session.sets.reduce(
              (total, set) => total + set.value * set.targetValue,
              0
            ),
          }
        : movementLogType === "time"
          ? {
              longestSetSeconds:
                session.values.length > 0
                  ? Math.max(...session.values)
                  : undefined,
              totalTimeSeconds: session.values.reduce(
                (total, value) => total + value,
                0
              ),
            }
          : {
              bestSetReps:
                session.values.length > 0
                  ? Math.max(...session.values)
                  : undefined,
              totalReps: session.values.reduce(
                (total, value) => total + value,
                0
              ),
            },
  }))

  return {
    movement: {
      id: movement.id,
      slug: movement.slug,
      name: movement.name,
      logType: movementLogType,
      detail: getMovementDetail(movementLogType),
      durationFormat: movement.durationFormat,
    },
    availableMetrics: getAvailableProgressMetrics(
      movementLogType,
      movement.durationFormat
    ),
    sessions,
  }
}

export async function getProgressOverviewPageData(): Promise<ProgressOverviewPageData> {
  const setLogs = await prisma.exerciseSetLog.findMany({
    where: {
      exercise: {
        movement: {
          logType: {
            not: "none",
          },
        },
      },
    },
    orderBy: [
      {
        session: {
          performedAt: "asc",
        },
      },
      {
        setNumber: "asc",
      },
    ],
    include: {
      session: {
        select: {
          id: true,
          performedAt: true,
          note: true,
          routine: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      exercise: {
        select: {
          targetValue: true,
          movement: {
            select: {
              id: true,
              slug: true,
              name: true,
              logType: true,
              durationFormat: true,
            },
          },
        },
      },
    },
  })

  const movementsById = new Map<
    string,
    {
      id: string
      slug: string
      name: string
      logType: Exclude<ExerciseLogType, "none">
      durationFormat: "seconds" | "mmss"
      sessionsById: Map<
        string,
        {
          id: string
          routineId: string
          routineName: string
          performedAt: string
          note: string | null
          values: number[]
          sets: Array<{ value: number; targetValue: number }>
        }
      >
    }
  >()

  for (const setLog of setLogs) {
    const movement = setLog.exercise.movement

    if (movement.logType === "none") {
      continue
    }

    const value =
      movement.logType === "weight"
        ? setLog.weightKg === null
          ? null
          : Number(setLog.weightKg)
        : movement.logType === "time"
          ? setLog.durationSeconds
          : setLog.repsCount

    if (value === null) {
      continue
    }

    const savedMovement = movementsById.get(movement.id) ?? {
      id: movement.id,
      slug: movement.slug,
      name: movement.name,
      logType: movement.logType,
      durationFormat: movement.durationFormat,
      sessionsById: new Map(),
    }
    const savedSession = savedMovement.sessionsById.get(setLog.sessionId) ?? {
      id: setLog.session.id,
      routineId: setLog.session.routine.id,
      routineName: setLog.session.routine.name,
      performedAt: setLog.session.performedAt.toISOString(),
      note: setLog.session.note,
      values: [],
      sets: [],
    }

    savedSession.values.push(value)
    savedSession.sets.push({
      value,
      targetValue: setLog.exercise.targetValue,
    })
    savedMovement.sessionsById.set(setLog.sessionId, savedSession)
    movementsById.set(movement.id, savedMovement)
  }

  const movements = [...movementsById.values()]
    .map((movement) => ({
      id: movement.id,
      slug: movement.slug,
      name: movement.name,
      logType: movement.logType,
      durationFormat: movement.durationFormat,
      sessions: [...movement.sessionsById.values()].map((session) => ({
        id: session.id,
        routineId: session.routineId,
        routineName: session.routineName,
        performedAt: session.performedAt,
        note: session.note,
        bestValue:
          session.values.length > 0 ? Math.max(...session.values) : null,
        volumeValue:
          movement.logType === "weight"
            ? session.sets.reduce(
                (total, set) => total + set.value * set.targetValue,
                0
              )
            : session.values.reduce((total, value) => total + value, 0),
      })),
    }))
    .sort((left, right) => left.name.localeCompare(right.name, "es-UY"))

  return {
    movements,
  }
}

export async function getWorkoutPageData(): Promise<WorkoutPageData> {
  const [routines, routineDetails, attendance, history] = await Promise.all([
    getRoutineSummaries(),
    getRoutineDetails(),
    getAttendanceMonth(),
    getWorkoutSessionHistory(),
  ])

  return {
    routines,
    routineDetails,
    attendance,
    history,
  }
}
