import { parseCreateWorkoutSessionInput } from "@/lib/workouts/validation"

describe("parseCreateWorkoutSessionInput", () => {
  it("normalizes valid logged values and trims the note", () => {
    const result = parseCreateWorkoutSessionInput({
      routineId: "routine-1",
      note: "  Buen entrenamiento  ",
      setLogs: [
        {
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-1",
          setNumber: 1,
          value: "62.5",
        },
      ],
    })

    expect(result).toEqual({
      routineId: "routine-1",
      note: "Buen entrenamiento",
      setLogs: [
        {
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-1",
          setNumber: 1,
          value: "62.5",
        },
      ],
    })
  })

  it("accepts mm:ss values for downstream exercise validation", () => {
    const result = parseCreateWorkoutSessionInput({
      routineId: "routine-1",
      setLogs: [
        {
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-1",
          setNumber: 1,
          value: "15:00",
        },
      ],
    })

    expect(result.setLogs[0]?.value).toBe("15:00")
  })

  it("accepts zero values for downstream exercise-specific validation", () => {
    const result = parseCreateWorkoutSessionInput({
      routineId: "routine-1",
      setLogs: [
        {
          exerciseId: "exercise-1",
          slotExerciseId: "exercise-1",
          setNumber: 1,
          value: 0,
        },
      ],
    })

    expect(result.setLogs[0]?.value).toBe("0")
  })

  it("accepts group targets for day exercises", () => {
    const result = parseCreateWorkoutSessionInput({
      routineId: "routine-1",
      setLogs: [
        {
          exerciseId: "exercise-1",
          groupId: "group-1",
          setNumber: 1,
          value: "60",
        },
      ],
    })

    expect(result.setLogs[0]).toEqual({
      exerciseId: "exercise-1",
      groupId: "group-1",
      setNumber: 1,
      value: "60",
    })
  })

  it("rejects duplicate exercise/set pairs", () => {
    expect(() =>
      parseCreateWorkoutSessionInput({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-1",
            setNumber: 1,
            value: "60",
          },
          {
            exerciseId: "exercise-1",
            groupId: "group-1",
            setNumber: 1,
            value: "62.5",
          },
        ],
      })
    ).toThrow("Duplicate set entry.")
  })

  it("rejects set entries without exactly one target", () => {
    expect(() =>
      parseCreateWorkoutSessionInput({
        routineId: "routine-1",
        setLogs: [
          {
            exerciseId: "exercise-1",
            slotExerciseId: "exercise-1",
            groupId: "group-1",
            setNumber: 1,
            value: "60",
          },
        ],
      })
    ).toThrow("Set entries must include exactly one target.")
  })

  it("rejects sessions without sets", () => {
    expect(() =>
      parseCreateWorkoutSessionInput({
        routineId: "routine-1",
        note: "Solo una nota",
        setLogs: [],
      })
    ).toThrow()
  })
})
