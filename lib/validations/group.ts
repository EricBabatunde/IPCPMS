import { z } from "zod"

export const createGroupSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
  memberIds: z.array(z.string().cuid()).min(1, "At least one member is required"),
})

export const addGroupMemberSchema = z.object({
  userId: z.string().cuid(),
})

export const sendGroupMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileType: z.string().optional(),
})

export type CreateGroupInput = z.infer<typeof createGroupSchema>
export type AddGroupMemberInput = z.infer<typeof addGroupMemberSchema>
export type SendGroupMessageInput = z.infer<typeof sendGroupMessageSchema>
