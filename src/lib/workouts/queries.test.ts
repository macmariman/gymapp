import { prisma } from "@/lib/prisma"
import {
  getAttendanceMonth,
  getExerciseProgressPageData,
  getRoutineDetails,
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

describe("getRoutineDetails", () => {
  it("reuses the latest movement values across exercises that share a movement", async () => {
    const mockedFindMany = jest.mocked(prisma.routine.findMany)
    const mockedSetLogFindMany = jest.mocked(prisma.exerciseSetLog.findMany)

    mockedFindMany.mockResolvedValue([
      {
        id: "routine-1",
        name: "Rutina 1",
        summary: "Cardio",
        sessions: [],
        sections: [
          {
            id: "section-1",
            name: "Cardio",
            groups: [
              {
                id: "group-1",
                name: "Cardio",
                sortOrder: 0,
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
                    movement: {
                      durationFormat: "mmss",
                    },
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
        summary: "Cardio",
        sessions: [],
        sections: [
          {
            id: "section-2",
            name: "Cardio",
            groups: [
              {
                id: "group-2",
                name: "Cardio",
                sortOrder: 0,
                series: 1,
                exercises: [
                  {
                    id: "exercise-run-2",
                    movementId: "movement-run",
                    name: "Correr",
                    targetType: "time",
                    targetValue: 900,
                    note: null,
                    logType: "time",
                    movement: {
                      durationFormat: "mmss",
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ] as never)

    mockedSetLogFindMany.mockResolvedValue([
      {
        exerciseId: "exercise-run-1",
        sessionId: "session-2",
        weightKg: null,
        repsCount: null,
        durationSeconds: 1282,
      },
      {
        exerciseId: "exercise-run-2",
        sessionId: "session-1",
        weightKg: null,
        repsCount: null,
        durationSeconds: 900,
      },
    ] as never)

    const result = await getRoutineDetails()

    expect(
      result[0]?.sections[0]?.groups[0]?.exercises[0]?.lastLogValues
    ).toEqual(["21:22"])
    expect(
      result[1]?.sections[0]?.groups[0]?.exercises[0]?.lastLogValues
    ).toEqual(["21:22"])
    expect(
      result[0]?.sections[0]?.groups[0]?.exercises[0]?.lastLogSummary
    ).toBe("21:22")
    expect(
      result[1]?.sections[0]?.groups[0]?.exercises[0]?.lastLogSummary
    ).toBe("21:22")
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
      durationFormat: "seconds",
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
        durationFormat: "seconds",
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

  it("formats running progress in mm:ss for shared cardio movements", async () => {
    const mockedFindUnique = jest.mocked(prisma.exerciseMovement.findUnique)
    const mockedFindMany = jest.mocked(prisma.exerciseSetLog.findMany)

    mockedFindUnique.mockResolvedValue({
      id: "movement-run",
      slug: "correr-time",
      name: "Correr",
      logType: "time",
      durationFormat: "mmss",
    } as never)
    mockedFindMany.mockResolvedValue([
      {
        sessionId: "session-1",
        setNumber: 1,
        weightKg: null,
        repsCount: null,
        durationSeconds: 900,
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
          targetValue: 900,
        },
      },
      {
        sessionId: "session-2",
        setNumber: 1,
        weightKg: null,
        repsCount: null,
        durationSeconds: 1020,
        session: {
          id: "session-2",
          performedAt: new Date("2026-03-10T10:00:00.000Z"),
          note: "Cardio",
          routine: {
            id: "routine-2",
            name: "Rutina 2",
          },
        },
        exercise: {
          targetValue: 900,
        },
      },
    ] as never)

    const result = await getExerciseProgressPageData("movement-run")

    expect(result).toEqual({
      movement: {
        id: "movement-run",
        slug: "correr-time",
        name: "Correr",
        logType: "time",
        detail: "Seguimiento por tiempo",
        durationFormat: "mmss",
      },
      availableMetrics: [
        {
          key: "longestSetSeconds",
          label: "Mayor tiempo",
          shortLabel: "Mayor tiempo",
          unit: "mm:ss",
        },
        {
          key: "totalTimeSeconds",
          label: "Tiempo total",
          shortLabel: "Tiempo total",
          unit: "mm:ss",
        },
      ],
      sessions: [
        {
          id: "session-1",
          routineId: "routine-1",
          routineName: "Rutina 1",
          performedAt: "2026-03-01T10:00:00.000Z",
          note: null,
          setSummary: "15:00",
          sets: [{ setNumber: 1, value: 900, targetValue: 900 }],
          metrics: {
            longestSetSeconds: 900,
            totalTimeSeconds: 900,
          },
        },
        {
          id: "session-2",
          routineId: "routine-2",
          routineName: "Rutina 2",
          performedAt: "2026-03-10T10:00:00.000Z",
          note: "Cardio",
          setSummary: "17:00",
          sets: [{ setNumber: 1, value: 1020, targetValue: 900 }],
          metrics: {
            longestSetSeconds: 1020,
            totalTimeSeconds: 1020,
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
              movement: {
                durationFormat: "seconds",
              },
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
              movement: {
                durationFormat: "seconds",
              },
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
              movement: {
                durationFormat: "seconds",
              },
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

  it("formats running history summaries in mm:ss", async () => {
    const mockedFindMany = jest.mocked(prisma.workoutSession.findMany)

    mockedFindMany.mockResolvedValue([
      {
        id: "session-run",
        performedAt: new Date("2026-03-09T10:00:00.000Z"),
        note: "Cardio",
        routine: {
          id: "routine-1",
          name: "Rutina 1",
        },
        setLogs: [
          {
            exerciseId: "exercise-run",
            weightKg: null,
            repsCount: null,
            durationSeconds: 900,
            exercise: {
              id: "exercise-run",
              name: "Correr",
              logType: "time",
              movement: {
                durationFormat: "mmss",
              },
            },
          },
        ],
      },
    ] as never)

    const result = await getWorkoutSessionHistory()

    expect(result[0]?.exercises).toEqual([
      {
        exerciseId: "exercise-run",
        exerciseName: "Correr",
        valueSummary: "15:00",
      },
    ])
  })
})
