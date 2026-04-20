import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { isBefore } from "date-fns"

export const dynamic = 'force-dynamic';

/**
 * GET /api/projects/[id]/analytics
 *
 * Returns all project-specific analytics in a single call:
 * - health:       segmented counts for the health bar
 * - taskPie:      per-status task distribution
 * - milestonePie: per-status milestone distribution
 * - productivity: weighted points per member (sorted desc)
 * - gantt:        tasks + milestones sorted by dueDate for the Gantt view
 */
export async function GET(
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

    const now = new Date()

    // Fetch tasks and milestones in parallel
    const [tasks, milestones, productivityMembers] = await Promise.all([
      prisma.task.findMany({
        where: { projectId: params.id },
        select: { id: true, title: true, status: true, dueDate: true },
      }),
      prisma.milestone.findMany({
        where: { projectId: params.id },
        select: { id: true, title: true, status: true, dueDate: true },
      }),
      prisma.projectMember.findMany({
        where: { projectId: params.id },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { points: "desc" },
      }),
    ])

    // ── Health bar segments ────────────────────────────────────────────────────
    const doneTasks       = tasks.filter((t) => t.status === "DONE")
    const inProgressTasks = tasks.filter((t) => t.status === "IN_PROGRESS" || t.status === "IN_REVIEW")
    const todoTasks       = tasks.filter((t) => t.status === "TODO")
    const achievedMilestones = milestones.filter((m) => m.status === "ACHIEVED")

    // Overdue: non-done tasks OR non-achieved milestones that are past dueDate
    const overdueTasks = tasks.filter(
      (t) => t.status !== "DONE" && t.dueDate && isBefore(new Date(t.dueDate), now)
    )
    const overdueMilestones = milestones.filter(
      (m) => m.status !== "ACHIEVED" && isBefore(new Date(m.dueDate), now)
    )

    const total = tasks.length + milestones.length
    const health = {
      done:       doneTasks.length + achievedMilestones.length,
      inProgress: inProgressTasks.length,
      overdue:    overdueTasks.length + overdueMilestones.length,
      todo:       todoTasks.length + milestones.filter((m) => m.status !== "ACHIEVED").length,
      total,
    }

    // ── Task status pie ────────────────────────────────────────────────────────
    const taskStatusColors: Record<string, string> = {
      TODO: "#94a3b8", IN_PROGRESS: "#3b82f6", IN_REVIEW: "#8b5cf6", DONE: "#10b981",
    }
    const taskStatusCounts: Record<string, number> = {}
    tasks.forEach((t) => { taskStatusCounts[t.status] = (taskStatusCounts[t.status] || 0) + 1 })
    const taskPie = Object.entries(taskStatusCounts)
      .map(([name, value]) => ({ name, value, fill: taskStatusColors[name] ?? "#94a3b8" }))
      .filter((d) => d.value > 0)

    // ── Milestone status pie ───────────────────────────────────────────────────
    const milestoneStatusColors: Record<string, string> = {
      UPCOMING: "#94a3b8", IN_PROGRESS: "#3b82f6", ACHIEVED: "#10b981", MISSED: "#ef4444",
    }
    const milestoneCounts: Record<string, number> = {}
    milestones.forEach((m) => { milestoneCounts[m.status] = (milestoneCounts[m.status] || 0) + 1 })
    const milestonePie = Object.entries(milestoneCounts)
      .map(([name, value]) => ({ name, value, fill: milestoneStatusColors[name] ?? "#94a3b8" }))
      .filter((d) => d.value > 0)

    // ── Productivity (weighted points) ────────────────────────────────────────
    const productivity = productivityMembers.map((m) => ({
      userId: m.userId,
      userName: m.user.name,
      points: m.points,
    }))

    // ── Gantt items: tasks + milestones with dueDate ──────────────────────────
    const overdueTaskIds  = new Set(overdueTasks.map((t) => t.id))
    const overdueMsIds    = new Set(overdueMilestones.map((m) => m.id))

    const ganttTasks = tasks
      .filter((t) => t.dueDate !== null)
      .map((t) => ({
        id: t.id,
        title: t.title,
        type: "task" as const,
        status: t.status,
        dueDate: t.dueDate!.toISOString(),
        isOverdue: overdueTaskIds.has(t.id),
      }))

    const ganttMilestones = milestones
      .map((m) => ({
        id: m.id,
        title: m.title,
        type: "milestone" as const,
        status: m.status,
        dueDate: m.dueDate.toISOString(),
        isOverdue: overdueMsIds.has(m.id),
      }))

    const gantt = [...ganttTasks, ...ganttMilestones].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )

    return NextResponse.json({ health, taskPie, milestonePie, productivity, gantt })
  } catch (error) {
    console.error("[PROJECT_ANALYTICS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
