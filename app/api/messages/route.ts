import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    // Find all conversations the user is part of
    const conversations = await prisma.conversation.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // latest message
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    })

    return NextResponse.json(conversations)
  } catch (error) {
    console.error("[MESSAGES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    const { recipientId } = await req.json()
    if (!recipientId) return new NextResponse("Missing recipientId", { status: 400 })

    if (session.user.id === recipientId) {
      return new NextResponse("Cannot message yourself", { status: 400 })
    }

    // Check if conversation already exists
    const existingConversations = await prisma.conversation.findMany({
      where: {
        AND: [
          { members: { some: { userId: session.user.id } } },
          { members: { some: { userId: recipientId } } },
        ],
      },
    })

    if (existingConversations.length > 0) {
      return NextResponse.json(existingConversations[0])
    }

    // Create new conversation
    const newConversation = await prisma.conversation.create({
      data: {
        members: {
          create: [
            { userId: session.user.id },
            { userId: recipientId },
          ],
        },
      },
    })

    return NextResponse.json(newConversation)
  } catch (error) {
    console.error("[MESSAGES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
