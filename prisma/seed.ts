import "dotenv/config"

import { PrismaClient } from "@prisma/client"

import { workoutProgressSeedScenarios } from "../src/lib/workouts/progress-seed-data.js"
import { workoutSeedData } from "../src/lib/workouts/seed-data.js"

const prisma = new PrismaClient()

function buildMovementSlug(name: string, logType: string) {
  return `${name.trim().toLowerCase().replace(/\s+/g, "-")}-${logType}`
}

function buildPerformedAt(daysAgo: number) {
  const performedAt = new Date()
  performedAt.setHours(9, 0, 0, 0)
  performedAt.setDate(performedAt.getDate() - daysAgo)

  return performedAt
}

async function seedProgressScenarios() {
  const exercises = await prisma.exercise.findMany({
    select: {
      id: true,
      name: true,
      logType: true,
      group: {
        select: {
          series: true,
          section: {
            select: {
              routine: {
                select: {
                  id: true,
                },
              },
            },
          },
        },
      },
    },
  })

  const exercisesByName = new Map(
    exercises.map((exercise) => [exercise.name, exercise])
  )

  for (const scenario of workoutProgressSeedScenarios) {
    const exercise = exercisesByName.get(scenario.exerciseName)

    if (!exercise) {
      throw new Error(
        `Missing seeded exercise "${scenario.exerciseName}" for scenario ${scenario.caseId}.`
      )
    }

    if (exercise.logType === "none") {
      throw new Error(`Exercise "${scenario.exerciseName}" is not loggable.`)
    }

    for (const sessionTemplate of scenario.sessions) {
      if (sessionTemplate.values.length > exercise.group.series) {
        throw new Error(
          `Scenario ${scenario.caseId} exceeds the configured series count for "${scenario.exerciseName}".`
        )
      }

      await prisma.workoutSession.create({
        data: {
          routineId: exercise.group.section.routine.id,
          performedAt: buildPerformedAt(sessionTemplate.daysAgo),
          note: sessionTemplate.note,
          setLogs: {
            create: sessionTemplate.values.map((value, index) => ({
              exerciseId: exercise.id,
              setNumber: index + 1,
              ...(exercise.logType === "weight"
                ? {
                    weightKg: value.toFixed(2),
                  }
                : exercise.logType === "time"
                  ? {
                      durationSeconds: value,
                    }
                  : {
                      repsCount: value,
                    }),
            })),
          },
        },
      })
    }
  }
}

async function main() {
  await prisma.exerciseSetLog.deleteMany()
  await prisma.workoutSession.deleteMany()
  await prisma.exercise.deleteMany()
  await prisma.exerciseMovement.deleteMany()
  await prisma.exerciseGroup.deleteMany()
  await prisma.routineSection.deleteMany()
  await prisma.routine.deleteMany()

  for (const [routineIndex, routine] of workoutSeedData.entries()) {
    await prisma.routine.create({
      data: {
        name: routine.name,
        summary: routine.summary,
        sortOrder: routineIndex,
        sections: {
          create: routine.sections.map((section, sectionIndex) => ({
            name: section.name,
            sortOrder: sectionIndex,
            groups: {
              create: section.groups.map((group, groupIndex) => ({
                name: group.name,
                series: group.series,
                sortOrder: groupIndex,
                exercises: {
                  create: group.exercises.map((exercise, exerciseIndex) => ({
                    name: exercise.name,
                    targetType: exercise.targetType,
                    targetValue: exercise.targetValue,
                    note: exercise.note,
                    logType: exercise.logType,
                    sortOrder: exerciseIndex,
                    movement: {
                      connectOrCreate: {
                        where: {
                          slug: buildMovementSlug(
                            exercise.name,
                            exercise.logType
                          ),
                        },
                        create: {
                          name: exercise.name,
                          slug: buildMovementSlug(
                            exercise.name,
                            exercise.logType
                          ),
                          logType: exercise.logType,
                        },
                      },
                    },
                  })),
                },
              })),
            },
          })),
        },
      },
    })
  }

  await seedProgressScenarios()
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
