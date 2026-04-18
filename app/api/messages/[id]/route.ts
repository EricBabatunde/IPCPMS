import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { NextResponse } from "next/server"

const MESSAGES_BATCH = 30

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const cursor = searchParams.get("cursor")

    const conversationId = params.id

    // Check membership
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!member) return new NextResponse("Unauthorized", { status: 401 })

    const messages = await prisma.message.findMany({
      take: MESSAGES_BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        conversationId,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    let nextCursor = null
    if (messages.length === MESSAGES_BATCH) {
      nextCursor = messages[MESSAGES_BATCH - 1].id
    }

    return NextResponse.json({
      items: messages,
      nextCursor,
    })
  } catch (error) {
    console.error("[MESSAGES_ID_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const conversationId = params.id
    const { content, fileUrl, fileType } = await req.json()

    if (!content && !fileUrl) {
      return new NextResponse("Content or file is required", { status: 400 })
    }

    // Verify membership
    const member = await prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId,
          userId: session.user.id,
        },
      },
    })

    if (!member) return new NextResponse("Unauthorized", { status: 401 })

    const message = await prisma.message.create({
      data: {
        content: content || "",
        fileUrl,
        fileType,
        conversationId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    await prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date() },
    })

    const channelName = `private-conversation-${conversationId}`
    const eventData = {
      id: message.id,
      content: message.content,
      senderId: message.senderId,
      senderName: message.sender.name,
      senderImage: message.sender.image,
      createdAt: message.createdAt,
      fileUrl: message.fileUrl,
      fileType: message.fileType,
    }

    await pusherServer.trigger(channelName, "new-message", eventData)

    // Trigger notification to the recipient
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { members: true },
    })

    const recipient = conversation?.members.find(m => m.userId !== session!.user!.id)
    
    if (recipient) {
      const notification = await prisma.notification.create({
        data: {
          title: `New message from ${message.sender.name}`,
          body: content ? (content.length > 50 ? content.substring(0, 50) + "..." : content) : "Sent an attachment",
          type: "SYSTEM",
          userId: recipient.userId,
        }
      })
      await pusherServer.trigger(`private-user-${recipient.userId}`, "new_notification", notification)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("[MESSAGES_ID_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
