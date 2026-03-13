import 'server-only';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { parseCreateWorkoutSessionInput } from '@/lib/workouts/validation';
import type { CreateWorkoutSessionInput } from '@/lib/workouts/types';

function indexWeightedExercisesById(
  sections: Array<{
    groups: Array<{
      series: number;
      exercises: Array<{
        id: string;
        tracksWeight: boolean;
      }>;
    }>;
  }>
) {
  const weightedExerciseMap = new Map<string, { maxSets: number }>();

  for (const section of sections) {
    for (const group of section.groups) {
      for (const exercise of group.exercises) {
        if (!exercise.tracksWeight) {
          continue;
        }

        weightedExerciseMap.set(exercise.id, { maxSets: group.series });
      }
    }
  }

  return weightedExerciseMap;
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
                  tracksWeight: true
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

  const weightedExerciseMap = indexWeightedExercisesById(routine.sections);

  for (const setLog of input.setLogs) {
    const exerciseMeta = weightedExerciseMap.get(setLog.exerciseId);

    if (!exerciseMeta) {
      throw new Error('The submitted exercise does not belong to the selected routine.');
    }

    if (setLog.setNumber > exerciseMeta.maxSets) {
      throw new Error('The submitted set number exceeds the configured number of series.');
    }
  }
}

export async function createWorkoutSession(rawInput: unknown) {
  const input = parseCreateWorkoutSessionInput(rawInput);
  await validateRoutineSessionInput(input);

  const workoutSession = await prisma.workoutSession.create({
    data: {
      routineId: input.routineId,
      note: input.note,
      setLogs: {
        create: input.setLogs.map((setLog) => ({
          exerciseId: setLog.exerciseId,
          setNumber: setLog.setNumber,
          weightKg: setLog.weightKg
        }))
      }
    },
    select: {
      id: true
    }
  });

  revalidatePath('/');

  return workoutSession;
}
