import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusher"
import { subDays } from "date-fns"

/**
 * GET /api/reports/weekly
 *
 * Generates consolidated weekly progress summaries for project supervisors.
 * Protected by CRON_SECRET — only Vercel Cron or an authorised internal caller
 * may invoke this endpoint.
 *
 * Configured in vercel.json to run every Monday at 07:00 UTC.
 */
export async function GET(req: Request) {
  // ── Auth: verify the cron secret ────────────────────────────────────────────
  const authHeader = req.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return new NextResponse("Unauthorized", { status: 401 })
  }

  try {
    const windowStart = subDays(new Date(), 7)

    // Fetch all projects with their ADMIN members and courseCode
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

    let totalNotificationsSent = 0

    for (const project of projects) {
      // Find activity logs for this project from the last 7 days where tasks
      // were moved to DONE (the PATCH route logs: `Moved task "X" to DONE`)
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

      // Extract task titles from log details: `Moved task "Title" to DONE`
      const taskTitles = completionLogs
        .map((log) => {
          const match = log.detail?.match(/^Moved task "(.+)" to DONE$/)
          return match ? match[1] : null
        })
        .filter(Boolean) as string[]

      const uniqueTitles = Array.from(new Set(taskTitles))
      const x = uniqueTitles.length

      const coursePrefix = project.courseCode && project.courseCode !== "none"
        ? `${project.courseCode} — `
        : ""

      const notificationBody =
        `Weekly Summary: ${coursePrefix}${project.name} — ` +
        `${x} task${x !== 1 ? "s" : ""} completed this week: ` +
        uniqueTitles.map((t) => `"${t}"`).join(", ") +
        "."

      // Notify all ADMIN members of this project
      const adminMembers = project.members // already filtered role=ADMIN

      for (const member of adminMembers) {
        const notification = await prisma.notification.create({
          data: {
            userId: member.userId,
            title: `Weekly Report — ${project.name}`,
            body: notificationBody,
            type: "SYSTEM",
            link: `/dashboard/projects/${project.id}`,
          },
        })

        // Push real-time update to the supervisor's notification bell
        await pusherServer.trigger(
          `private-user-${member.userId}`,
          "new_notification",
          notification
        )

        totalNotificationsSent++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Weekly reports sent. ${totalNotificationsSent} notification(s) dispatched.`,
      notificationsSent: totalNotificationsSent,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error("[REPORTS_WEEKLY]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
