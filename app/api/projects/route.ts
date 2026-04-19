import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/validations/project"
import { ProjectStatus } from "@prisma/client"
import { getTasksForType, getDescriptionForType } from "@/lib/project-templates"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")

    // Return ALL projects (not just user's) with isMember flag
    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as ProjectStatus }),
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true },
            },
          },
        },
        tasks: { select: { status: true } },
        milestones: { select: { status: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    // Annotate each project with isMember flag and Completion Percentage
    const annotated = projects.map((project) => {
      const isMember = project.members.some((m) => m.userId === session.user?.id)

      const totalTasks = project.tasks.length
      const doneTasks = project.tasks.filter((t) => t.status === "DONE").length
      const taskScore = totalTasks > 0 ? (doneTasks / totalTasks) * 70 : 0

      const totalMilestones = project.milestones.length
      const achievedMilestones = project.milestones.filter((m) => m.status === "ACHIEVED").length
      const milestoneScore = totalMilestones > 0 ? (achievedMilestones / totalMilestones) * 30 : 0

      const completionPercentage = Math.round(taskScore + milestoneScore)

      return {
        ...project,
        isMember,
        completionPercentage,
      }
    })

    return NextResponse.json(annotated)
  } catch (error) {
    console.error("[PROJECTS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { memberIds, ...projectData } = body
    const parsed = createProjectSchema.safeParse(projectData)

    if (!parsed.success) {
      console.error("[PROJECTS_POST] Validation error:", parsed.error.flatten())
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const { courseCode, projectType, description, ...coreProjectData } = parsed.data

    // Auto-generate description if not provided and a type is selected
    const resolvedDescription =
      description ||
      (projectType ? getDescriptionForType(projectType) : undefined)

    // Resolve tasks to seed from template
    const templateTasks = projectType ? getTasksForType(projectType) : []
    const taskDueDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // +60 days

    // Run everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the project
      const project = await tx.project.create({
        data: {
          ...coreProjectData,
          description: resolvedDescription,
          courseCode: courseCode || null,
          projectType: projectType || null,
          members: {
            create: {
              userId: session.user.id,
              role: "ADMIN",
            },
          },
        },
      })

      // 2. Add additional members (skip creator, already added as ADMIN)
      const additionalMembers = (memberIds as string[] | undefined)?.filter(
        (id: string) => id !== session.user.id
      ) || []

      if (additionalMembers.length > 0) {
        await tx.projectMember.createMany({
          data: additionalMembers.map((userId: string) => ({
            projectId: project.id,
            userId,
            role: "MEMBER",
          })),
        })
      }

      // 3. Auto-seed template tasks
      if (templateTasks.length > 0) {
        await tx.task.createMany({
          data: templateTasks.map((title, index) => ({
            title,
            description: null,
            status: "TODO" as const,
            priority: "MEDIUM" as const,
            position: (index + 1) * 1024, // 1024, 2048, 3072…
            projectId: project.id,
            creatorId: session.user.id,
            dueDate: taskDueDate,
          })),
        })
      }

      // 4. Create activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: project.id,
          action: "created_project",
          detail: `Created project ${project.name}${projectType ? ` (${projectType} template, ${templateTasks.length} tasks seeded)` : ""}`,
        },
      })

      // 5. Create the linked project group with all members
      const group = await tx.group.create({
        data: {
          name: `${project.name} Team`,
          projectId: project.id,
          members: {
            create: {
              userId: session.user.id,
              isAdmin: true,
            },
          },
        },
      })

      if (additionalMembers.length > 0) {
        await tx.groupMember.createMany({
          data: additionalMembers.map((userId: string) => ({
            groupId: group.id,
            userId,
            isAdmin: false,
          })),
        })
      }

      return { project, tasksSeeded: templateTasks.length }
    })

    return NextResponse.json(result.project)
  } catch (error) {
    console.error("[PROJECTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
