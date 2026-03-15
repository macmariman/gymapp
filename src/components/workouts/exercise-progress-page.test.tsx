import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ExerciseProgressPageData } from "@/lib/workouts/types"
import { ExerciseProgressPage } from "@/components/workouts/exercise-progress-page"

const insufficientProgressPageData: ExerciseProgressPageData = {
  movement: {
    id: "movement-1",
    slug: "press-banca-weight",
    name: "Press banca",
    logType: "weight",
    detail: "Seguimiento por carga",
  },
  availableMetrics: [
    {
      key: "maxLoad",
      label: "Carga máxima",
      shortLabel: "Carga",
      unit: "kg",
    },
    {
      key: "totalVolume",
      label: "Volumen",
      shortLabel: "Volumen",
      unit: "kg·rep",
    },
  ],
  sessions: [
    {
      id: "session-1",
      routineId: "routine-1",
      routineName: "Rutina 1",
      performedAt: "2025-10-10T10:00:00.000Z",
      note: null,
      setSummary: "55 · 55 kg",
      sets: [],
      metrics: {
        maxLoad: 55,
        totalVolume: 1100,
      },
    },
    {
      id: "session-2",
      routineId: "routine-2",
      routineName: "Rutina 2",
      performedAt: "2026-03-10T10:00:00.000Z",
      note: "Muy bien",
      setSummary: "60 · 60 kg",
      sets: [],
      metrics: {
        maxLoad: 60,
        totalVolume: 1200,
      },
    },
  ],
}

const progressPageData: ExerciseProgressPageData = {
  ...insufficientProgressPageData,
  sessions: [
    ...insufficientProgressPageData.sessions,
    {
      id: "session-3",
      routineId: "routine-1",
      routineName: "Rutina 1",
      performedAt: "2026-03-12T10:00:00.000Z",
      note: null,
      setSummary: "62,5 · 62,5 kg",
      sets: [],
      metrics: {
        maxLoad: 62.5,
        totalVolume: 1250,
      },
    },
    {
      id: "session-4",
      routineId: "routine-2",
      routineName: "Rutina 2",
      performedAt: "2026-03-16T10:00:00.000Z",
      note: null,
      setSummary: "65 · 65 kg",
      sets: [],
      metrics: {
        maxLoad: 65,
        totalVolume: 1300,
      },
    },
    {
      id: "session-5",
      routineId: "routine-1",
      routineName: "Rutina 1",
      performedAt: "2026-03-20T10:00:00.000Z",
      note: null,
      setSummary: "67,5 · 67,5 kg",
      sets: [],
      metrics: {
        maxLoad: 67.5,
        totalVolume: 1350,
      },
    },
    {
      id: "session-6",
      routineId: "routine-2",
      routineName: "Rutina 2",
      performedAt: "2026-03-24T10:00:00.000Z",
      note: "Muy bien",
      setSummary: "70 · 70 kg",
      sets: [],
      metrics: {
        maxLoad: 70,
        totalVolume: 1400,
      },
    },
  ],
}

describe("ExerciseProgressPage", () => {
  it("shows an empty state when the exercise has no sessions yet", () => {
    render(
      <ExerciseProgressPage
        {...insufficientProgressPageData}
        backHref="/?routineId=routine-1"
        sessions={[]}
      />
    )

    expect(
      screen.getByText("Aún no hay suficientes datos para este ejercicio.")
    ).toBeInTheDocument()
    expect(screen.queryByText("Gráfico histórico")).not.toBeInTheDocument()
    expect(screen.queryByText("Resumen")).not.toBeInTheDocument()
    expect(screen.queryByText("Historial")).not.toBeInTheDocument()
  })

  it("shows the page without trend when the exercise still has little history", () => {
    render(
      <ExerciseProgressPage
        {...insufficientProgressPageData}
        backHref="/?routineId=routine-1"
      />
    )

    expect(screen.getByText("Gráfico histórico")).toBeInTheDocument()
    expect(screen.getByText("Resumen")).toBeInTheDocument()
    expect(screen.getByText("Historial")).toBeInTheDocument()
    expect(
      screen.getByText("Faltan 4 sesiones para ver la tendencia.")
    ).toBeInTheDocument()
  })

  it("renders the progress screen and changes the selected metric", async () => {
    const user = userEvent.setup()

    render(
      <ExerciseProgressPage
        {...progressPageData}
        backHref="/?routineId=routine-1"
      />
    )

    expect(screen.getByText("Press banca")).toBeInTheDocument()
    expect(screen.getByText("Récord")).toBeInTheDocument()
    expect(screen.getAllByText("70 kg").length).toBeGreaterThan(0)
    expect(screen.getByText("Tendencia")).toBeInTheDocument()
    expect(screen.getByText("Subiendo")).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Volumen" }))

    expect(
      screen.getByText(
        "El volumen se estima con las repeticiones objetivo configuradas en el ejercicio."
      )
    ).toBeInTheDocument()
    expect(screen.getAllByText("1.200 kg·rep").length).toBeGreaterThan(0)
  })

  it("filters the history by range", async () => {
    const user = userEvent.setup()

    render(
      <ExerciseProgressPage
        {...progressPageData}
        backHref="/?routineId=routine-1"
      />
    )

    await user.click(screen.getByRole("button", { name: "3 m" }))

    expect(screen.getByText("5 sesiones visibles")).toBeInTheDocument()
    expect(screen.queryByText("10 de octubre de 2025")).not.toBeInTheDocument()
  })
})
