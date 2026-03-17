import { workoutSeedData } from "@/lib/workouts/seed-data"

describe("workoutSeedData", () => {
  it("adds the Cardio section with Correr to each routine", () => {
    expect(workoutSeedData).toHaveLength(3)

    workoutSeedData.forEach((routine) => {
      const cardioSection = routine.sections.find(
        (section) => section.name === "Cardio"
      )

      expect(cardioSection).toBeDefined()
      expect(cardioSection?.groups).toEqual([
        {
          name: "Cardio",
          series: 1,
          exercises: [
            {
              name: "Correr",
              targetType: "time",
              targetValue: 900,
              logType: "time",
              durationFormat: "mmss",
            },
          ],
        },
      ])
    })
  })
})
