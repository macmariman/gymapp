import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const logId = process.argv[2]

  if (!logId) {
    console.log("Uso: node scripts/delete-running-log.js <log-id>")
    console.log("Primero ejecuta: node scripts/view-running-logs.js")
    process.exit(1)
  }

  const log = await prisma.exerciseSetLog.findUnique({
    where: { id: logId },
    include: {
      session: {
        select: {
          performedAt: true,
          routine: { select: { name: true } },
        },
      },
      exercise: {
        select: { name: true },
      },
    },
  })

  if (!log) {
    console.log(`No encontré el registro con ID: ${logId}`)
    process.exit(1)
  }

  const date = new Date(log.session.performedAt)
  const dateStr = date.toLocaleDateString("es-UY", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  console.log("\n=== Confirmación de eliminación ===\n")
  console.log(`Ejercicio: ${log.exercise.name}`)
  console.log(`Fecha: ${dateStr}`)
  console.log(`Rutina: ${log.session.routine.name}`)
  console.log(`Duración: ${log.durationSeconds}s`)
  console.log()

  const readline = await import("readline")
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  rl.question("¿Eliminás este registro? (s/n): ", async (answer) => {
    if (answer.toLowerCase() === "s") {
      await prisma.exerciseSetLog.delete({ where: { id: logId } })
      console.log("✓ Registro eliminado")
    } else {
      console.log("Cancelado")
    }
    rl.close()
    await prisma.$disconnect()
  })
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
