export interface MessageData {
  id: string
  content: string
  conversationId: string
  senderId: string
  senderName: string
  senderImage: string | null
  createdAt: string
  fileUrl?: string
  fileType?: string
}

export interface ConversationData {
  id: string
  lastMessageAt: string
  lastMessage?: MessageData
  otherUser: {
    id: string
    name: string
    image: string | null
  }
  unreadCount: number
}

export interface GroupMessageData {
  id: string
  content: string
  senderId: string
  senderName: string
  senderImage: string | null
  groupId: string
  createdAt: string
  fileUrl?: string
  fileType?: string
}

export interface GroupData {
  id: string
  name: string
  description: string | null
  projectId: string | null
  memberCount: number
  lastMessage?: GroupMessageData
  createdAt: string
}

export interface TypingPayload {
  userId: string
  userName: string
}

export interface NotificationPayload {
  id: string
  title: string
  body: string
  type: string
  link?: string
}
