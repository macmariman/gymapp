import {
  buildNormalizedProgressSeries,
  filterSessionsByRange,
  formatImprovementDate,
  formatProgressChangePercent,
  formatProgressMetricValue,
  formatProgressOverviewMetricValue,
  getAvailableProgressMetrics,
  getDefaultProgressMetric,
  getLastImprovementSession,
  getLastMetricValue,
  getProgressChangePercent,
  getProgressOverviewMetricValue,
  getRecordValue,
  getSessionsSinceImprovement,
  getTrendLabel,
} from "@/lib/workouts/progress"
import type {
  ExerciseProgressSession,
  ProgressOverviewMovement,
} from "@/lib/workouts/types"

const sessions: ExerciseProgressSession[] = [
  {
    id: "session-1",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-01-01T10:00:00.000Z",
    note: null,
    setSummary: "50 · 50 kg",
    sets: [],
    metrics: {
      maxLoad: 50,
    },
  },
  {
    id: "session-2",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-01-08T10:00:00.000Z",
    note: null,
    setSummary: "52,5 · 52,5 kg",
    sets: [],
    metrics: {
      maxLoad: 52.5,
    },
  },
  {
    id: "session-3",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-01-15T10:00:00.000Z",
    note: null,
    setSummary: "55 kg",
    sets: [],
    metrics: {
      maxLoad: 55,
    },
  },
  {
    id: "session-4",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-01-22T10:00:00.000Z",
    note: null,
    setSummary: "57,5 kg",
    sets: [],
    metrics: {
      maxLoad: 57.5,
    },
  },
  {
    id: "session-5",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-02-01T10:00:00.000Z",
    note: null,
    setSummary: "60 kg",
    sets: [],
    metrics: {
      maxLoad: 60,
    },
  },
  {
    id: "session-6",
    routineId: "routine-1",
    routineName: "Rutina 1",
    performedAt: "2026-02-12T10:00:00.000Z",
    note: null,
    setSummary: "62,5 kg",
    sets: [],
    metrics: {
      maxLoad: 62.5,
    },
  },
]

const overviewMovement: ProgressOverviewMovement = {
  id: "movement-1",
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
      performedAt: "2026-01-08T10:00:00.000Z",
      note: null,
      bestValue: 55,
      volumeValue: 1100,
    },
  ],
}

describe("progress helpers", () => {
  it("returns metric options and defaults by log type", () => {
    expect(getAvailableProgressMetrics("weight")).toHaveLength(2)
    expect(getDefaultProgressMetric("time")).toBe("longestSetSeconds")
    expect(getAvailableProgressMetrics("time", "mmss")[0]?.unit).toBe("mm:ss")
  })

  it("calculates record, last improvement and sessions since the last improvement", () => {
    expect(getRecordValue(sessions, "maxLoad")).toBe(62.5)
    expect(getLastImprovementSession(sessions, "maxLoad")?.id).toBe("session-6")
    expect(getSessionsSinceImprovement(sessions, "maxLoad")).toBe(0)
    expect(getLastMetricValue(sessions, "maxLoad")).toBe(62.5)
  })

  it("computes a trend from the last six sessions", () => {
    expect(getTrendLabel(sessions, "maxLoad")).toBe("Subiendo")
  })

  it("filters sessions by range from the provided date", () => {
    const result = filterSessionsByRange(
      sessions,
      "3m",
      new Date("2026-03-14T10:00:00.000Z")
    )

    expect(result).toHaveLength(6)
  })

  it("formats improvement dates relative to today", () => {
    expect(
      formatImprovementDate(
        "2026-03-10T10:00:00.000Z",
        new Date("2026-03-14T10:00:00.000Z")
      )
    ).toBe("Hace 4 días")
  })

  it("formats time metrics according to the configured duration format", () => {
    expect(formatProgressMetricValue("longestSetSeconds", 900, "mmss")).toBe(
      "15:00"
    )
  })

  it("returns overview metric values by selected mode", () => {
    expect(
      getProgressOverviewMetricValue(overviewMovement.sessions[0], "best")
    ).toBe(50)
    expect(
      getProgressOverviewMetricValue(overviewMovement.sessions[0], "volume")
    ).toBe(1000)
  })

  it("normalizes overview series against the first visible value", () => {
    const result = buildNormalizedProgressSeries(overviewMovement, "best")

    expect(result[0]?.normalizedValue).toBe(100)
    expect(result[1]?.normalizedValue).toBeCloseTo(110)
  })

  it("calculates and formats overview percentage changes", () => {
    expect(getProgressChangePercent([50, 55])).toBe(10)
    expect(getProgressChangePercent([50])).toBeNull()
    expect(getProgressChangePercent([0, 10])).toBeNull()
    expect(formatProgressChangePercent(10)).toBe("+10%")
    expect(formatProgressChangePercent(null)).toBe("Sin comparación")
  })

  it("formats overview values by metric mode and movement type", () => {
    expect(
      formatProgressOverviewMetricValue(overviewMovement, "best", 55)
    ).toBe("55 kg")
    expect(
      formatProgressOverviewMetricValue(overviewMovement, "volume", 1100)
    ).toBe("1.100 kg·rep")
    expect(
      formatProgressOverviewMetricValue(
        {
          logType: "time",
          durationFormat: "mmss",
        },
        "volume",
        900
      )
    ).toBe("15:00")
  })
})
