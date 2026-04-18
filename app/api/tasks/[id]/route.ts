import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateTaskSchema } from "@/lib/validations/task"
import { pusherServer } from "@/lib/pusher"

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

    const { assigneeIds, ...taskData } = parsed.data;
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...taskData };
    if (assigneeIds !== undefined) {
       updateData.assignees = {
          set: assigneeIds.map((id: string) => ({ id }))
       };
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignees: { select: { id: true, name: true, image: true } },
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

    if ((parsed.data.status && parsed.data.status !== task.status) || (parsed.data.position !== undefined && parsed.data.position !== task.position)) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: task.projectId, role: "ADMIN" }
      })
      
      const notifyUsers = new Set<string>()
      projectMembers.forEach(m => notifyUsers.add(m.userId))
      if (task.creatorId) notifyUsers.add(task.creatorId)
      
      notifyUsers.delete(session.user.id)

      for (const uid of notifyUsers) {
        const notification = await prisma.notification.create({
          data: {
            title: "Task Updated",
            body: `The task "${task.title}" was updated on the board.`,
            type: "TASK",
            userId: uid,
            link: `/dashboard/projects/${task.projectId}?task=${task.id}`
          }
        })
        await pusherServer.trigger(`private-user-${uid}`, "new_notification", notification)
      }
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
