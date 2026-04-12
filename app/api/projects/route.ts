import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createProjectSchema } from "@/lib/validations/project"
import { ProjectStatus } from "@prisma/client"

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
        _count: {
          select: { tasks: true, milestones: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Annotate each project with isMember flag
    const annotated = projects.map((project) => ({
      ...project,
      isMember: project.members.some((m) => m.userId === session.user?.id),
    }))

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
      return new NextResponse("Invalid Data", { status: 400 })
    }

    // In Prisma transaction: Create Project + add creator as ADMIN + add selected members + log activity + create default group
    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          ...parsed.data,
          members: {
            create: {
              userId: session.user.id,
              role: "ADMIN",
            },
          },
        },
      })

      // Create ProjectMember entries for each selected user (skip creator, already added)
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

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: project.id,
          action: "created_project",
          detail: `Created project ${project.name}`,
        },
      })

      // Create linked group with all members
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

      // Add additional members to the group as well
      if (additionalMembers.length > 0) {
        await tx.groupMember.createMany({
          data: additionalMembers.map((userId: string) => ({
            groupId: group.id,
            userId,
            isAdmin: false,
          })),
        })
      }

      return project
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[PROJECTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
