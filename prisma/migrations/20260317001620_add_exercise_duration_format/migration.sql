-- CreateEnum
CREATE TYPE "ExerciseDurationFormat" AS ENUM ('seconds', 'mmss');

-- AlterTable
ALTER TABLE "ExerciseMovement" ADD COLUMN     "durationFormat" "ExerciseDurationFormat" NOT NULL DEFAULT 'seconds';
