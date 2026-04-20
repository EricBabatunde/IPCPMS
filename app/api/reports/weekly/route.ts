import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { subDays, format } from "date-fns"

export const dynamic = 'force-dynamic';
/**
 * GET /api/reports/weekly
 *
 * Runs two reporting passes:
 * 1. Weekly completion summary → sends to project ADMINs for every project.
 * 2. Overdue alerts → notifies ADMINs + task assignees of overdue tasks/milestones.
 *
 * Protected by CRON_SECRET.
 * Configured in vercel.json to run every Monday at 07:00 UTC.
 */
export async function GET(req: Request) {
  // ── Auth ─────────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const now = new Date()
    const windowStart = subDays(now, 7)
    let totalNotificationsSent = 0

    // ── Fetch all projects with ADMIN members and courseCode ───────────────────
    const projects = await prisma.project.findMany({
      include: {
        members: {
          where: { role: "ADMIN" },
          include: {
            user: { select: { id: true, name: true } },
          },
        },
      },
    })

    // ═══════════════════════════════════════════════════════════════════════════
    // PASS 1: Weekly completion summaries
    // ═══════════════════════════════════════════════════════════════════════════
    for (const project of projects) {
      const completionLogs = await prisma.activityLog.findMany({
        where: {
          projectId: project.id,
          action: "updated_task",
          createdAt: { gte: windowStart },
          detail: { contains: "to DONE" },
        },
        orderBy: { createdAt: "desc" },
      })

      if (completionLogs.length === 0) continue

      const taskTitles = completionLogs
        .map((log) => {
          const match = log.detail?.match(/^Moved task "(.+)" to DONE$/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]

      const uniqueTitles = Array.from(new Set(taskTitles))
      const x = uniqueTitles.length

      const coursePrefix =
        project.courseCode && project.courseCode !== "none"
          ? `${project.courseCode} — `
          : ""

      const notificationBody =
        `Weekly Summary: ${coursePrefix}${project.name} — ` +
        `${x} task${x !== 1 ? "s" : ""} completed this week: ` +
        uniqueTitles.map((t) => `"${t}"`).join(", ") + "."

      for (const member of project.members) {
        const notification = await prisma.notification.create({
          data: {
            userId: member.userId,
            title: `Weekly Report — ${project.name}`,
            body: notificationBody,
            type: "SYSTEM",
            link: `/dashboard/projects/${project.id}`,
          },
        })
        await pusherServer.trigger(
          `private-user-${member.userId}`,
          "new_notification",
          notification
        )
        totalNotificationsSent++
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PASS 2: Overdue task alerts
    // ═══════════════════════════════════════════════════════════════════════════
    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "DONE" },
      },
      include: {
        assignees: { select: { id: true } },
        project: {
          select: {
            id: true,
            name: true,
            courseCode: true,
            members: {
              where: { role: "ADMIN" },
              select: { userId: true },
            },
          },
        },
      },
    })

    for (const task of overdueTasks) {
      const coursePrefix =
        task.project.courseCode && task.project.courseCode !== "none"
          ? `[${task.project.courseCode}] `
          : ""

      const dueDateStr = task.dueDate ? format(new Date(task.dueDate), "MMM d, yyyy") : "N/A"
      const overdueBody =
        `⏰ Task "${task.title}" in ${coursePrefix}${task.project.name} was due ${dueDateStr} ` +
        `and is still ${task.status.replace("_", " ")}.`

      // Collect unique user IDs to notify: project admins + task assignees
      const notifySet = new Set<string>()
      task.project.members.forEach((m) => notifySet.add(m.userId))
      task.assignees.forEach((a) => notifySet.add(a.id))

      for (const uid of Array.from(notifySet)) {
        const notification = await prisma.notification.create({
          data: {
            userId: uid,
            title: `Overdue Task — ${task.title}`,
            body: overdueBody,
            type: "TASK",
            link: `/dashboard/projects/${task.project.id}?task=${task.id}`,
          },
        })
        await pusherServer.trigger(
          `private-user-${uid}`,
          "new_notification",
          notification
        )
        totalNotificationsSent++
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PASS 3: Overdue milestone alerts
    // ═══════════════════════════════════════════════════════════════════════════
    const overdueMilestones = await prisma.milestone.findMany({
      where: {
        dueDate: { lt: now },
        status: { not: "ACHIEVED" },
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            courseCode: true,
            members: {
              where: { role: "ADMIN" },
              select: { userId: true },
            },
          },
        },
      },
    })

    for (const milestone of overdueMilestones) {
      const coursePrefix =
        milestone.project.courseCode && milestone.project.courseCode !== "none"
          ? `[${milestone.project.courseCode}] `
          : ""

      const dueDateStr = format(new Date(milestone.dueDate), "MMM d, yyyy")
      const overdueBody =
        `⏰ Milestone "${milestone.title}" in ${coursePrefix}${milestone.project.name} was due ${dueDateStr} ` +
        `and is ${milestone.status.replace("_", " ")}.`

      for (const m of milestone.project.members) {
        const notification = await prisma.notification.create({
          data: {
            userId: m.userId,
            title: `Overdue Milestone — ${milestone.title}`,
            body: overdueBody,
            type: "PROJECT",
            link: `/dashboard/projects/${milestone.project.id}?tab=milestones`,
          },
        })
        await pusherServer.trigger(
          `private-user-${m.userId}`,
          "new_notification",
          notification
        )
        totalNotificationsSent++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weekly report complete. ${totalNotificationsSent} notification(s) dispatched.`,
      notificationsSent: totalNotificationsSent,
      overdueTasksFound: overdueTasks.length,
      overdueMilestonesFound: overdueMilestones.length,
      generatedAt: now.toISOString(),
    })
  } catch (error) {
    console.error("[REPORTS_WEEKLY]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
