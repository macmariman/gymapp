import "server-only"

import type { ExerciseLogType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { formatLogSummary } from "@/lib/workouts/formatting"
import {
  buildSessionSetSummary,
  getAvailableProgressMetrics,
  getMovementDetail,
} from "@/lib/workouts/progress"
import type {
  AttendanceMonth,
  ExerciseGroupView,
  ExerciseProgressPageData,
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
  exercises: Array<{ id: string; logType: ExerciseLogType }>
) {
  if (exercises.length === 0) {
    return new Map<string, { summary: string; values: string[] }>()
  }

  const logTypeByExerciseId = new Map(
    exercises.map((exercise) => [exercise.id, exercise.logType] as const)
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

  const sessionByExercise = new Map<string, string>()
  const valuesByExercise = new Map<string, string[]>()

  for (const setLog of setLogs) {
    const savedSessionId = sessionByExercise.get(setLog.exerciseId)

    if (!savedSessionId) {
      sessionByExercise.set(setLog.exerciseId, setLog.sessionId)
      valuesByExercise.set(setLog.exerciseId, [])
    }

    if (sessionByExercise.get(setLog.exerciseId) !== setLog.sessionId) {
      continue
    }

    const logType = logTypeByExerciseId.get(setLog.exerciseId)

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

    valuesByExercise.get(setLog.exerciseId)?.push(value)
  }

  return new Map(
    [...valuesByExercise.entries()].map(([exerciseId, values]) => [
      exerciseId,
      {
        summary: formatLogSummary(
          logTypeByExerciseId.get(exerciseId) as Exclude<
            ExerciseLogType,
            "none"
          >,
          values
        ),
        values,
      },
    ])
  )
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
            logType: exercise.logType,
          }))
      )
    )
  )

  const latestLogs = await getLatestLogData(exercises)

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
            lastLogSummary: latestLogs.get(exercise.id)?.summary ?? null,
            lastLogValues: latestLogs.get(exercise.id)?.values ?? [],
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
            },
          },
        },
      },
    },
  })

  return sessions.map((session) => {
    const exerciseMap = new Map<string, SessionExerciseSummary>()

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
          valueSummary: formatLogSummary(setLog.exercise.logType, [value]),
        })
        continue
      }

      const existingValues = savedExercise.valueSummary
        .replace(/ (kg|rep|s)$/, "")
        .split(" · ")
      exerciseMap.set(setLog.exerciseId, {
        ...savedExercise,
        valueSummary: formatLogSummary(setLog.exercise.logType, [
          ...existingValues,
          value,
        ]),
      })
    }

    return {
      id: session.id,
      routineId: session.routine.id,
      routineName: session.routine.name,
      performedAt: session.performedAt.toISOString(),
      note: session.note,
      exercises: [...exerciseMap.values()],
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
    setSummary: buildSessionSetSummary(movementLogType, session.values),
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
    },
    availableMetrics: getAvailableProgressMetrics(movementLogType),
    sessions,
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
