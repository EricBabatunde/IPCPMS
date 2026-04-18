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

    const groupId = params.id

    // Check membership
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (!member) return new NextResponse("Unauthorized", { status: 401 })

    const messages = await prisma.groupMessage.findMany({
      take: MESSAGES_BATCH,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: {
        groupId,
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
    console.error("[GROUP_MESSAGES_GET]", error)
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

    const groupId = params.id
    const { content, fileUrl, fileType } = await req.json()

    if (!content && !fileUrl) {
      return new NextResponse("Content or file is required", { status: 400 })
    }

    // Verify membership
    const member = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    })

    if (!member) return new NextResponse("Unauthorized", { status: 401 })

    const message = await prisma.groupMessage.create({
      data: {
        content: content || "",
        fileUrl,
        fileType,
        groupId,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    const channelName = `private-group-${groupId}`
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

    await pusherServer.trigger(channelName, "new-group-message", eventData)

    // Trigger notifications for all peers
    const groupMembers = await prisma.groupMember.findMany({
      where: { groupId }
    })
    
    for (const m of groupMembers) {
      if (m.userId === session!.user!.id) continue
      
      const notification = await prisma.notification.create({
        data: {
          title: `New message in group`,
          body: `${message.sender.name}: ${content ? (content.length > 50 ? content.substring(0, 50) + "..." : content) : "Sent an attachment"}`,
          type: "SYSTEM",
          userId: m.userId,
        }
      })
      await pusherServer.trigger(`private-user-${m.userId}`, "new_notification", notification)
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("[GROUP_MESSAGES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
