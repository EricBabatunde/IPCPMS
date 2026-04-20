import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays, startOfDay, isBefore } from "date-fns"

export const dynamic = 'force-dynamic';
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    const projectId = searchParams.get("projectId") || undefined

    const userProjects = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true },
    })
    const userProjectIds = userProjects.map((p) => p.projectId)

    const targetProjectIds = projectId
      ? userProjectIds.includes(projectId) ? [projectId] : []
      : userProjectIds

    if (targetProjectIds.length === 0) {
      return NextResponse.json([])
    }

    switch (type) {
      // ── KPIs ──────────────────────────────────────────────────────────────────
      case "kpis": {
        const totalProjects = targetProjectIds.length

        const tasks = await prisma.task.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { status: true, dueDate: true },
        })

        const totalTasks = tasks.length
        const completedTasks = tasks.filter((t) => t.status === "DONE").length
        const overdueTasks = tasks.filter(
          (t) => t.status !== "DONE" && t.dueDate && isBefore(new Date(t.dueDate), new Date())
        ).length

        return NextResponse.json({ totalProjects, totalTasks, completedTasks, overdueTasks })
      }

      // ── Task Activity (14-day) — Created + In Progress + Completed ──────────
      case "task-completion": {
        const data: { date: string; created: number; inProgress: number; completed: number }[] = []
        for (let i = 13; i >= 0; i--) {
          const date = startOfDay(subDays(new Date(), i))
          data.push({ date: format(date, "yyyy-MM-dd"), created: 0, inProgress: 0, completed: 0 })
        }

        // Tasks created and completed within window
        const tasks = await prisma.task.findMany({
          where: {
            projectId: { in: targetProjectIds },
            createdAt: { gte: subDays(new Date(), 14) },
          },
          select: { createdAt: true, completedAt: true },
        })
        tasks.forEach((t) => {
          const createdDate = format(new Date(t.createdAt), "yyyy-MM-dd")
          const createdEntry = data.find((d) => d.date === createdDate)
          if (createdEntry) createdEntry.created += 1

          if (t.completedAt) {
            const completedDate = format(new Date(t.completedAt), "yyyy-MM-dd")
            const completedEntry = data.find((d) => d.date === completedDate)
            if (completedEntry) completedEntry.completed += 1
          }
        })

        // Tasks moved to IN_PROGRESS — sourced from ActivityLog
        const inProgressLogs = await prisma.activityLog.findMany({
          where: {
            projectId: { in: targetProjectIds },
            action: "updated_task",
            detail: { contains: "to IN_PROGRESS" },
            createdAt: { gte: subDays(new Date(), 14) },
          },
          select: { createdAt: true },
        })
        inProgressLogs.forEach((log) => {
          const logDate = format(new Date(log.createdAt), "yyyy-MM-dd")
          const entry = data.find((d) => d.date === logDate)
          if (entry) entry.inProgress += 1
        })

        return NextResponse.json(data)
      }

      // ── Milestone status ──────────────────────────────────────────────────────
      case "milestones": {
        const milestones = await prisma.milestone.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { id: true, title: true, status: true },
        })
        const statuses = ["UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"]
        const fillColors = ["#94a3b8", "#3b82f6", "#10b981", "#ef4444"]
        const milestoneData = statuses
          .map((status, i) => ({
            name: status,
            value: milestones.filter((m) => m.status === status).length,
            fill: fillColors[i],
          }))
          .filter((d) => d.value > 0)

        const total = milestones.length
        const achieved = milestones.filter((m) => m.status === "ACHIEVED").length
        const percentComplete = total === 0 ? 0 : Math.round((achieved / total) * 100)
        return NextResponse.json({ milestones: milestoneData, percentComplete })
      }

      // ── Project status pie ────────────────────────────────────────────────────
      case "project-status": {
        const projects = await prisma.project.findMany({
          where: { id: { in: targetProjectIds } },
          select: { status: true },
        })
        const counts: Record<string, number> = {}
        projects.forEach((p) => { counts[p.status] = (counts[p.status] || 0) + 1 })
        const colors: Record<string, string> = {
          PLANNING: "#94a3b8", ACTIVE: "#3b82f6", ON_HOLD: "#eab308",
          COMPLETED: "#10b981", CANCELLED: "#ef4444",
        }
        const data = Object.keys(counts).map((status) => ({
          name: status, value: counts[status], fill: colors[status] || "#94a3b8",
        }))
        return NextResponse.json(data)
      }

      // ── Burndown ──────────────────────────────────────────────────────────────
      case "burndown": {
        const tasks = await prisma.task.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { createdAt: true, completedAt: true },
        })
        if (tasks.length === 0) return NextResponse.json([])
        const totalTasks = tasks.length
        const data = []
        for (let i = 13; i >= 0; i--) {
          const targetDate = startOfDay(subDays(new Date(), i))
          const dateString = format(targetDate, "yyyy-MM-dd")
          const ideal = Math.max(0, Math.round(totalTasks * (i / 13)))
          const active = tasks.filter((t) => new Date(t.createdAt) <= targetDate).length
          const completed = tasks.filter((t) => t.completedAt && new Date(t.completedAt) <= targetDate).length
          data.push({ date: dateString, ideal, actual: active - completed })
        }
        return NextResponse.json(data)
      }

      // ── Contributions — weighted productivity points ───────────────────────
      case "contributions": {
        const members = await prisma.projectMember.findMany({
          where: { projectId: { in: targetProjectIds } },
          include: { user: { select: { id: true, name: true } } },
        })

        // Aggregate points per user (a user may appear in multiple projects)
        const userPointsMap = new Map<string, { userName: string; points: number }>()
        for (const m of members) {
          const existing = userPointsMap.get(m.userId)
          if (existing) {
            existing.points += m.points
          } else {
            userPointsMap.set(m.userId, { userName: m.user.name, points: m.points })
          }
        }

        const data = Array.from(userPointsMap.values())
          .sort((a, b) => b.points - a.points)
          .slice(0, 10)

        return NextResponse.json(data)
      }

      // ── Activity feed ─────────────────────────────────────────────────────────
      case "activity-feed": {
        const limit = Number(searchParams.get("limit")) || 10
        const logs = await prisma.activityLog.findMany({
          where: { projectId: { in: targetProjectIds } },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, image: true } },
            project: { select: { id: true, name: true } },
          },
        })
        return NextResponse.json(logs)
      }

      // ── Heatmap — ActivityLog ∪ ProgressLog ───────────────────────────────────
      case "heatmap": {
        const members = await prisma.projectMember.findMany({
          where: { projectId: { in: targetProjectIds } },
          include: { user: { select: { id: true, name: true } } },
        })

        const since = subDays(new Date(), 7)

        const [activityLogs, progressLogs] = await Promise.all([
          prisma.activityLog.findMany({
            where: { projectId: { in: targetProjectIds }, createdAt: { gte: since } },
            select: { userId: true, createdAt: true },
          }),
          prisma.progressLog.findMany({
            where: { projectId: { in: targetProjectIds }, createdAt: { gte: since } },
            select: { userId: true, createdAt: true },
          }),
        ])

        // Union both sources
        const allEvents = [
          ...activityLogs.map((l) => ({ userId: l.userId, createdAt: l.createdAt })),
          ...progressLogs.map((l) => ({ userId: l.userId, createdAt: l.createdAt })),
        ]

        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const uniqueUsers = Array.from(new Map(members.map((m) => [m.userId, m.user])).values())

        const data = []
        for (const user of uniqueUsers) {
          const userEvents = allEvents.filter((e) => e.userId === user.id)
          for (let i = 0; i < 7; i++) {
            const dayEvents = userEvents.filter((e) => new Date(e.createdAt).getDay() === i)
            data.push({ userId: user.id, userName: user.name, day: daysMap[i], activityCount: dayEvents.length })
          }
        }
        return NextResponse.json(data)
      }

      default:
        return new NextResponse("Invalid analytics type", { status: 400 })
    }
  } catch (error) {
    console.error("[ANALYTICS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
