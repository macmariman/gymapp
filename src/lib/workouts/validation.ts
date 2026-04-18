import { z } from "zod"

import type { CreateWorkoutSessionInput } from "@/lib/workouts/types"

const loggedValueSchema = z
  .union([z.number().nonnegative(), z.string().trim().min(1)])
  .transform((value) => String(value).trim())

export const createWorkoutSessionSchema = z
  .object({
    routineId: z.string().trim().min(1),
    note: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value && value.length > 0 ? value : undefined)),
    setLogs: z
      .array(
        z
          .object({
            exerciseId: z.string().trim().min(1),
            slotExerciseId: z.string().trim().min(1).optional(),
            groupId: z.string().trim().min(1).optional(),
            setNumber: z.number().int().positive(),
            value: loggedValueSchema,
          })
          .refine(
            (setLog) =>
              (setLog.slotExerciseId ? 1 : 0) + (setLog.groupId ? 1 : 0) ===
              1,
            {
              message: "Set entries must include exactly one target.",
              path: ["slotExerciseId"],
            }
          )
      )
      .min(1),
  })
  .superRefine((value, ctx) => {
    const duplicates = new Set<string>()

    value.setLogs.forEach((setLog, index) => {
      const duplicateKey = `${setLog.exerciseId}:${setLog.setNumber}`

      if (duplicates.has(duplicateKey)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["setLogs", index, "setNumber"],
          message: "Duplicate set entry.",
        })
      }

      duplicates.add(duplicateKey)
    })
  })

export function parseCreateWorkoutSessionInput(
  input: unknown
): CreateWorkoutSessionInput {
  return createWorkoutSessionSchema.parse(input)
}
