import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(notifications)
  } catch (error) {
    console.error("[NOTIFICATIONS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    await prisma.notification.updateMany({
      where: { userId: session.user.id, read: false },
      data: { read: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[NOTIFICATIONS_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

