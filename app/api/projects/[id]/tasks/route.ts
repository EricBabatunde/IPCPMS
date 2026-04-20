import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createTaskSchema } from "@/lib/validations/task"
import { pusherServer } from "@/lib/pusher"

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const tasks = await prisma.task.findMany({
      where: { projectId: params.id },
      include: {
        assignees: { select: { id: true, name: true, image: true } },
        tags: true,
        _count: { select: { comments: true } }
      },
      orderBy: { position: "asc" }
    })

    return NextResponse.json(tasks)
  } catch (error) {
    console.error("[PROJECT_TASKS_GET]", error)
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
    // Override the projectId from params to be safe
    const parsed = createTaskSchema.safeParse({ ...body, projectId: params.id })
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    // Get highest position for the requested status
    const lastTask = await prisma.task.findFirst({
      where: { projectId: params.id, status: parsed.data.status },
      orderBy: { position: "desc" },
    })
    
    const newPosition = lastTask ? lastTask.position + 1024 : 1024

    const { assigneeIds, ...taskData } = parsed.data;

    const task = await prisma.task.create({
      data: {
        ...taskData,
        position: newPosition,
        creatorId: session.user.id,
        assignees: {
          connect: assigneeIds?.map((id: string) => ({ id })) || []
        }
      },
      include: {
        assignees: { select: { id: true, name: true, image: true } },
        tags: true,
        _count: { select: { comments: true } }
      }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: params.id,
        action: "created_task",
        detail: `Created task: ${task.title}`,
      },
    })

    if (assigneeIds && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        if (assigneeId !== session.user.id) {
          const notification = await prisma.notification.create({
             data: {
               title: "New Task Assigned",
               body: `You were assigned to: ${task.title}`,
               type: "TASK",
               userId: assigneeId,
               link: `/dashboard/projects/${params.id}?task=${task.id}`
             }
          })
          await pusherServer.trigger(`private-user-${assigneeId}`, "new_notification", notification)
        }
      }
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("[PROJECT_TASKS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
