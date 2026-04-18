import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { format, subDays, startOfDay, isBefore } from "date-fns"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return new NextResponse("Unauthorized", { status: 401 })

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type")
    
    // For specific project routing if provided, otherwise aggregate
    const projectId = searchParams.get("projectId") || undefined

    const userProjects = await prisma.projectMember.findMany({
      where: { userId: session.user.id },
      select: { projectId: true }
    })
    const userProjectIds = userProjects.map(p => p.projectId)
    
    // Safety check - we only provide analytics for projects the user belongs to
    const targetProjectIds = projectId 
      ? (userProjectIds.includes(projectId) ? [projectId] : []) 
      : userProjectIds

    if (targetProjectIds.length === 0) {
      return NextResponse.json([]) // No access or no projects
    }

    switch (type) {
      case "kpis": {
        const totalProjects = targetProjectIds.length
        
        const tasks = await prisma.task.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { status: true, dueDate: true }
        })
        
        const totalTasks = tasks.length
        const completedTasks = tasks.filter(t => t.status === "DONE").length
        const overdueTasks = tasks.filter(t => 
          t.status !== "DONE" && t.dueDate && isBefore(new Date(t.dueDate), new Date())
        ).length

        return NextResponse.json({
          totalProjects,
          totalTasks,
          completedTasks,
          overdueTasks
        })
      }

      case "task-completion": {
        // Last 14 days interpolation
        const data: { date: string; created: number; completed: number }[] = []
        for (let i = 13; i >= 0; i--) {
          const date = startOfDay(subDays(new Date(), i))
          const dateString = format(date, "yyyy-MM-dd")
          data.push({ date: dateString, created: 0, completed: 0 })
        }

        const tasks = await prisma.task.findMany({
          where: { 
            projectId: { in: targetProjectIds },
            createdAt: { gte: subDays(new Date(), 14) }
          },
          select: { createdAt: true, completedAt: true }
        })

        tasks.forEach(t => {
          const createdDate = format(new Date(t.createdAt), "yyyy-MM-dd")
          const createdEntry = data.find(d => d.date === createdDate)
          if (createdEntry) createdEntry.created += 1

          if (t.completedAt) {
            const completedDate = format(new Date(t.completedAt), "yyyy-MM-dd")
            const completedEntry = data.find(d => d.date === completedDate)
            if (completedEntry) completedEntry.completed += 1
          }
        })

        return NextResponse.json(data)
      }

      case "milestones": {
        const milestones = await prisma.milestone.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { id: true, title: true, status: true }
        })

        // Just aggregate by status
        const statuses = ["UPCOMING", "IN_PROGRESS", "ACHIEVED", "MISSED"]
        const data = statuses.map((status, index) => {
          const count = milestones.filter(m => m.status === status).length
          const fillColors = ["#94a3b8", "#3b82f6", "#10b981", "#ef4444"]
          return {
            name: status,
            value: count,
            fill: fillColors[index]
          }
        }).filter(d => d.value > 0)

        // For radial charts we calculate percentage of achieved
        const total = milestones.length
        const achieved = milestones.filter(m => m.status === "ACHIEVED").length
        const percentComplete = total === 0 ? 0 : Math.round((achieved / total) * 100)

        return NextResponse.json({
          milestones: data,
          percentComplete
        })
      }

      case "project-status": {
        const projects = await prisma.project.findMany({
          where: { id: { in: targetProjectIds } },
          select: { status: true }
        })
        
        const counts: Record<string, number> = {}
        projects.forEach(p => {
          counts[p.status] = (counts[p.status] || 0) + 1
        })

        const colors: Record<string, string> = {
          PLANNING: "#94a3b8",
          ACTIVE: "#3b82f6",
          ON_HOLD: "#eab308",
          COMPLETED: "#10b981",
          CANCELLED: "#ef4444"
        }

        const data = Object.keys(counts).map(status => ({
          name: status,
          value: counts[status],
          fill: colors[status] || "#94a3b8"
        }))

        return NextResponse.json(data)
      }

      case "burndown": {
        // Find tasks in the current project scope
        const tasks = await prisma.task.findMany({
          where: { projectId: { in: targetProjectIds } },
          select: { createdAt: true, completedAt: true }
        })

        if (tasks.length === 0) return NextResponse.json([])

        // Simplistic simulation based on the last 14 days
        const totalTasks = tasks.length
        const data = []
        for (let i = 13; i >= 0; i--) {
          const targetDate = startOfDay(subDays(new Date(), i))
          const dateString = format(targetDate, "yyyy-MM-dd")
          
          // Ideal linearly drops from totalTasks -> 0 over 14 days
          const ideal = Math.max(0, Math.round(totalTasks * (i / 13)))
          
          // Actual remaining = total generated up to targetDate - total completed up to targetDate
          const activeTasksAtDate = tasks.filter(t => new Date(t.createdAt) <= targetDate).length
          const completedTasksAtDate = tasks.filter(t => t.completedAt && new Date(t.completedAt) <= targetDate).length
          const actual = activeTasksAtDate - completedTasksAtDate
          
          data.push({ date: dateString, ideal, actual })
        }

        return NextResponse.json(data)
      }

      case "contributions": {
        // Aggregate Member contribution using group interactions
        const members = await prisma.projectMember.findMany({
          where: { projectId: { in: targetProjectIds } },
          include: {
            user: { select: { id: true, name: true } }
          }
        })

        const uniqueUsers = Array.from(new Map(members.map(m => [m.userId, m.user])).values())
        const data = []

        for (const u of uniqueUsers) {
          // @ts-ignore: Prisma Types are currently globally stale in node_modules until generation is executed natively.
          const tasksCompleted = await prisma.task.count({ where: { assignees: { some: { id: u.id } }, status: "DONE", projectId: { in: targetProjectIds } } })
          const commentsPosted = await prisma.comment.count({ where: { authorId: u.id, task: { projectId: { in: targetProjectIds } } } })
          const filesUploaded = await prisma.projectFile.count({ where: { uploaderId: u.id, projectId: { in: targetProjectIds } } })
          
          // For messages, we might not easily filter by project directly because DMs have no project.
          const messagesSent = await prisma.message.count({ where: { senderId: u.id } }) + 
                               await prisma.groupMessage.count({ where: { senderId: u.id, group: { projectId: { in: targetProjectIds } } } })

          data.push({
            userName: u.name,
            tasksCompleted,
            commentsPosted,
            filesUploaded,
            messagesSent
          })
        }

        // Return top 10 most active members
        data.sort((a, b) => (b.tasksCompleted + b.commentsPosted + b.filesUploaded + b.messagesSent) - (a.tasksCompleted + a.commentsPosted + a.filesUploaded + a.messagesSent))
        
        return NextResponse.json(data.slice(0, 10))
      }

      case "activity-feed": {
        const limit = Number(searchParams.get("limit")) || 10
        const logs = await prisma.activityLog.findMany({
          where: { projectId: { in: targetProjectIds } },
          orderBy: { createdAt: "desc" },
          take: limit,
          include: {
            user: { select: { id: true, name: true, image: true } },
            project: { select: { id: true, name: true } }
          }
        })

        return NextResponse.json(logs)
      }

      case "heatmap": {
        // Aggregate activity logs by user and day of the week
        const members = await prisma.projectMember.findMany({
          where: { projectId: { in: targetProjectIds } },
          include: {
            user: { select: { id: true, name: true } }
          }
        })
        
        const logs = await prisma.activityLog.findMany({
          where: { 
            projectId: { in: targetProjectIds },
            createdAt: { gte: subDays(new Date(), 7) }
          },
          select: { userId: true, createdAt: true }
        })

        const daysMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        const uniqueUsers = Array.from(new Map(members.map(m => [m.userId, m.user])).values())
        
        const data = []
        for (const user of uniqueUsers) {
          const userLogs = logs.filter(l => l.userId === user.id)
          for (let i = 0; i < 7; i++) {
            const dayLogs = userLogs.filter(l => new Date(l.createdAt).getDay() === i)
            data.push({
              userId: user.id,
              userName: user.name,
              day: daysMap[i],
              activityCount: dayLogs.length
            })
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
