CREATE TABLE "ExerciseMovement" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logType" "ExerciseLogType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExerciseMovement_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ExerciseMovement_slug_key" ON "ExerciseMovement"("slug");

ALTER TABLE "Exercise" ADD COLUMN "movementId" TEXT;

INSERT INTO "ExerciseMovement" ("id", "name", "slug", "logType", "createdAt", "updatedAt")
SELECT DISTINCT
    CONCAT('movement_', md5(lower(trim(exercise."name")) || ':' || exercise."logType"::text)) AS "id",
    exercise."name",
    CONCAT(
        regexp_replace(lower(trim(exercise."name")), '\s+', '-', 'g'),
        '-',
        exercise."logType"::text
    ) AS "slug",
    exercise."logType",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "Exercise" AS exercise;

UPDATE "Exercise"
SET "movementId" = CONCAT('movement_', md5(lower(trim("name")) || ':' || "logType"::text));

ALTER TABLE "Exercise" ALTER COLUMN "movementId" SET NOT NULL;

CREATE INDEX "Exercise_movementId_sortOrder_idx" ON "Exercise"("movementId", "sortOrder");

ALTER TABLE "Exercise"
ADD CONSTRAINT "Exercise_movementId_fkey"
FOREIGN KEY ("movementId") REFERENCES "ExerciseMovement"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
