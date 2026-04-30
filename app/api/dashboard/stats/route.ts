import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isBefore } from "date-fns"

export const dynamic = 'force-dynamic';

/**
 * GET /api/dashboard/stats
 *
 * Returns the four main dashboard KPI stats:
 * - totalProjects: count of all projects the user is a member of
 * - totalTasks: count of all tasks across those projects
 * - completedTasks: count of DONE tasks
 * - overdueTasks: count of non-DONE tasks past due date
 * - tasksInProgress: count of tasks in IN_PROGRESS or IN_REVIEW
 */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userProjects = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true },
    })
    const projectIds = userProjects.map((p) => p.projectId)

    const [totalProjects, tasks] = await Promise.all([
      Promise.resolve(projectIds.length),
      prisma.task.findMany({
        where: { projectId: { in: projectIds } },
        select: { status: true, dueDate: true },
      }),
    ])

    const now = new Date()
    const totalTasks = tasks.length
    const completedTasks = tasks.filter((t) => t.status === "DONE").length
    const overdueTasks = tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate && isBefore(new Date(t.dueDate), now)
    ).length
    const tasksInProgress = tasks.filter(
      (t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW"
    ).length

    return NextResponse.json({
      totalProjects,
      totalTasks,
      completedTasks,
      overdueTasks,
      tasksInProgress,
    })
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
