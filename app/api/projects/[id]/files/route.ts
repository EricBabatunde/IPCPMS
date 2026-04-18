import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const files = await prisma.projectFile.findMany({
      where: { projectId: params.id },
      orderBy: { uploadedAt: "desc" },
    })

    return NextResponse.json(files)
  } catch (error) {
    console.error("[PROJECT_FILES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    // Validate simple body { name, url, size, mimeType }
    if (!body.name || !body.url || !body.size || !body.mimeType) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const file = await prisma.projectFile.create({
      data: {
        name: body.name,
        url: body.url,
        size: body.size,
        mimeType: body.mimeType,
        projectId: params.id,
        uploaderId: session.user.id,
      },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: params.id,
        action: "uploaded_file",
        detail: `Uploaded file: ${file.name}`,
      },
    })

    const projectMembers = await prisma.projectMember.findMany({
      where: { projectId: params.id },
      include: { user: { select: { id: true, name: true } } }
    })

    for (const m of projectMembers) {
      if (m.userId === session.user.id) continue
      const notification = await prisma.notification.create({
        data: {
          title: "New File Uploaded",
          body: `${session.user.name || "A member"} uploaded a new file: ${file.name}`,
          type: "PROJECT",
          userId: m.userId,
          link: `/dashboard/projects/${params.id}`
        }
      })
      await pusherServer.trigger(`private-user-${m.userId}`, "new_notification", notification)
    }

    return NextResponse.json(file)
  } catch (error) {
    console.error("[PROJECT_FILES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
