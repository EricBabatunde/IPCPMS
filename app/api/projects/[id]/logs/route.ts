import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { z } from "zod"

const createLogSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    // Verify the user is a member of this project
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: params.id, userId: session.user.id },
    })
    if (!membership && session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const logs = await prisma.progressLog.findMany({
      where: { projectId: params.id },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, image: true } },
      },
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("[PROGRESS_LOGS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    // Verify membership
    const membership = await prisma.projectMember.findFirst({
      where: { projectId: params.id, userId: session.user.id },
    })
    if (!membership) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const parsed = createLogSchema.safeParse(body)
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const { content, type } = parsed.data

    // Create the log + award +1 point atomically
    const [log] = await prisma.$transaction([
      prisma.progressLog.create({
        data: {
          content,
          type,
          userId: session.user.id,
          projectId: params.id,
        },
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.projectMember.update({
        where: {
          projectId_userId: {
            projectId: params.id,
            userId: session.user.id,
          },
        },
        data: { points: { increment: 1 } },
      }),
    ])

    // Activity log
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: params.id,
        action: "submitted_log",
        detail: `Submitted a ${type.toLowerCase()} progress log`,
      },
    })

    // If NEGATIVE — alert all project ADMINs
    if (type === "NEGATIVE") {
      const project = await prisma.project.findUnique({
        where: { id: params.id },
        select: { name: true, courseCode: true },
      })

      const admins = await prisma.projectMember.findMany({
        where: { projectId: params.id, role: "ADMIN" },
        select: { userId: true },
      })

      const coursePrefix =
        project?.courseCode && project.courseCode !== "none"
          ? `[${project.courseCode}] `
          : ""

      const preview =
        content.length > 100 ? content.slice(0, 97) + "…" : content

      for (const admin of admins) {
        if (admin.userId === session.user.id) continue
        const notification = await prisma.notification.create({
          data: {
            userId: admin.userId,
            title: `⚠️ Setback Reported — ${coursePrefix}${project?.name ?? "Project"}`,
            body: `${session.user.name || "A member"} reported a setback: "${preview}"`,
            type: "SYSTEM",
            link: `/dashboard/projects/${params.id}?tab=logs`,
          },
        })
        await pusherServer.trigger(
          `private-user-${admin.userId}`,
          "new_notification",
          notification
        )
      }
    }

    return NextResponse.json(log, { status: 201 })
  } catch (error) {
    console.error("[PROGRESS_LOGS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
