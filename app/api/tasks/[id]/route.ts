import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateTaskSchema } from "@/lib/validations/task"
import { pusherServer } from "@/lib/pusher"


export const dynamic = 'force-dynamic';
// ─── Statuses that require the permission gate ─────────────────────────────────
// Only task assignees and the project ADMIN may move a task to these statuses.
const GATED_STATUSES = new Set(["IN_PROGRESS", "IN_REVIEW", "DONE"])

// Points awarded per gated transition
const STATUS_POINTS: Record<string, number> = {
  IN_PROGRESS: 5,
  IN_REVIEW: 7,
  DONE: 10,
}

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

    // Fetch the current task with assignees so we can inspect them
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        assignees: { select: { id: true } },
      },
    })
    if (!task) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // ── Universal permission gate for ANY status change ──────────────────────
    // Only task assignees or the project ADMIN may move a task between columns.
    const newStatus = parsed.data.status
    const isStatusChange = newStatus !== undefined && newStatus !== task.status

    if (isStatusChange && newStatus) {
      const membership = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: task.projectId,
            userId: session.user.id,
          },
        },
      })

      const isProjectAdmin = membership?.role === "ADMIN"
      const isAssignee = task.assignees.some((a) => a.id === session.user.id)
      const hasNoAssignees = task.assignees.length === 0

      // If the task has no assignees, only the Project Admin can move it
      if (hasNoAssignees && !isProjectAdmin) {
        return new NextResponse(
          JSON.stringify({
            error: "FORBIDDEN",
            message:
              "This task has no assignees. Only the project admin can move unassigned tasks. Please add assignees first.",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }

      // Standard gate: must be admin or assignee
      if (!hasNoAssignees && !isProjectAdmin && !isAssignee) {
        return new NextResponse(
          JSON.stringify({
            error: "FORBIDDEN",
            message:
              "Only the project admin or a task assignee can move this task to " +
              newStatus.replace("_", " ") +
              ".",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } }
        )
      }
    }

    const { assigneeIds, ...taskData } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: any = { ...taskData }

    // Auto-manage completedAt based on status transition
    if (parsed.data.status) {
      if (parsed.data.status === "DONE" && task.status !== "DONE") {
        updateData.completedAt = new Date()
      } else if (parsed.data.status !== "DONE" && task.status === "DONE") {
        updateData.completedAt = null
      }
    }

    if (assigneeIds !== undefined) {
      updateData.assignees = {
        set: assigneeIds.map((id: string) => ({ id })),
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: updateData,
      include: {
        assignees: { select: { id: true, name: true, image: true } },
        tags: true,
        _count: { select: { comments: true } },
      },
    })

    const statusChanged = isStatusChange
    const positionChanged =
      parsed.data.position !== undefined && parsed.data.position !== task.position

    // ── Weighted productivity points ───────────────────────────────────────────
    // Fire points only on a clean status transition to a gated status.
    if (statusChanged && newStatus && GATED_STATUSES.has(newStatus)) {
      const pointsToAward = STATUS_POINTS[newStatus]

      // Award points to the acting user (they passed the gate, so they're eligible)
      await prisma.projectMember.updateMany({
        where: { projectId: task.projectId, userId: session.user.id },
        data: { points: { increment: pointsToAward } },
      })

      // If moving to DONE, also award points to all other assignees
      if (newStatus === "DONE") {
        const otherAssigneeIds = task.assignees
          .map((a) => a.id)
          .filter((id) => id !== session.user.id)

        if (otherAssigneeIds.length > 0) {
          await prisma.projectMember.updateMany({
            where: {
              projectId: task.projectId,
              userId: { in: otherAssigneeIds },
            },
            data: { points: { increment: pointsToAward } },
          })
        }
      }
    }

    // ── Activity log ──────────────────────────────────────────────────────────
    if (statusChanged || positionChanged) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: task.projectId,
          action: "updated_task",
          detail: statusChanged
            ? `Moved task "${task.title}" to ${newStatus}`
            : `Reordered task "${task.title}" in ${task.status}`,
        },
      })
    }

    // ── Notifications ─────────────────────────────────────────────────────────
    if (statusChanged || positionChanged) {
      const projectMembers = await prisma.projectMember.findMany({
        where: { projectId: task.projectId, role: "ADMIN" },
      })

      const notifyUsers = new Set<string>()
      projectMembers.forEach((m) => notifyUsers.add(m.userId))
      if (task.creatorId) notifyUsers.add(task.creatorId)
      notifyUsers.delete(session.user.id)

      for (const uid of Array.from(notifyUsers)) {
        const notification = await prisma.notification.create({
          data: {
            title: "Task Updated",
            body: `The task "${task.title}" was updated on the board.`,
            type: "TASK",
            userId: uid,
            link: `/dashboard/projects/${task.projectId}?task=${task.id}`,
          },
        })
        await pusherServer.trigger(
          `private-user-${uid}`,
          "new_notification",
          notification
        )
      }
    }

    await pusherServer.trigger(`private-project-${task.projectId}`, "task-updated", { taskId: task.id })

    // ── Dynamic project status automation ─────────────────────────────────────
    // Recompute project status based on current task + milestone distribution.
    if (statusChanged) {
      const [allProjectTasks, allMilestones] = await Promise.all([
        prisma.task.findMany({
          where: { projectId: task.projectId },
          select: { status: true },
        }),
        prisma.milestone.findMany({
          where: { projectId: task.projectId },
          select: { status: true },
        }),
      ])

      let computedStatus: "PLANNING" | "ACTIVE" | "COMPLETED" = "PLANNING"

      const allTasksDone = allProjectTasks.length > 0 && allProjectTasks.every((t) => t.status === "DONE")
      const allMilestonesAchieved = allMilestones.length === 0 || allMilestones.every((m) => m.status === "ACHIEVED")
      const hasActiveWork = allProjectTasks.some(
        (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
      )

      if (allTasksDone && allMilestonesAchieved) {
        computedStatus = "COMPLETED"
      } else if (hasActiveWork) {
        computedStatus = "ACTIVE"
      }

      await prisma.project.update({
        where: { id: task.projectId },
        data: { status: computedStatus },
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

    await pusherServer.trigger(`private-project-${task.projectId}`, "task-deleted", { taskId: task.id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[TASK_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
