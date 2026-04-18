import { prisma } from "@/lib/prisma"
import { createWorkoutSession } from "@/lib/workouts/create-workout-session"

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}))

jest.mock("@/lib/prisma", () => ({
  prisma: {
    exercise: {
      findMany: jest.fn(),
    },
    routine: {
      findUnique: jest.fn(),
    },
    workoutSession: {
      create: jest.fn(),
    },
  },
}))

describe("createWorkoutSession", () => {
  const mockedExerciseFindMany = jest.mocked(prisma.exercise.findMany)
  const mockedFindUnique = jest.mocked(prisma.routine.findUnique)
  const mockedCreate = jest.mocked(prisma.workoutSession.create)

  beforeEach(() => {
    mockedFindUnique.mockResolvedValue({
      id: "routine-1",
      sections: [
        {
          groups: [
            {
              id: "group-1",
              series: 3,
              exercises: [
                {
                  id: "exercise-1",
                  logType: "weight",
                  movement: {
                    durationFormat: "seconds",
                  },
                },
                {
                  id: "exercise-2",
                  logType: "weight",
                  movement: {
                    durationFormat: "seconds",
                  },
                },
              ],
            },
            {
              id: "group-2",
              series: 4,
              exercises: [
                {
                  id: "exercise-3",
                  logType: "weight",
                  movement: {
                    durationFormat: "seconds",
                  },
                },
              ],
            },
            {
              id: "group-3",
              series: 1,
              exercises: [
                {
                  id: "exercise-4",
                  logType: "time",
                  movement: {
                    durationFormat: "mmss",
                  },
                },
                {
                  id: "exercise-5",
                  logType: "time",
                  movement: {
                    durationFormat: "seconds",
                  },
                },
              ],
            },
          ],
        },
      ],
    } as never)
    mockedExerciseFindMany.mockResolvedValue([] as never)
    mockedCreate.mockResolvedValue({ id: "session-1" } as never)
  })

  it("creates a valid session", async () => {
    const result = await createWorkoutSession({
      routineId: "routine-1",
      note: "Firme",
      setLogs: [
        {
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-1",
          setNumber: 1,
          value: "60",
        },
      ],
    })

    expect(result).toEqual({ id: "session-1" })
    expect(mockedCreate).toHaveBeenCalled()
  })

  it("creates a weight session with zero load", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-1",
            setNumber: 1,
            value: "0",
          },
        ],
      })
    ).resolves.toEqual({ id: "session-1" })

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setLogs: {
            create: [
              expect.objectContaining({
                exerciseId: "exercise-1",
                setNumber: 1,
                weightKg: "0.00",
              }),
            ],
          },
        }),
      })
    )
  })

  it("rejects negative weight values", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-1",
            setNumber: 1,
            value: "-1",
          },
        ],
      })
    ).rejects.toThrow("The submitted value is invalid.")
  })

  it("creates a running session from mm:ss input", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-4",
            slotExerciseId: "exercise-4",
            setNumber: 1,
            value: "15:00",
          },
        ],
      })
    ).resolves.toEqual({ id: "session-1" })

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setLogs: {
            create: [
              expect.objectContaining({
                exerciseId: "exercise-4",
                setNumber: 1,
                durationSeconds: 900,
              }),
            ],
          },
        }),
      })
    )
  })

  it("rejects malformed mm:ss values for running", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-4",
            slotExerciseId: "exercise-4",
            setNumber: 1,
            value: "15:75",
          },
        ],
      })
    ).rejects.toThrow("Time values must use the mm:ss format.")
  })

  it("keeps numeric seconds validation for existing time exercises", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-5",
            slotExerciseId: "exercise-5",
            setNumber: 1,
            value: "45",
          },
        ],
      })
    ).resolves.toEqual({ id: "session-1" })

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setLogs: {
            create: [
              expect.objectContaining({
                exerciseId: "exercise-5",
                setNumber: 1,
                durationSeconds: 45,
              }),
            ],
          },
        }),
      })
    )
  })

  it("rejects zero numeric time values", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-5",
            slotExerciseId: "exercise-5",
            setNumber: 1,
            value: "0",
          },
        ],
      })
    ).rejects.toThrow("The submitted value is invalid.")
  })

  it("rejects exercises outside the selected routine", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-999",
            slotExerciseId: "exercise-1",
            setNumber: 1,
            value: "60",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted exercise does not belong to the selected routine."
    )
  })

  it("creates a session with a day exercise outside the selected routine", async () => {
    mockedExerciseFindMany.mockResolvedValueOnce([
      {
        id: "exercise-999",
        logType: "weight",
        movement: {
          durationFormat: "seconds",
        },
      },
    ] as never)

    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-999",
            groupId: "group-1",
            setNumber: 1,
            value: "40",
          },
        ],
      })
    ).resolves.toEqual({ id: "session-1" })

    expect(mockedCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          setLogs: {
            create: [
              expect.objectContaining({
                exerciseId: "exercise-999",
                setNumber: 1,
                weightKg: "40.00",
              }),
            ],
          },
        }),
      })
    )
  })

  it("rejects day exercises with groups outside the selected routine", async () => {
    mockedExerciseFindMany.mockResolvedValueOnce([
      {
        id: "exercise-999",
        logType: "weight",
        movement: {
          durationFormat: "seconds",
        },
      },
    ] as never)

    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-999",
            groupId: "group-999",
            setNumber: 1,
            value: "40",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted exercise group does not belong to the selected routine."
    )
  })

  it("rejects day exercises that do not exist or cannot be logged", async () => {
    mockedExerciseFindMany.mockResolvedValueOnce([
      {
        id: "exercise-999",
        logType: "none",
        movement: {
          durationFormat: "seconds",
        },
      },
    ] as never)

    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-999",
            groupId: "group-1",
            setNumber: 1,
            value: "40",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted exercise does not exist or cannot be logged."
    )
  })

  it("rejects day exercise set numbers above the selected group series", async () => {
    mockedExerciseFindMany.mockResolvedValueOnce([
      {
        id: "exercise-999",
        logType: "weight",
        movement: {
          durationFormat: "seconds",
        },
      },
    ] as never)

    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-999",
            groupId: "group-1",
            setNumber: 4,
            value: "40",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted set number exceeds the configured number of series."
    )
  })

  it("rejects slots outside the selected routine", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-999",
            setNumber: 1,
            value: "60",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted exercise slot does not belong to the selected routine."
    )
  })

  it("uses the destination slot series when validating swapped exercises", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-3",
            setNumber: 4,
            value: "60",
          },
        ],
      })
    ).resolves.toEqual({ id: "session-1" })
  })

  it("rejects set numbers above the destination slot series", async () => {
    await expect(
      createWorkoutSession({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-3",
            slotExerciseId: "exercise-1",
            setNumber: 4,
            value: "60",
          },
        ],
      })
    ).rejects.toThrow(
      "The submitted set number exceeds the configured number of series."
    )
  })
})
