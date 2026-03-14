import { parseCreateWorkoutSessionInput } from '@/lib/workouts/validation';

describe('parseCreateWorkoutSessionInput', () => {
  it('normalizes valid logged values and trims the note', () => {
    const result = parseCreateWorkoutSessionInput({
      routineId: 'routine-1',
      note: '  Buen entrenamiento  ',
      setLogs: [
        {
          exerciseId: 'exercise-1',
          slotExerciseId: 'exercise-1',
          setNumber: 1,
          value: '62.5'
        }
      ]
    });

    expect(result).toEqual({
      routineId: 'routine-1',
      note: 'Buen entrenamiento',
      setLogs: [
        {
          exerciseId: 'exercise-1',
          slotExerciseId: 'exercise-1',
          setNumber: 1,
          value: '62.5'
        }
      ]
    });
  });

  it('rejects duplicate exercise/set pairs', () => {
    expect(() =>
      parseCreateWorkoutSessionInput({
        routineId: 'routine-1',
        setLogs: [
          {
            exerciseId: 'exercise-1',
            slotExerciseId: 'exercise-1',
            setNumber: 1,
            value: '60'
          },
          {
            exerciseId: 'exercise-2',
            slotExerciseId: 'exercise-1',
            setNumber: 1,
            value: '62.5'
          }
        ]
      })
    ).toThrow('Duplicate set entry.');
  });

  it('rejects sessions without sets', () => {
    expect(() =>
      parseCreateWorkoutSessionInput({
        routineId: 'routine-1',
        note: 'Solo una nota',
        setLogs: []
      })
    ).toThrow();
  });
});
