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

    const projects = await prisma.project.findMany({
      where: {
        ...(status && { status: status as ProjectStatus }),
        members: {
          some: {
            userId: session.user.id,
          },
        },
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

    return NextResponse.json(projects)
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
    const parsed = createProjectSchema.safeParse(body)
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }
    
    // In Prisma transaction: Create Project + add creator as ADMIN + log activity + create default group
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

      // Create activity log
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: project.id,
          action: "created_project",
          detail: `Created project ${project.name}`,
        },
      })

      // Create linked group
      await tx.group.create({
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

      return project
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("[PROJECTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
