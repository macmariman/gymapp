import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const running = await prisma.exerciseMovement.findUnique({
    where: { slug: "correr" },
    include: {
      exercises: {
        include: {
          setLogs: {
            include: {
              session: {
                select: {
                  id: true,
                  performedAt: true,
                  routine: { select: { name: true } },
                },
              },
            },
            orderBy: { session: { performedAt: "desc" } },
          },
        },
      },
    },
  })

  if (!running) {
    console.log("No encontré el movimiento 'Correr'")
    return
  }

  if (running.exercises.length === 0) {
    console.log("No hay ejercicios de correr registrados")
    return
  }

  console.log("\n=== Registros de Correr ===\n")

  for (const exercise of running.exercises) {
    console.log(`Ejercicio: ${exercise.name}`)
    if (exercise.setLogs.length === 0) {
      console.log("  Sin registros\n")
      continue
    }

    for (const log of exercise.setLogs) {
      const date = new Date(log.session.performedAt)
      const dateStr = date.toLocaleDateString("es-UY", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
      console.log(
        `  [${log.id}] ${dateStr} - ${log.durationSeconds}s - ${log.session.routine.name}`
      )
    }
    console.log()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
