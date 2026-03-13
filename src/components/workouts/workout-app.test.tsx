import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { WorkoutPageData } from "@/lib/workouts/types"
import { WorkoutApp } from "@/components/workouts/workout-app"

const workoutPageData: WorkoutPageData = {
  routines: [
    {
      id: "routine-1",
      name: "Rutina 1",
      summary: "Pecho y piernas",
      lastSessionAt: "2026-03-10T10:00:00.000Z",
    },
    {
      id: "routine-2",
      name: "Rutina 2",
      summary: "Espalda y hombros",
      lastSessionAt: "2026-03-08T10:00:00.000Z",
    },
  ],
  routineDetails: [
    {
      id: "routine-1",
      name: "Rutina 1",
      summary: "Pecho y piernas",
      lastSessionAt: "2026-03-10T10:00:00.000Z",
      sections: [
        {
          id: "section-1",
          name: "Fuerza",
          groups: [
            {
              id: "group-1",
              name: "Bloque 1",
              sectionName: "Fuerza",
              series: 3,
              exercises: [
                {
                  id: "exercise-1",
                  name: "Pecho plano con barra",
                  targetType: "reps",
                  targetValue: 10,
                  note: null,
                  logType: "weight",
                  lastLogSummary: "60 kg / 62.5 kg",
                  lastLogValues: ["60", "62.5"],
                },
                {
                  id: "exercise-2",
                  name: "Fondo tríceps en banco",
                  targetType: "reps",
                  targetValue: 10,
                  note: null,
                  logType: "reps",
                  lastLogSummary: null,
                  lastLogValues: [],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "routine-2",
      name: "Rutina 2",
      summary: "Espalda y hombros",
      lastSessionAt: "2026-03-08T10:00:00.000Z",
      sections: [
        {
          id: "section-2",
          name: "Volumen",
          groups: [
            {
              id: "group-2",
              name: "Bloque 2",
              sectionName: "Volumen",
              series: 4,
              exercises: [
                {
                  id: "exercise-3",
                  name: "Remo con barra",
                  targetType: "reps",
                  targetValue: 12,
                  note: null,
                  logType: "weight",
                  lastLogSummary: "50 kg / 52.5 kg",
                  lastLogValues: ["50", "52.5"],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  attendance: {
    year: 2026,
    month: 3,
    daysWithSessions: [3, 10],
  },
  history: [],
}

describe("WorkoutApp", () => {
  const scrollIntoViewMock = jest.fn()

  beforeEach(() => {
    scrollIntoViewMock.mockReset()
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    })

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "session-1" }),
    }) as jest.Mock
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it("renders block series and exercise targets in the right level", () => {
    render(<WorkoutApp {...workoutPageData} />)

    expect(screen.getAllByText("Bloque 1").length).toBeGreaterThan(0)
    expect(screen.getAllByText("3 series").length).toBeGreaterThan(0)
    expect(screen.getAllByText("10 reps").length).toBeGreaterThan(0)
    expect(screen.getByText("Fondo tríceps en banco")).toBeInTheDocument()
    expect(screen.getByLabelText("Fondo tríceps en banco serie 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Pecho plano con barra serie 1")).toHaveValue("60")
    expect(screen.getByLabelText("Pecho plano con barra serie 2")).toHaveValue("62.5")
  })

  it("suggests the next routine not completed in the current week", () => {
    const now = new Date()
    const thisWeekSessionDate = new Date(now)
    const day = thisWeekSessionDate.getDay()
    const diff = day === 0 ? -6 : 1 - day

    thisWeekSessionDate.setDate(thisWeekSessionDate.getDate() + diff)
    thisWeekSessionDate.setHours(12, 0, 0, 0)

    render(
      <WorkoutApp
        {...workoutPageData}
        history={[
          {
            id: "session-1",
            routineId: "routine-1",
            routineName: "Rutina 1",
            performedAt: thisWeekSessionDate.toISOString(),
            note: null,
            exercises: [],
          },
        ]}
      />
    )

    expect(screen.getAllByText("Rutina 2").length).toBeGreaterThan(0)
    expect(screen.getByLabelText("Remo con barra serie 1")).toHaveValue("50")
  })

  it("submits a session with weights and shows success feedback", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.clear(screen.getByLabelText("Pecho plano con barra serie 1"))
    await user.type(screen.getByLabelText("Pecho plano con barra serie 1"), "62.5")
    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/workout-sessions",
        expect.objectContaining({
          method: "POST",
        })
      )
    })

    expect(
      await screen.findByText("Sesión guardada correctamente.")
    ).toBeInTheDocument()
  })

  it("collapses the attendance card content from the header trigger", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    expect(screen.getByText("Asistencia del mes actual")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /asistencia/i }))

    expect(
      screen.queryByText("Asistencia del mes actual")
    ).not.toBeInTheDocument()
  })

  it("scrolls to the routine card when selecting a different routine", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /rutina 2/i }))

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    })
    expect(screen.getAllByText("Bloque 2").length).toBeGreaterThan(0)
    expect(
      screen.getByLabelText("Remo con barra serie 1")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Remo con barra serie 1")).toHaveValue("50")
  })
})
