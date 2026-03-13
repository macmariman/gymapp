import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkoutApp } from '@/components/workouts/workout-app';
import type { WorkoutPageData } from '@/lib/workouts/types';

const workoutPageData: WorkoutPageData = {
  routines: [
    {
      id: 'routine-1',
      name: 'Rutina 1',
      summary: 'Pecho y piernas',
      lastSessionAt: '2026-03-10T10:00:00.000Z'
    }
  ],
  routineDetails: [
    {
      id: 'routine-1',
      name: 'Rutina 1',
      summary: 'Pecho y piernas',
      lastSessionAt: '2026-03-10T10:00:00.000Z',
      sections: [
        {
          id: 'section-1',
          name: 'Fuerza',
          groups: [
            {
              id: 'group-1',
              name: 'Bloque 1',
              sectionName: 'Fuerza',
              series: 3,
              exercises: [
                {
                  id: 'exercise-1',
                  name: 'Pecho plano con barra',
                  targetType: 'reps',
                  targetValue: 10,
                  note: null,
                  tracksWeight: true,
                  lastWeightSummary: '60 kg / 62.5 kg'
                },
                {
                  id: 'exercise-2',
                  name: 'Fondo tríceps en banco',
                  targetType: 'reps',
                  targetValue: 10,
                  note: null,
                  tracksWeight: false,
                  lastWeightSummary: null
                }
              ]
            }
          ]
        }
      ]
    }
  ],
  attendance: {
    year: 2026,
    month: 3,
    daysWithSessions: [3, 10]
  },
  history: []
};

describe('WorkoutApp', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'session-1' })
    }) as jest.Mock;
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('renders block series and exercise targets in the right level', () => {
    render(<WorkoutApp {...workoutPageData} />);

    expect(screen.getByText('Bloque 1')).toBeInTheDocument();
    expect(screen.getByText('3 series')).toBeInTheDocument();
    expect(screen.getAllByText('10 reps').length).toBeGreaterThan(0);
  });

  it('submits a session with weights and shows success feedback', async () => {
    const user = userEvent.setup();
    render(<WorkoutApp {...workoutPageData} />);

    await user.type(screen.getByLabelText('Serie 1'), '62.5');
    await user.click(screen.getByRole('button', { name: 'Guardar sesión' }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/workout-sessions',
        expect.objectContaining({
          method: 'POST'
        })
      );
    });

    expect(await screen.findByText('Sesión guardada correctamente.')).toBeInTheDocument();
  });
});
