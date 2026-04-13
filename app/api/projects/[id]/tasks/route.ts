import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createTaskSchema } from "@/lib/validations/task"
import { createNotification } from "@/lib/notifications"

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
        assignee: { select: { id: true, name: true, image: true } },
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

    const task = await prisma.task.create({
      data: {
        ...parsed.data,
        position: newPosition,
        creatorId: session.user.id,
      },
      include: {
        assignee: { select: { id: true, name: true, image: true } },
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

    // Notify assignee
    if (task.assigneeId && task.assigneeId !== session.user.id) {
      await createNotification({
        userId: task.assigneeId,
        title: "New Task Assigned",
        body: `You have been assigned to: ${task.title}`,
        type: "TASK",
        link: `/dashboard/projects/${params.id}`,
      })
    }

    return NextResponse.json(task)
  } catch (error) {
    console.error("[PROJECT_TASKS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
