import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  const movements = await prisma.exerciseMovement.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  })

  console.log("Movimientos disponibles:")
  movements.forEach((m) => {
    console.log(`  ${m.name} (${m.slug})`)
  })

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
