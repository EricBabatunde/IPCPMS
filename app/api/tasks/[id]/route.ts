import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateTaskSchema } from "@/lib/validations/task"
import { createNotification } from "@/lib/notifications"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = updateTaskSchema.safeParse(body)
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: parsed.data,
      include: {
        assignee: { select: { id: true, name: true, image: true } },
        tags: true,
        _count: { select: { comments: true } }
      }
    })

    // Log if status changed
    if (parsed.data.status && parsed.data.status !== task.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: task.projectId,
          action: "updated_task",
          detail: `Moved task "${task.title}" to ${parsed.data.status}`,
        },
      })
    }

    // Notify new assignee if changed
    if (parsed.data.assigneeId && parsed.data.assigneeId !== task.assigneeId && parsed.data.assigneeId !== session.user.id) {
      await createNotification({
        userId: parsed.data.assigneeId,
        title: "Task Assigned",
        body: `You have been assigned to: ${task.title}`,
        type: "TASK",
        link: `/dashboard/projects/${task.projectId}`,
      })
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("[TASK_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.task.delete({
      where: { id: params.id },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: task.projectId,
        action: "deleted_task",
        detail: `Deleted task "${task.title}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
