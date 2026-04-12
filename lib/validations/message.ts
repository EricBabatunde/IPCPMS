import { z } from "zod"

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  fileUrl: z.string().url().optional(),
  fileType: z.string().optional(),
})

export const startConversationSchema = z.object({
  recipientId: z.string().cuid(),
})

export type SendMessageInput = z.infer<typeof sendMessageSchema>
export type StartConversationInput = z.infer<typeof startConversationSchema>
