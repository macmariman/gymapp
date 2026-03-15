import { prisma } from "@/lib/prisma"
import {
  getAttendanceMonth,
  getExerciseProgressPageData,
  getWorkoutSessionHistory,
} from "@/lib/workouts/queries"

jest.mock("@/lib/prisma", () => ({
  prisma: {
    workoutSession: {
      findMany: jest.fn(),
    },
    routine: {
      findMany: jest.fn(),
    },
    exerciseMovement: {
      findUnique: jest.fn(),
    },
    exerciseSetLog: {
      findMany: jest.fn(),
    },
  },
}))

describe("getAttendanceMonth", () => {
  it("returns unique session days for the current month", async () => {
    const mockedFindMany = jest.mocked(prisma.workoutSession.findMany)
    mockedFindMany.mockResolvedValue([
      { performedAt: new Date("2026-03-03T08:00:00.000Z") },
      { performedAt: new Date("2026-03-03T18:00:00.000Z") },
      { performedAt: new Date("2026-03-07T08:00:00.000Z") },
    ] as never)

    const result = await getAttendanceMonth(
      new Date("2026-03-12T10:00:00.000Z")
    )

    expect(result).toEqual({
      year: 2026,
      month: 3,
      daysWithSessions: [3, 7],
    })
  })
})

describe("getExerciseProgressPageData", () => {
  it("aggregates sessions across multiple exercises linked to the same movement", async () => {
    const mockedFindUnique = jest.mocked(prisma.exerciseMovement.findUnique)
    const mockedFindMany = jest.mocked(prisma.exerciseSetLog.findMany)

    mockedFindUnique.mockResolvedValue({
      id: "movement-1",
      slug: "press-banca-weight",
      name: "Press banca",
      logType: "weight",
    } as never)
    mockedFindMany.mockResolvedValue([
      {
        sessionId: "session-1",
        setNumber: 1,
        weightKg: { toString: () => "60" },
        repsCount: null,
        durationSeconds: null,
        session: {
          id: "session-1",
          performedAt: new Date("2026-03-01T10:00:00.000Z"),
          note: null,
          routine: {
            id: "routine-1",
            name: "Rutina 1",
          },
        },
        exercise: {
          targetValue: 10,
        },
      },
      {
        sessionId: "session-1",
        setNumber: 2,
        weightKg: { toString: () => "62.5" },
        repsCount: null,
        durationSeconds: null,
        session: {
          id: "session-1",
          performedAt: new Date("2026-03-01T10:00:00.000Z"),
          note: null,
          routine: {
            id: "routine-1",
            name: "Rutina 1",
          },
        },
        exercise: {
          targetValue: 10,
        },
      },
      {
        sessionId: "session-2",
        setNumber: 1,
        weightKg: { toString: () => "65" },
        repsCount: null,
        durationSeconds: null,
        session: {
          id: "session-2",
          performedAt: new Date("2026-03-10T10:00:00.000Z"),
          note: "Firme",
          routine: {
            id: "routine-2",
            name: "Rutina 2",
          },
        },
        exercise: {
          targetValue: 8,
        },
      },
    ] as never)

    const result = await getExerciseProgressPageData("movement-1")

    expect(result).toEqual({
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
          performedAt: "2026-03-01T10:00:00.000Z",
          note: null,
          setSummary: "60 · 62,5 kg",
          sets: [
            { setNumber: 1, value: 60, targetValue: 10 },
            { setNumber: 2, value: 62.5, targetValue: 10 },
          ],
          metrics: {
            maxLoad: 62.5,
            totalVolume: 1225,
          },
        },
        {
          id: "session-2",
          routineId: "routine-2",
          routineName: "Rutina 2",
          performedAt: "2026-03-10T10:00:00.000Z",
          note: "Firme",
          setSummary: "65 kg",
          sets: [{ setNumber: 1, value: 65, targetValue: 8 }],
          metrics: {
            maxLoad: 65,
            totalVolume: 520,
          },
        },
      ],
    })
  })
})

describe("getWorkoutSessionHistory", () => {
  it("keeps decimal weight values when aggregating exercise summaries", async () => {
    const mockedFindMany = jest.mocked(prisma.workoutSession.findMany)

    mockedFindMany.mockResolvedValue([
      {
        id: "session-1",
        performedAt: new Date("2026-03-09T10:00:00.000Z"),
        note: null,
        routine: {
          id: "routine-1",
          name: "Rutina 1",
        },
        setLogs: [
          {
            exerciseId: "exercise-1",
            weightKg: { toString: () => "46.5" },
            repsCount: null,
            durationSeconds: null,
            exercise: {
              id: "exercise-1",
              name: "Silla de cuádriceps",
              logType: "weight",
            },
          },
          {
            exerciseId: "exercise-1",
            weightKg: { toString: () => "48" },
            repsCount: null,
            durationSeconds: null,
            exercise: {
              id: "exercise-1",
              name: "Silla de cuádriceps",
              logType: "weight",
            },
          },
          {
            exerciseId: "exercise-1",
            weightKg: { toString: () => "48" },
            repsCount: null,
            durationSeconds: null,
            exercise: {
              id: "exercise-1",
              name: "Silla de cuádriceps",
              logType: "weight",
            },
          },
        ],
      },
    ] as never)

    const result = await getWorkoutSessionHistory()

    expect(result).toEqual([
      {
        id: "session-1",
        routineId: "routine-1",
        routineName: "Rutina 1",
        performedAt: "2026-03-09T10:00:00.000Z",
        note: null,
        exercises: [
          {
            exerciseId: "exercise-1",
            exerciseName: "Silla de cuádriceps",
            valueSummary: "46,5 · 48 · 48 kg",
          },
        ],
      },
    ])
  })
})
