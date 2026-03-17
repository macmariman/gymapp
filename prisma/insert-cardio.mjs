import "dotenv/config"

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const cardioConfig = {
  sectionName: "Cardio",
  groupName: "Cardio",
  movement: {
    name: "Correr",
    slug: "correr-time",
    logType: "time",
    durationFormat: "mmss",
  },
  exercise: {
    name: "Correr",
    targetType: "time",
    targetValue: 900,
    logType: "time",
  },
}

async function ensureCardioForRoutine(routine) {
  const section =
    routine.sections.find((entry) => entry.name === cardioConfig.sectionName) ??
    (await prisma.routineSection.create({
      data: {
        routineId: routine.id,
        name: cardioConfig.sectionName,
        sortOrder: routine.sections.length,
      },
    }))

  const sectionWithGroups =
    section.groups === undefined
      ? await prisma.routineSection.findUniqueOrThrow({
          where: {
            id: section.id,
          },
          include: {
            groups: {
              orderBy: {
                sortOrder: "asc",
              },
              include: {
                exercises: true,
              },
            },
          },
        })
      : section

  const group =
    sectionWithGroups.groups.find(
      (entry) => entry.name === cardioConfig.groupName
    ) ??
    (await prisma.exerciseGroup.create({
      data: {
        sectionId: sectionWithGroups.id,
        name: cardioConfig.groupName,
        series: 1,
        sortOrder: sectionWithGroups.groups.length,
      },
    }))

  const groupWithExercises =
    group.exercises === undefined
      ? await prisma.exerciseGroup.findUniqueOrThrow({
          where: {
            id: group.id,
          },
          include: {
            exercises: {
              orderBy: {
                sortOrder: "asc",
              },
            },
          },
        })
      : group

  const existingExercise = groupWithExercises.exercises.find(
    (entry) => entry.name === cardioConfig.exercise.name
  )

  if (existingExercise) {
    return { routineName: routine.name, action: "skipped" }
  }

  const movement = await prisma.exerciseMovement.upsert({
    where: {
      slug: cardioConfig.movement.slug,
    },
    update: {},
    create: cardioConfig.movement,
  })

  await prisma.exercise.create({
    data: {
      groupId: groupWithExercises.id,
      movementId: movement.id,
      name: cardioConfig.exercise.name,
      targetType: cardioConfig.exercise.targetType,
      targetValue: cardioConfig.exercise.targetValue,
      logType: cardioConfig.exercise.logType,
      sortOrder: groupWithExercises.exercises.length,
    },
  })

  return { routineName: routine.name, action: "created" }
}

async function main() {
  const routines = await prisma.routine.findMany({
    orderBy: {
      sortOrder: "asc",
    },
    include: {
      sections: {
        orderBy: {
          sortOrder: "asc",
        },
        include: {
          groups: {
            orderBy: {
              sortOrder: "asc",
            },
            include: {
              exercises: {
                orderBy: {
                  sortOrder: "asc",
                },
              },
            },
          },
        },
      },
    },
  })

  const results = []

  for (const routine of routines) {
    results.push(await ensureCardioForRoutine(routine))
  }

  console.table(results)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
