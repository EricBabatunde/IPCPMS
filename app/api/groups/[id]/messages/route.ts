import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { NextResponse } from "next/server"
import { createNotification } from "@/lib/notifications"

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

    // Notify all members except sender
    const otherMembers = await prisma.groupMember.findMany({
      where: {
        groupId,
        userId: { not: session.user.id },
      },
    })

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { name: true },
    })

    for (const other of otherMembers) {
      await createNotification({
        userId: other.userId,
        title: `Group: ${group?.name || "New Message"}`,
        body: `${session.user.name || "A user"}: ${message.content || "Sent an attachment"}`,
        type: "MESSAGE",
        link: `/dashboard/messages`,
      })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("[GROUP_MESSAGES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
