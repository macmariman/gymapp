import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

import type { ProgressOverviewPageData } from "@/lib/workouts/types"
import { ProgressOverviewPage } from "@/components/workouts/progress-overview-page"

const progressOverviewPageData: ProgressOverviewPageData = {
  movements: [
    {
      id: "movement-press",
      slug: "press-banca",
      name: "Press banca",
      logType: "weight",
      durationFormat: "seconds",
      sessions: [
        {
          id: "session-1",
          routineId: "routine-1",
          routineName: "Rutina 1",
          performedAt: "2026-01-01T10:00:00.000Z",
          note: null,
          bestValue: 50,
          volumeValue: 1000,
        },
        {
          id: "session-2",
          routineId: "routine-1",
          routineName: "Rutina 1",
          performedAt: "2026-03-01T10:00:00.000Z",
          note: null,
          bestValue: 60,
          volumeValue: 1200,
        },
      ],
    },
    {
      id: "movement-row",
      slug: "remo",
      name: "Remo",
      logType: "reps",
      durationFormat: "seconds",
      sessions: [
        {
          id: "session-3",
          routineId: "routine-2",
          routineName: "Rutina 2",
          performedAt: "2026-02-01T10:00:00.000Z",
          note: null,
          bestValue: 12,
          volumeValue: 36,
        },
      ],
    },
  ],
}

describe("ProgressOverviewPage", () => {
  it("renders all movements by default", () => {
    render(<ProgressOverviewPage {...progressOverviewPageData} />)

    expect(screen.getByText("Variación de progreso")).toBeInTheDocument()
    expect(screen.getAllByText("Press banca").length).toBeGreaterThan(0)
    expect(screen.getAllByText("Remo").length).toBeGreaterThan(0)
    expect(screen.getAllByText("+20%").length).toBeGreaterThan(0)
    expect(screen.getByText("Sin comparación")).toBeInTheDocument()
  })

  it("changes the selected metric mode", async () => {
    const user = userEvent.setup()

    render(<ProgressOverviewPage {...progressOverviewPageData} />)

    await user.click(screen.getByRole("button", { name: "Volumen total" }))

    expect(
      screen.getByText(
        "En ejercicios con peso, el volumen se estima con las repeticiones objetivo configuradas."
      )
    ).toBeInTheDocument()
    expect(screen.getByText("1.200 kg·rep")).toBeInTheDocument()
  })

  it("filters movements by routine and selects the visible movements", async () => {
    const user = userEvent.setup()
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()

    render(<ProgressOverviewPage {...progressOverviewPageData} />)

    await user.click(screen.getByRole("button", { name: "Rutina 2" }))

    expect(screen.queryByText("Press banca")).not.toBeInTheDocument()
    expect(screen.getAllByText("Remo").length).toBeGreaterThan(0)
    expect(
      screen.getByRole("button", { name: /Remo 1 sesión visible/i })
    ).toBeInTheDocument()
    expect(consoleErrorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining("Encountered two children with the same key")
    )

    consoleErrorSpy.mockRestore()
  })

  it("uses exercise chips for visibility and legend rows for highlighting", async () => {
    const user = userEvent.setup()

    render(<ProgressOverviewPage {...progressOverviewPageData} />)

    await user.click(
      screen.getByRole("button", { name: /Press banca 2 sesiones visibles/i })
    )

    expect(
      screen.getByRole("button", { name: /Press banca 2 sesiones visibles/i })
    ).toHaveClass("bg-muted")

    await user.click(screen.getByRole("button", { name: "Ninguno" }))

    expect(
      screen.getByText("Seleccioná al menos un ejercicio para ver el progreso.")
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Todos" }))

    expect(
      screen.getByRole("button", { name: /Press banca 2 sesiones visibles/i })
    ).toBeInTheDocument()
  })

  it("shows the empty state when there are no movements", () => {
    render(<ProgressOverviewPage movements={[]} />)

    expect(
      screen.getByText("Todavía no hay ejercicios con registros.")
    ).toBeInTheDocument()
  })
})
