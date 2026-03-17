import "server-only"

import { revalidatePath } from "next/cache"
import type { ExerciseLogType } from "@prisma/client"

import { prisma } from "@/lib/prisma"
import { parseMinutesSeconds } from "@/lib/workouts/duration"
import type {
  CreateWorkoutSessionInput,
  ExerciseDurationFormat,
} from "@/lib/workouts/types"
import { parseCreateWorkoutSessionInput } from "@/lib/workouts/validation"

function normalizeLoggedValue(
  logType: Exclude<ExerciseLogType, "none">,
  value: string,
  durationFormat: ExerciseDurationFormat
) {
  if (logType === "time" && durationFormat === "mmss") {
    const parsedDuration = parseMinutesSeconds(value)

    if (parsedDuration === null) {
      throw new Error("Time values must use the mm:ss format.")
    }

    return {
      durationSeconds: parsedDuration,
    }
  }

  const parsedValue = Number(value)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error("The submitted value is invalid.")
  }

  if (logType === "weight") {
    return {
      weightKg: parsedValue.toFixed(2),
    }
  }

  if (!Number.isInteger(parsedValue)) {
    throw new Error("Reps and time values must be whole numbers.")
  }

  return logType === "time"
    ? {
        durationSeconds: parsedValue,
      }
    : {
        repsCount: parsedValue,
      }
}

function indexLoggableExercisesById(
  sections: Array<{
    groups: Array<{
      series: number
      exercises: Array<{
        id: string
        logType: ExerciseLogType
        movement: {
          durationFormat: ExerciseDurationFormat
        }
      }>
    }>
  }>
) {
  const exerciseMap = new Map<
    string,
    {
      logType: Exclude<ExerciseLogType, "none">
      durationFormat: ExerciseDurationFormat
      maxSets: number
    }
  >()

  for (const section of sections) {
    for (const group of section.groups) {
      for (const exercise of group.exercises) {
        if (exercise.logType === "none") {
          continue
        }

        exerciseMap.set(exercise.id, {
          logType: exercise.logType,
          durationFormat: exercise.movement.durationFormat,
          maxSets: group.series,
        })
      }
    }
  }

  return exerciseMap
}

async function validateRoutineSessionInput(input: CreateWorkoutSessionInput) {
  const routine = await prisma.routine.findUnique({
    where: {
      id: input.routineId,
    },
    include: {
      sections: {
        include: {
          groups: {
            include: {
              exercises: {
                select: {
                  id: true,
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
      },
    },
  })

  if (!routine) {
    throw new Error("The selected routine does not exist.")
  }

  const exerciseMap = indexLoggableExercisesById(routine.sections)
  const normalizedSetLogs = input.setLogs.map((setLog) => {
    const exerciseMeta = exerciseMap.get(setLog.exerciseId)
    const slotMeta = exerciseMap.get(setLog.slotExerciseId)

    if (!exerciseMeta) {
      throw new Error(
        "The submitted exercise does not belong to the selected routine."
      )
    }

    if (!slotMeta) {
      throw new Error(
        "The submitted exercise slot does not belong to the selected routine."
      )
    }

    if (setLog.setNumber > slotMeta.maxSets) {
      throw new Error(
        "The submitted set number exceeds the configured number of series."
      )
    }

    return {
      exerciseId: setLog.exerciseId,
      setNumber: setLog.setNumber,
      ...normalizeLoggedValue(
        exerciseMeta.logType,
        setLog.value,
        exerciseMeta.durationFormat
      ),
    }
  })

  return normalizedSetLogs
}

export async function createWorkoutSession(rawInput: unknown) {
  const input = parseCreateWorkoutSessionInput(rawInput)
  const normalizedSetLogs = await validateRoutineSessionInput(input)

  const workoutSession = await prisma.workoutSession.create({
    data: {
      routineId: input.routineId,
      note: input.note,
      setLogs: {
        create: normalizedSetLogs,
      },
    },
    select: {
      id: true,
    },
  })

  revalidatePath("/")

  return workoutSession
}
