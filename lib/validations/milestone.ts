import { z } from "zod"

export const createMilestoneSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(1000).optional(),
  status: z.enum(["UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"]).default("UPCOMING"),
  dueDate: z.string().datetime(),
  projectId: z.string().cuid(),
})

export const updateMilestoneSchema = createMilestoneSchema.partial()

export type CreateMilestoneInput = z.infer<typeof createMilestoneSchema>
export type UpdateMilestoneInput = z.infer<typeof updateMilestoneSchema>
