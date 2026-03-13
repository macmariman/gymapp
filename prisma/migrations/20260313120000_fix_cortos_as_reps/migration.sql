WITH cortos_exercise AS (
  SELECT exercise."id"
  FROM "Exercise" AS exercise
  INNER JOIN "ExerciseGroup" AS exercise_group ON exercise_group."id" = exercise."groupId"
  INNER JOIN "RoutineSection" AS routine_section ON routine_section."id" = exercise_group."sectionId"
  INNER JOIN "Routine" AS routine ON routine."id" = routine_section."routineId"
  WHERE routine."name" = 'Rutina 2'
    AND routine_section."name" = 'Zona media'
    AND exercise_group."name" = 'Zona media'
    AND exercise."name" = 'Cortos'
)
UPDATE "Exercise"
SET
  "targetType" = 'reps',
  "targetValue" = 15,
  "logType" = 'reps',
  "updatedAt" = NOW()
WHERE "id" IN (SELECT "id" FROM cortos_exercise);

WITH cortos_exercise AS (
  SELECT exercise."id"
  FROM "Exercise" AS exercise
  INNER JOIN "ExerciseGroup" AS exercise_group ON exercise_group."id" = exercise."groupId"
  INNER JOIN "RoutineSection" AS routine_section ON routine_section."id" = exercise_group."sectionId"
  INNER JOIN "Routine" AS routine ON routine."id" = routine_section."routineId"
  WHERE routine."name" = 'Rutina 2'
    AND routine_section."name" = 'Zona media'
    AND exercise_group."name" = 'Zona media'
    AND exercise."name" = 'Cortos'
)
UPDATE "ExerciseSetLog"
SET
  "repsCount" = 15,
  "durationSeconds" = NULL
WHERE "exerciseId" IN (SELECT "id" FROM cortos_exercise)
  AND "durationSeconds" IS NOT NULL;
