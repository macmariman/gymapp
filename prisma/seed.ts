import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { workoutSeedData } from '../src/lib/workouts/seed-data.js';

const prisma = new PrismaClient();

async function main() {
  await prisma.exerciseSetLog.deleteMany();
  await prisma.workoutSession.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.exerciseGroup.deleteMany();
  await prisma.routineSection.deleteMany();
  await prisma.routine.deleteMany();

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
                    sortOrder: exerciseIndex
                  }))
                }
              }))
            }
          }))
        }
      }
    });
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
