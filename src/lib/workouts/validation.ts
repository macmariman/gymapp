import { z } from 'zod';
import type { CreateWorkoutSessionInput } from '@/lib/workouts/types';

const decimalPattern = /^\d+(\.\d{1,2})?$/;

const weightSchema = z
  .union([
    z.number().positive(),
    z.string().trim().min(1).regex(decimalPattern)
  ])
  .transform((value) => (typeof value === 'number' ? value.toFixed(2) : Number(value).toFixed(2)));

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
        setNumber: z.number().int().positive(),
        weightKg: weightSchema
      })
    )
    .min(1)
}).superRefine((value, ctx) => {
  const duplicates = new Set<string>();

  value.setLogs.forEach((setLog, index) => {
    const duplicateKey = `${setLog.exerciseId}:${setLog.setNumber}`;

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
