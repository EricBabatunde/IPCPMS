import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return new NextResponse("Unauthorized", { status: 401 })

    // Find all groups the user is a member of
    const groups = await prisma.group.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id,
          },
        },
      },
      include: {
        project: {
          select: { id: true, name: true, coverColor: true },
        },
        members: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1, // latest message
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error("[GROUPS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
