jest.mock('next/cache', () => ({
  revalidatePath: jest.fn()
}));

jest.mock('@/lib/prisma', () => ({
  prisma: {
    routine: {
      findUnique: jest.fn()
    },
    workoutSession: {
      create: jest.fn()
    }
  }
}));

import { prisma } from '@/lib/prisma';
import { createWorkoutSession } from '@/lib/workouts/create-workout-session';

describe('createWorkoutSession', () => {
  const mockedFindUnique = jest.mocked(prisma.routine.findUnique);
  const mockedCreate = jest.mocked(prisma.workoutSession.create);

  beforeEach(() => {
    mockedFindUnique.mockResolvedValue({
      id: 'routine-1',
      sections: [
        {
          groups: [
            {
              series: 3,
              exercises: [
                {
                  id: 'exercise-1',
                  logType: 'weight'
                },
                {
                  id: 'exercise-2',
                  logType: 'weight'
                }
              ]
            },
            {
              series: 4,
              exercises: [
                {
                  id: 'exercise-3',
                  logType: 'weight'
                }
              ]
            }
          ]
        }
      ]
    } as never);
    mockedCreate.mockResolvedValue({ id: 'session-1' } as never);
  });

  it('creates a valid session', async () => {
    const result = await createWorkoutSession({
      routineId: 'routine-1',
      note: 'Firme',
      setLogs: [
        {
          exerciseId: 'exercise-1',
          slotExerciseId: 'exercise-1',
          setNumber: 1,
          value: '60'
        }
      ]
    });

    expect(result).toEqual({ id: 'session-1' });
    expect(mockedCreate).toHaveBeenCalled();
  });

  it('rejects exercises outside the selected routine', async () => {
    await expect(
      createWorkoutSession({
        routineId: 'routine-1',
        setLogs: [
          {
            exerciseId: 'exercise-999',
            slotExerciseId: 'exercise-1',
            setNumber: 1,
            value: '60'
          }
        ]
      })
    ).rejects.toThrow('The submitted exercise does not belong to the selected routine.');
  });

  it('rejects slots outside the selected routine', async () => {
    await expect(
      createWorkoutSession({
        routineId: 'routine-1',
        setLogs: [
          {
            exerciseId: 'exercise-1',
            slotExerciseId: 'exercise-999',
            setNumber: 1,
            value: '60'
          }
        ]
      })
    ).rejects.toThrow('The submitted exercise slot does not belong to the selected routine.');
  });

  it('uses the destination slot series when validating swapped exercises', async () => {
    await expect(
      createWorkoutSession({
        routineId: 'routine-1',
        setLogs: [
          {
            exerciseId: 'exercise-1',
            slotExerciseId: 'exercise-3',
            setNumber: 4,
            value: '60'
          }
        ]
      })
    ).resolves.toEqual({ id: 'session-1' });
  });

  it('rejects set numbers above the destination slot series', async () => {
    await expect(
      createWorkoutSession({
        routineId: 'routine-1',
        setLogs: [
          {
            exerciseId: 'exercise-3',
            slotExerciseId: 'exercise-1',
            setNumber: 4,
            value: '60'
          }
        ]
      })
    ).rejects.toThrow('The submitted set number exceeds the configured number of series.');
  });
});
