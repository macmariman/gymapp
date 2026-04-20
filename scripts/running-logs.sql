-- Ver todos los registros de correr
SELECT
  esl.id,
  esl."durationSeconds",
  ws."performedAt",
  r.name as routine,
  e.name as exercise
FROM "ExerciseSetLog" esl
JOIN "Exercise" e ON esl."exerciseId" = e.id
JOIN "ExerciseMovement" em ON e."movementId" = em.id
JOIN "WorkoutSession" ws ON esl."sessionId" = ws.id
JOIN "Routine" r ON ws."routineId" = r.id
WHERE em.slug = 'correr'
ORDER BY ws."performedAt" DESC;

-- Eliminar un registro específico por ID (reemplaza 'LOG_ID' con el id del registro)
-- DELETE FROM "ExerciseSetLog" WHERE id = 'LOG_ID';
