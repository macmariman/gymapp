import 'server-only';

import { prisma } from '@/lib/prisma';
import { formatWeightSummary } from '@/lib/workouts/formatting';
import type {
  AttendanceMonth,
  ExerciseGroupView,
  RoutineSummary,
  RoutineWithStructure,
  SessionExerciseSummary,
  SessionHistoryEntry,
  WorkoutPageData
} from '@/lib/workouts/types';

function getMonthBounds(date: Date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);

  return { start, end };
}

async function getLatestWeightSummaries(exerciseIds: string[]) {
  if (exerciseIds.length === 0) {
    return new Map<string, string>();
  }

  const setLogs = await prisma.exerciseSetLog.findMany({
    where: {
      exerciseId: {
        in: exerciseIds
      }
    },
    orderBy: [
      {
        session: {
          performedAt: 'desc'
        }
      },
      {
        setNumber: 'asc'
      }
    ],
    select: {
      exerciseId: true,
      sessionId: true,
      weightKg: true
    }
  });

  const sessionByExercise = new Map<string, string>();
  const weightsByExercise = new Map<string, string[]>();

  for (const setLog of setLogs) {
    const savedSessionId = sessionByExercise.get(setLog.exerciseId);

    if (!savedSessionId) {
      sessionByExercise.set(setLog.exerciseId, setLog.sessionId);
      weightsByExercise.set(setLog.exerciseId, []);
    }

    if (sessionByExercise.get(setLog.exerciseId) !== setLog.sessionId || !setLog.weightKg) {
      continue;
    }

    weightsByExercise.get(setLog.exerciseId)?.push(setLog.weightKg.toString());
  }

  return new Map(
    [...weightsByExercise.entries()].map(([exerciseId, weights]) => [
      exerciseId,
      formatWeightSummary(weights)
    ])
  );
}

export async function getRoutineSummaries(): Promise<RoutineSummary[]> {
  const routines = await prisma.routine.findMany({
    orderBy: {
      sortOrder: 'asc'
    },
    select: {
      id: true,
      name: true,
      summary: true,
      sessions: {
        orderBy: {
          performedAt: 'desc'
        },
        take: 1,
        select: {
          performedAt: true
        }
      }
    }
  });

  return routines.map((routine) => ({
    id: routine.id,
    name: routine.name,
    summary: routine.summary,
    lastSessionAt: routine.sessions[0]?.performedAt.toISOString() ?? null
  }));
}

export async function getRoutineDetails(): Promise<RoutineWithStructure[]> {
  const routines = await prisma.routine.findMany({
    orderBy: {
      sortOrder: 'asc'
    },
    include: {
      sessions: {
        orderBy: {
          performedAt: 'desc'
        },
        take: 1,
        select: {
          performedAt: true
        }
      },
      sections: {
        orderBy: {
          sortOrder: 'asc'
        },
        include: {
          groups: {
            orderBy: {
              sortOrder: 'asc'
            },
            include: {
              exercises: {
                orderBy: {
                  sortOrder: 'asc'
                }
              }
            }
          }
        }
      }
    }
  });

  const exerciseIds = routines.flatMap((routine) =>
    routine.sections.flatMap((section) =>
      section.groups.flatMap((group) =>
        group.exercises.filter((exercise) => exercise.tracksWeight).map((exercise) => exercise.id)
      )
    )
  );

  const latestWeights = await getLatestWeightSummaries(exerciseIds);

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
            name: exercise.name,
            targetType: exercise.targetType,
            targetValue: exercise.targetValue,
            note: exercise.note,
            tracksWeight: exercise.tracksWeight,
            lastWeightSummary: latestWeights.get(exercise.id) ?? null
          }))
        })
      )
    }))
  }));
}

export async function getAttendanceMonth(date = new Date()): Promise<AttendanceMonth> {
  const { start, end } = getMonthBounds(date);
  const sessions = await prisma.workoutSession.findMany({
    where: {
      performedAt: {
        gte: start,
        lt: end
      }
    },
    select: {
      performedAt: true
    }
  });

  const daysWithSessions = [...new Set(sessions.map((session) => session.performedAt.getDate()))].sort(
    (left, right) => left - right
  );

  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    daysWithSessions
  };
}

export async function getWorkoutSessionHistory(): Promise<SessionHistoryEntry[]> {
  const sessions = await prisma.workoutSession.findMany({
    orderBy: {
      performedAt: 'desc'
    },
    include: {
      routine: {
        select: {
          id: true,
          name: true
        }
      },
      setLogs: {
        orderBy: {
          setNumber: 'asc'
        },
        include: {
          exercise: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    }
  });

  return sessions.map((session) => {
    const exerciseMap = new Map<string, SessionExerciseSummary>();

    for (const setLog of session.setLogs) {
      if (!setLog.weightKg) {
        continue;
      }

      const savedExercise = exerciseMap.get(setLog.exerciseId);
      const weightLabel = setLog.weightKg.toString();

      if (!savedExercise) {
        exerciseMap.set(setLog.exerciseId, {
          exerciseId: setLog.exerciseId,
          exerciseName: setLog.exercise.name,
          weightSummary: formatWeightSummary([weightLabel])
        });
        continue;
      }

      const existingWeights = savedExercise.weightSummary.split(' / ').map((value) => value.replace(' kg', ''));
      exerciseMap.set(setLog.exerciseId, {
        ...savedExercise,
        weightSummary: formatWeightSummary([...existingWeights, weightLabel])
      });
    }

    return {
      id: session.id,
      routineId: session.routine.id,
      routineName: session.routine.name,
      performedAt: session.performedAt.toISOString(),
      note: session.note,
      exercises: [...exerciseMap.values()]
    };
  });
}

export async function getWorkoutPageData(): Promise<WorkoutPageData> {
  const [routines, routineDetails, attendance, history] = await Promise.all([
    getRoutineSummaries(),
    getRoutineDetails(),
    getAttendanceMonth(),
    getWorkoutSessionHistory()
  ]);

  return {
    routines,
    routineDetails,
    attendance,
    history
  };
}
