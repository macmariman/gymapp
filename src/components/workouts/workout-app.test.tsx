import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { WorkoutPageData } from "@/lib/workouts/types"
import { WorkoutApp } from "@/components/workouts/workout-app"

const workoutDraftKeyPrefix = "gym-app.workout-session-draft:"

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
          id: "section-0",
          name: "Zona media",
          groups: [
            {
              id: "group-0",
              name: "Zona media",
              sectionName: "Zona media",
              series: 1,
              exercises: [
                {
                  id: "exercise-0",
                  movementId: "movement-0",
                  name: "Plancha ventral",
                  targetType: "time",
                  targetValue: 30,
                  note: null,
                  logType: "time",
                  durationFormat: "seconds",
                  lastLogSummary: "30 s",
                  lastLogValues: ["30"],
                  previousNote: null,
                },
              ],
            },
          ],
        },
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
                  movementId: "movement-1",
                  name: "Pecho plano con barra",
                  targetType: "reps",
                  targetValue: 10,
                  note: null,
                  logType: "weight",
                  durationFormat: "seconds",
                  lastLogSummary: "60 kg / 62.5 kg",
                  lastLogValues: ["60", "62.5"],
                  previousNote: null,
                },
                {
                  id: "exercise-2",
                  movementId: "movement-2",
                  name: "Fondo tríceps en banco",
                  targetType: "reps",
                  targetValue: 10,
                  note: null,
                  logType: "reps",
                  durationFormat: "seconds",
                  lastLogSummary: null,
                  lastLogValues: [],
                  previousNote: null,
                },
              ],
            },
            {
              id: "group-3",
              name: "Bloque 2",
              sectionName: "Fuerza",
              series: 4,
              exercises: [
                {
                  id: "exercise-4",
                  movementId: "movement-4",
                  name: "Aperturas con mancuernas",
                  targetType: "reps",
                  targetValue: 12,
                  note: null,
                  logType: "weight",
                  durationFormat: "seconds",
                  lastLogSummary: "18 kg / 18 kg / 16 kg / 14 kg",
                  lastLogValues: ["18", "18", "16", "14"],
                  previousNote: null,
                },
              ],
            },
          ],
        },
        {
          id: "section-cardio-1",
          name: "Cardio",
          groups: [
            {
              id: "group-cardio-1",
              name: "Cardio",
              sectionName: "Cardio",
              series: 1,
              exercises: [
                {
                  id: "exercise-run-1",
                  movementId: "movement-run",
                  name: "Correr",
                  targetType: "time",
                  targetValue: 900,
                  note: null,
                  logType: "time",
                  durationFormat: "mmss",
                  lastLogSummary: "15:00",
                  lastLogValues: ["15:00"],
                  previousNote: null,
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
                  movementId: "movement-3",
                  name: "Remo con barra",
                  targetType: "reps",
                  targetValue: 12,
                  note: null,
                  logType: "weight",
                  durationFormat: "seconds",
                  lastLogSummary: "50 kg / 52.5 kg",
                  lastLogValues: ["50", "52.5"],
                  previousNote: null,
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
  const wakeLockReleaseMock = jest.fn().mockResolvedValue(undefined)
  const wakeLockRequestMock = jest.fn().mockResolvedValue({
    released: false,
    release: wakeLockReleaseMock,
  })

  beforeEach(() => {
    scrollIntoViewMock.mockReset()
    wakeLockReleaseMock.mockClear()
    wakeLockRequestMock.mockClear()
    window.history.pushState({}, "", "/")
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
      configurable: true,
      value: scrollIntoViewMock,
    })
    Object.defineProperty(window.navigator, "wakeLock", {
      configurable: true,
      value: {
        request: wakeLockRequestMock,
      },
    })
    window.localStorage.clear()

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: "session-1" }),
    }) as jest.Mock
  })

  afterEach(() => {
    jest.useRealTimers()
    window.localStorage.clear()
    jest.resetAllMocks()
  })

  it("starts with all groups collapsed and renders inputs after expanding blocks", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    expect(
      screen.queryByLabelText("Plancha ventral serie 1")
    ).not.toBeInTheDocument()
    expect(
      screen.queryByLabelText("Pecho plano con barra serie 1")
    ).not.toBeInTheDocument()
    expect(screen.queryByLabelText("Correr serie 1")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /zona media/i }))

    expect(screen.getByLabelText("Plancha ventral serie 1")).toHaveValue("30")

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))

    expect(screen.getAllByText("Bloque 1").length).toBeGreaterThan(0)
    expect(screen.getAllByText("10 rep").length).toBeGreaterThan(0)
    expect(
      screen.getByLabelText("Fondo tríceps en banco serie 1")
    ).toBeInTheDocument()
    expect(screen.getByLabelText("Pecho plano con barra serie 1")).toHaveValue(
      "60"
    )
    expect(screen.getByLabelText("Pecho plano con barra serie 2")).toHaveValue(
      "62.5"
    )

    const firstSeriesContainer = screen
      .getByLabelText("Pecho plano con barra serie 1")
      .closest("div.space-y-1")

    expect(firstSeriesContainer).not.toBeNull()

    const firstSeriesScope = within(firstSeriesContainer as HTMLElement)
    expect(
      firstSeriesScope.getByText("Pecho plano con barra")
    ).toBeInTheDocument()
    expect(
      firstSeriesScope.getByText("Fondo tríceps en banco")
    ).toBeInTheDocument()
    expect(
      firstSeriesScope.getByLabelText("Pecho plano con barra serie 1")
    ).toHaveValue("60")
    expect(
      firstSeriesScope.getByLabelText("Fondo tríceps en banco serie 1")
    ).toHaveValue("")

    await user.click(screen.getByRole("button", { name: /^cardio/i }))

    expect(screen.getByText("15:00")).toBeInTheDocument()
    expect(screen.getByLabelText("Correr serie 1")).toHaveAttribute(
      "placeholder",
      "mm:ss"
    )
    expect(screen.getByLabelText("Correr serie 1")).toHaveValue("15:00")
    expect(
      screen.getAllByRole("link", {
        name: "Ver progreso de Pecho plano con barra",
      })[0]
    ).toHaveAttribute(
      "href",
      "/progress/movement-1?routineId=routine-1&slotId=exercise-1"
    )
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
    expect(
      screen.queryByLabelText("Remo con barra serie 1")
    ).not.toBeInTheDocument()
  })

  it("restores the routine from the query string when coming back from progress", () => {
    window.history.pushState({}, "", "/?routineId=routine-2&slotId=exercise-3")

    render(<WorkoutApp {...workoutPageData} />)

    expect(screen.getAllByText("Rutina 2").length).toBeGreaterThan(0)
    expect(screen.getByLabelText("Remo con barra serie 1")).toBeInTheDocument()
    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    })
  })

  it("opens the next group and closes the current one when focus advances past the block", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))

    const lastInput = screen.getByLabelText("Fondo tríceps en banco serie 3")
    const notesTextarea = screen.getByPlaceholderText(
      "Cómo te sentiste, ajustes..."
    )

    act(() => {
      lastInput.focus()
    })

    fireEvent.blur(lastInput, { relatedTarget: notesTextarea })

    await waitFor(() => {
      expect(
        screen.queryByLabelText("Pecho plano con barra serie 1")
      ).not.toBeInTheDocument()
      expect(
        screen.getByLabelText("Aperturas con mancuernas serie 1")
      ).toHaveFocus()
    })
  })

  it("submits a session with weights and shows success feedback", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.clear(screen.getByLabelText("Pecho plano con barra serie 1"))
    await user.type(
      screen.getByLabelText("Pecho plano con barra serie 1"),
      "62.5"
    )
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

  it("opens an exercise quick note dialog and adds a note to the session note", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Agregar nota rápida para Pecho plano con barra serie 1",
      })
    )

    const dialog = screen.getByRole("dialog")
    expect(
      within(dialog).getByText("Nota rápida: Pecho plano con barra")
    ).toBeInTheDocument()
    expect(
      within(dialog).getByRole("button", { name: "Agregar nota" })
    ).toBeDisabled()

    await user.click(
      within(dialog).getByRole("button", { name: "Costó completar" })
    )
    await user.type(
      within(dialog).getByLabelText("Detalle opcional"),
      "Última serie salió lenta."
    )
    await user.click(
      within(dialog).getByRole("button", { name: "Agregar nota" })
    )

    expect(
      screen.getByPlaceholderText("Cómo te sentiste, ajustes...")
    ).toHaveValue(
      "Pecho plano con barra - [Costó completar] - Última serie salió lenta."
    )
    expect(screen.getByText("Nota agregada")).toBeInTheDocument()
  })

  it("closes the exercise quick note dialog without changing the note", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Agregar nota rápida para Pecho plano con barra serie 1",
      })
    )

    const dialog = screen.getByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Subir peso" }))
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    expect(
      screen.getByPlaceholderText("Cómo te sentiste, ajustes...")
    ).toHaveValue("")
  })

  it("groups global quick note chips under the session line", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: "Dormí poco" }))
    await user.click(screen.getByRole("button", { name: "Fatiga alta" }))

    expect(screen.getByRole("button", { name: "Dormí poco" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(screen.getByRole("button", { name: "Fatiga alta" })).toHaveAttribute(
      "aria-pressed",
      "true"
    )
    expect(
      screen.getByRole("button", { name: "Poca energía" })
    ).toHaveAttribute("aria-pressed", "false")
    expect(
      screen.getByPlaceholderText("Cómo te sentiste, ajustes...")
    ).toHaveValue("Sesión - [Dormí poco] [Fatiga alta]")
    expect(screen.getByText("Nota actualizada")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Dormí poco" }))

    expect(screen.getByRole("button", { name: "Dormí poco" })).toHaveAttribute(
      "aria-pressed",
      "false"
    )
    expect(
      screen.getByPlaceholderText("Cómo te sentiste, ajustes...")
    ).toHaveValue("Sesión - [Fatiga alta]")
  })

  it("submits quick notes through the existing session note payload", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Agregar nota rápida para Pecho plano con barra serie 1",
      })
    )
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Subir peso",
      })
    )
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "Agregar nota",
      })
    )
    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    const [, request] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    const payload = JSON.parse(String(request.body)) as {
      note: string
    }

    expect(payload.note).toBe("Pecho plano con barra - [Subir peso]")
  })

  it("restores a saved draft for the selected routine", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      `${workoutDraftKeyPrefix}routine-1`,
      JSON.stringify({
        version: 1,
        routineId: "routine-1",
        note: "Draft note",
        values: {
          "exercise-1:1": "66",
        },
        slotAssignments: {},
        dayExercisesByGroupId: {},
      })
    )

    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))

    await waitFor(() => {
      expect(
        screen.getByLabelText("Pecho plano con barra serie 1")
      ).toHaveValue("66")
    })
    expect(
      screen.getByPlaceholderText("Cómo te sentiste, ajustes...")
    ).toHaveValue("Draft note")
  })

  it("keeps drafts separated by routine", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      `${workoutDraftKeyPrefix}routine-2`,
      JSON.stringify({
        version: 1,
        routineId: "routine-2",
        note: "",
        values: {
          "exercise-3:1": "61",
        },
        slotAssignments: {},
        dayExercisesByGroupId: {},
      })
    )

    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /rutina 2/i }))
    await user.click(screen.getByRole("button", { name: /bloque 2/i }))

    await waitFor(() => {
      expect(screen.getByLabelText("Remo con barra serie 1")).toHaveValue("61")
    })
  })

  it("clears all workout drafts after saving a session", async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(
      `${workoutDraftKeyPrefix}routine-1`,
      JSON.stringify({
        version: 1,
        routineId: "routine-1",
        note: "",
        values: {
          "exercise-1:1": "66",
        },
        slotAssignments: {},
        dayExercisesByGroupId: {},
      })
    )
    window.localStorage.setItem(
      `${workoutDraftKeyPrefix}routine-2`,
      JSON.stringify({
        version: 1,
        routineId: "routine-2",
        note: "",
        values: {
          "exercise-3:1": "61",
        },
        slotAssignments: {},
        dayExercisesByGroupId: {},
      })
    )
    window.localStorage.setItem("gym-app.other-cache", "keep")

    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await waitFor(() => {
      expect(
        screen.getByLabelText("Pecho plano con barra serie 1")
      ).toHaveValue("66")
    })
    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    expect(
      window.localStorage.getItem(`${workoutDraftKeyPrefix}routine-1`)
    ).toBe(null)
    expect(
      window.localStorage.getItem(`${workoutDraftKeyPrefix}routine-2`)
    ).toBe(null)
    expect(window.localStorage.getItem("gym-app.other-cache")).toBe("keep")
  })

  it("does not keep an empty draft after returning blank inputs to blank", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.type(
      screen.getByLabelText("Fondo tríceps en banco serie 1"),
      "10"
    )

    await waitFor(() => {
      expect(
        window.localStorage.getItem(`${workoutDraftKeyPrefix}routine-1`)
      ).not.toBe(null)
    })

    await user.clear(screen.getByLabelText("Fondo tríceps en banco serie 1"))

    await waitFor(() => {
      expect(
        window.localStorage.getItem(`${workoutDraftKeyPrefix}routine-1`)
      ).toBe(null)
    })
  })

  it("masks the running input as mm:ss from numeric typing", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /^cardio/i }))
    const runningInput = screen.getByLabelText("Correr serie 1")

    await user.clear(runningInput)
    await user.type(runningInput, "1234")

    expect(runningInput).toHaveValue("12:34")

    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    const [, request] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    const payload = JSON.parse(String(request.body)) as {
      setLogs: Array<{
        exerciseId: string
        value: string
      }>
    }

    expect(payload.setLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: "exercise-run-1",
          value: "12:34",
        }),
      ])
    )
  })

  it("applies stopwatch time to seconds-based exercises", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    })
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /zona media/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Usar cronómetro en Plancha ventral serie 1",
      })
    )
    await user.click(screen.getByRole("button", { name: "Iniciar" }))

    act(() => {
      jest.advanceTimersByTime(37_000)
    })

    expect(screen.getByText("00:37")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Usar" }))

    expect(screen.getByLabelText("Plancha ventral serie 1")).toHaveValue("37")
    expect(screen.getByRole("button", { name: "Seguir" })).toBeInTheDocument()
  })

  it("requests and releases a wake lock while the stopwatch is running", async () => {
    jest.useFakeTimers()
    const lateReleaseMock = jest.fn().mockResolvedValue(undefined)
    let resolveWakeLockRequest:
      | ((value: {
          released: boolean
          release: typeof lateReleaseMock
        }) => void)
      | null = null

    wakeLockRequestMock.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveWakeLockRequest = resolve
        })
    )

    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    })
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /zona media/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Usar cronómetro en Plancha ventral serie 1",
      })
    )
    await user.click(screen.getByRole("button", { name: "Iniciar" }))

    await waitFor(() => {
      expect(wakeLockRequestMock).toHaveBeenCalledWith("screen")
    })

    await user.click(screen.getByRole("button", { name: "Pausar" }))

    expect(resolveWakeLockRequest).not.toBeNull()

    await act(async () => {
      resolveWakeLockRequest?.({
        released: false,
        release: lateReleaseMock,
      })
      await Promise.resolve()
    })

    await act(async () => {
      await Promise.resolve()
    })

    await waitFor(() => {
      expect(lateReleaseMock).toHaveBeenCalled()
    })
  })

  it("applies stopwatch time to mm:ss exercises", async () => {
    jest.useFakeTimers()
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    })
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /^cardio/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Usar cronómetro en Correr serie 1",
      })
    )
    await user.click(screen.getByRole("button", { name: "Iniciar" }))

    act(() => {
      jest.advanceTimersByTime(123_000)
    })

    expect(screen.getByText("02:03")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Usar" }))

    expect(screen.getByLabelText("Correr serie 1")).toHaveValue("02:03")
    expect(screen.getByRole("button", { name: "Seguir" })).toBeInTheDocument()
  })

  it("swaps exercises inside the same routine and can undo the swap", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    const pechoRow = screen
      .getByLabelText("Pecho plano con barra serie 1")
      .closest("div.grid")

    expect(pechoRow).not.toBeNull()

    await user.click(
      within(pechoRow as HTMLElement).getByRole("button", {
        name: "Intercambiar",
      })
    )

    expect(screen.getByText("Intercambiar ejercicio")).toBeInTheDocument()
    expect(
      screen.queryByRole("button", { name: /pecho plano con barra/i })
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole("button", { name: /aperturas con mancuernas/i })
    )

    expect(
      screen.getAllByText("Aperturas con mancuernas").length
    ).toBeGreaterThan(0)

    await user.click(screen.getByRole("button", { name: /bloque 2/i }))

    expect(screen.getAllByText("Pecho plano con barra").length).toBeGreaterThan(
      0
    )
    expect(screen.getAllByText("Swap").length).toBeGreaterThan(0)

    // After swap, "Pecho plano" moves to Bloque 2 (4 series), so serie 4 input exists
    expect(
      screen.getByLabelText("Pecho plano con barra serie 4")
    ).toBeInTheDocument()

    const swappedRow = screen
      .getByLabelText("Aperturas con mancuernas serie 1")
      .closest("div.grid")

    expect(swappedRow).not.toBeNull()

    await user.click(
      within(swappedRow as HTMLElement).getByRole("button", {
        name: "Deshacer intercambio",
      })
    )

    // After undo, "Pecho plano" is back in Bloque 1 (3 series), so serie 4 input is gone
    expect(
      screen.queryByLabelText("Pecho plano con barra serie 4")
    ).not.toBeInTheDocument()
    // And swap badges are cleared
    expect(screen.queryAllByText("Swap").length).toBe(0)
  })

  it("submits swapped exercises with their destination slot ids", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    const pechoRow = screen
      .getByLabelText("Pecho plano con barra serie 1")
      .closest("div.grid")

    expect(pechoRow).not.toBeNull()

    await user.click(
      within(pechoRow as HTMLElement).getByRole("button", {
        name: "Intercambiar",
      })
    )
    await user.click(
      screen.getByRole("button", { name: /aperturas con mancuernas/i })
    )
    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    const [, request] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    const payload = JSON.parse(String(request.body)) as {
      setLogs: Array<{
        exerciseId: string
        slotExerciseId: string
        setNumber: number
      }>
    }

    expect(payload.setLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: "exercise-4",
          slotExerciseId: "exercise-1",
          setNumber: 1,
        }),
        expect.objectContaining({
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-4",
          setNumber: 1,
        }),
      ])
    )
  })

  it("adds a day exercise to a block and submits it with the group id", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Agregar ejercicio del día",
      })
    )

    const dialog = screen.getByRole("dialog")
    expect(within(dialog).getByText("Elegir ejercicio")).toBeInTheDocument()
    expect(within(dialog).getByText("Remo con barra")).toBeInTheDocument()
    expect(
      within(dialog).queryByText("Pecho plano con barra")
    ).not.toBeInTheDocument()

    await user.click(within(dialog).getByText("Remo con barra"))

    expect(screen.getByLabelText("Remo con barra serie 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Remo con barra serie 2")).toBeInTheDocument()
    expect(screen.getByLabelText("Remo con barra serie 3")).toBeInTheDocument()
    expect(screen.getByLabelText("Remo con barra serie 1")).toHaveValue("50")
    expect(screen.getByLabelText("Remo con barra serie 2")).toHaveValue("52.5")
    expect(screen.getByLabelText("Remo con barra serie 3")).toHaveValue("")
    expect(
      screen.queryByLabelText("Remo con barra serie 4")
    ).not.toBeInTheDocument()

    await user.clear(screen.getByLabelText("Remo con barra serie 1"))
    await user.type(screen.getByLabelText("Remo con barra serie 1"), "55")
    await user.click(screen.getByRole("button", { name: "Guardar sesión" }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1)
    })

    const [, request] = (global.fetch as jest.Mock).mock.calls[0] as [
      string,
      RequestInit,
    ]
    const payload = JSON.parse(String(request.body)) as {
      setLogs: Array<{
        exerciseId: string
        groupId?: string
        setNumber: number
        value: string
      }>
    }

    expect(payload.setLogs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          exerciseId: "exercise-3",
          groupId: "group-1",
          setNumber: 1,
          value: "55",
        }),
      ])
    )
  })

  it("removes a day exercise before saving", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /bloque 1/i }))
    await user.click(
      screen.getByRole("button", {
        name: "Agregar ejercicio del día",
      })
    )
    await user.click(
      within(screen.getByRole("dialog")).getByText("Remo con barra")
    )

    expect(screen.getByLabelText("Remo con barra serie 1")).toBeInTheDocument()

    await user.click(
      screen.getAllByRole("button", { name: "Quitar Remo con barra" })[0]
    )

    expect(
      screen.queryByLabelText("Remo con barra serie 1")
    ).not.toBeInTheDocument()
  })

  it("expands the attendance card content from the header trigger", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    expect(
      screen.queryByText("Asistencia del mes actual")
    ).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: /asistencia/i }))

    expect(screen.getByText("Asistencia del mes actual")).toBeInTheDocument()
  })

  it("scrolls to the routine card when selecting a different routine", async () => {
    const user = userEvent.setup()
    render(<WorkoutApp {...workoutPageData} />)

    await user.click(screen.getByRole("button", { name: /rutina 2/i }))
    await user.click(screen.getByRole("button", { name: /bloque 2/i }))

    expect(scrollIntoViewMock).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    })
    expect(screen.getAllByText("Bloque 2").length).toBeGreaterThan(0)
    expect(screen.getByLabelText("Remo con barra serie 1")).toBeInTheDocument()
    expect(screen.getByLabelText("Remo con barra serie 1")).toHaveValue("50")
  })
})
