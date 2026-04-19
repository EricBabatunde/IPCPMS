import { z } from "zod"

export const createProjectSchema = z.object({
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  status: z.enum(["PLANNING", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]).default("PLANNING"),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
  coverColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  courseCode: z.string().optional(),
  projectType: z.string().optional(),
})

export const updateProjectSchema = createProjectSchema.partial()

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>
