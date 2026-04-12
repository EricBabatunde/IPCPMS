import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateProjectSchema } from "@/lib/validations/project"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, image: true, department: true }
            }
          }
        },
      }
    })

    if (!project) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Verify member access
    const isMember = project.members.some(m => m.userId === session.user?.id)
    if (!isMember && session.user?.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
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

    // Verify admin/manager access
    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: params.id, userId: session.user.id } }
    })
    if (!membership || (membership.role !== "ADMIN" && membership.role !== "MANAGER")) {
      return new NextResponse("Forbidden", { status: 403 })
    }

    const body = await req.json()
    const parsed = updateProjectSchema.safeParse(body)
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: parsed.data,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: project.id,
        action: "updated_project",
        detail: `Updated project details`,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_PATCH]", error)
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

    // Only Admin can delete project
    if (session.user.role !== "ADMIN") {
      return new NextResponse("Forbidden - Admins only", { status: 403 })
    }

    const project = await prisma.project.delete({
      where: { id: params.id },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
