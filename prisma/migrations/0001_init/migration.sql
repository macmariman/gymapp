-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ExerciseMetricType" AS ENUM ('reps', 'weight', 'time');
CREATE TYPE "ExerciseLogType" AS ENUM ('none', 'reps', 'weight', 'time');

-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutineSection" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoutineSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseGroup" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Exercise" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetType" "ExerciseMetricType" NOT NULL,
    "targetValue" INTEGER NOT NULL,
    "note" TEXT,
    "logType" "ExerciseLogType" NOT NULL DEFAULT 'none',
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Exercise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkoutSession" (
    "id" TEXT NOT NULL,
    "routineId" TEXT NOT NULL,
    "performedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExerciseSetLog" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "setNumber" INTEGER NOT NULL,
    "weightKg" DECIMAL(5,2),
    "repsCount" INTEGER,
    "durationSeconds" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExerciseSetLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoutineSection_routineId_sortOrder_idx" ON "RoutineSection"("routineId", "sortOrder");

-- CreateIndex
CREATE INDEX "ExerciseGroup_sectionId_sortOrder_idx" ON "ExerciseGroup"("sectionId", "sortOrder");

-- CreateIndex
CREATE INDEX "Exercise_groupId_sortOrder_idx" ON "Exercise"("groupId", "sortOrder");

-- CreateIndex
CREATE INDEX "WorkoutSession_routineId_performedAt_idx" ON "WorkoutSession"("routineId", "performedAt");

-- CreateIndex
CREATE INDEX "WorkoutSession_performedAt_idx" ON "WorkoutSession"("performedAt");

-- CreateIndex
CREATE INDEX "ExerciseSetLog_exerciseId_createdAt_idx" ON "ExerciseSetLog"("exerciseId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseSetLog_sessionId_exerciseId_setNumber_key" ON "ExerciseSetLog"("sessionId", "exerciseId", "setNumber");

-- AddForeignKey
ALTER TABLE "RoutineSection" ADD CONSTRAINT "RoutineSection_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseGroup" ADD CONSTRAINT "ExerciseGroup_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "RoutineSection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Exercise" ADD CONSTRAINT "Exercise_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "ExerciseGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkoutSession" ADD CONSTRAINT "WorkoutSession_routineId_fkey" FOREIGN KEY ("routineId") REFERENCES "Routine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSetLog" ADD CONSTRAINT "ExerciseSetLog_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WorkoutSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExerciseSetLog" ADD CONSTRAINT "ExerciseSetLog_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "Exercise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
