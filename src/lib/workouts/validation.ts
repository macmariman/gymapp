import { z } from 'zod';
import type { CreateWorkoutSessionInput } from '@/lib/workouts/types';

const numericPattern = /^\d+(\.\d{1,2})?$/;

const loggedValueSchema = z
  .union([z.number().positive(), z.string().trim().min(1).regex(numericPattern)])
  .transform((value) => String(value).trim());

export const createWorkoutSessionSchema = z.object({
  routineId: z.string().trim().min(1),
  note: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value && value.length > 0 ? value : undefined)),
  setLogs: z
  .array(
    z.object({
      exerciseId: z.string().trim().min(1),
      slotExerciseId: z.string().trim().min(1),
      setNumber: z.number().int().positive(),
      value: loggedValueSchema
    })
  )
    .min(1)
}).superRefine((value, ctx) => {
  const duplicates = new Set<string>();

  value.setLogs.forEach((setLog, index) => {
    const duplicateKey = `${setLog.slotExerciseId}:${setLog.setNumber}`;

    if (duplicates.has(duplicateKey)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['setLogs', index, 'setNumber'],
        message: 'Duplicate set entry.'
      });
    }

    duplicates.add(duplicateKey);
  });
});

export function parseCreateWorkoutSessionInput(input: unknown): CreateWorkoutSessionInput {
  return createWorkoutSessionSchema.parse(input);
}
