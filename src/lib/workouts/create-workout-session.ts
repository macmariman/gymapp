import 'server-only';

import type { ExerciseLogType } from '@prisma/client';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseCreateWorkoutSessionInput } from '@/lib/workouts/validation';
import type { CreateWorkoutSessionInput } from '@/lib/workouts/types';

function normalizeLoggedValue(logType: Exclude<ExerciseLogType, 'none'>, value: string) {
  const parsedValue = Number(value);

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new Error('The submitted value is invalid.');
  }

  if (logType === 'weight') {
    return {
      weightKg: parsedValue.toFixed(2)
    };
  }

  if (!Number.isInteger(parsedValue)) {
    throw new Error('Reps and time values must be whole numbers.');
  }

  return logType === 'time'
    ? {
        durationSeconds: parsedValue
      }
    : {
        repsCount: parsedValue
      };
}

function indexLoggableExercisesById(
  sections: Array<{
    groups: Array<{
      series: number;
      exercises: Array<{
        id: string;
        logType: ExerciseLogType;
      }>;
    }>;
  }>
) {
  const exerciseMap = new Map<string, { logType: Exclude<ExerciseLogType, 'none'>; maxSets: number }>();

  for (const section of sections) {
    for (const group of section.groups) {
      for (const exercise of group.exercises) {
        if (exercise.logType === 'none') {
          continue;
        }

        exerciseMap.set(exercise.id, {
          logType: exercise.logType,
          maxSets: group.series
        });
      }
    }
  }

  return exerciseMap;
}

async function validateRoutineSessionInput(input: CreateWorkoutSessionInput) {
  const routine = await prisma.routine.findUnique({
    where: {
      id: input.routineId
    },
    include: {
      sections: {
        include: {
          groups: {
            include: {
              exercises: {
                select: {
                  id: true,
                  logType: true
                }
              }
            }
          }
        }
      }
    }
  });

  if (!routine) {
    throw new Error('The selected routine does not exist.');
  }

  const exerciseMap = indexLoggableExercisesById(routine.sections);
  const normalizedSetLogs = input.setLogs.map((setLog) => {
    const exerciseMeta = exerciseMap.get(setLog.exerciseId);

    if (!exerciseMeta) {
      throw new Error('The submitted exercise does not belong to the selected routine.');
    }

    if (setLog.setNumber > exerciseMeta.maxSets) {
      throw new Error('The submitted set number exceeds the configured number of series.');
    }

    return {
      exerciseId: setLog.exerciseId,
      setNumber: setLog.setNumber,
      ...normalizeLoggedValue(exerciseMeta.logType, setLog.value)
    };
  });

  return normalizedSetLogs;
}

export async function createWorkoutSession(rawInput: unknown) {
  const input = parseCreateWorkoutSessionInput(rawInput);
  const normalizedSetLogs = await validateRoutineSessionInput(input);

  const workoutSession = await prisma.workoutSession.create({
    data: {
      routineId: input.routineId,
      note: input.note,
      setLogs: {
        create: normalizedSetLogs
      }
    },
    select: {
      id: true
    }
  });

  revalidatePath('/');

  return workoutSession;
}
