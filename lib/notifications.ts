import { prisma } from "./prisma"
import { pusherServer } from "./pusher"

export async function createNotification({
  userId,
  title,
  body,
  type,
  link,
}: {
  userId: string
  title: string
  body: string
  type: "SYSTEM" | "PROJECT" | "TASK" | "MESSAGE"
  link?: string
}) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        body,
        type,
        link,
      },
    })

    // Real-time notification via Pusher
    // Channel: private-user-{userId}
    await pusherServer.trigger(`private-user-${userId}`, "new-notification", {
      id: notification.id,
      title: notification.title,
      message: notification.body,
      type: notification.type,
      link: notification.link,
      read: notification.read,
      createdAt: notification.createdAt,
    })

    return notification
  } catch (error) {
    console.error("[CREATE_NOTIFICATION_ERROR]", error)
  }
}
