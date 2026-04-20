import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = 'force-dynamic';

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = params.id

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { group: true },
    })
    if (!project) {
      return new NextResponse("Not Found", { status: 404 })
    }

    // Check if user is already a member
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: session.user.id } },
    })
    if (existing) {
      return new NextResponse("Already a member", { status: 409 })
    }

    // Transaction: add to project + add to group + log
    await prisma.$transaction(async (tx) => {
      await tx.projectMember.create({
        data: {
          projectId,
          userId: session.user.id,
          role: "MEMBER",
        },
      })

      // Add to project group if it exists
      if (project.group) {
        await tx.groupMember.create({
          data: {
            groupId: project.group.id,
            userId: session.user.id,
            isAdmin: false,
          },
        })
      }

      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          projectId,
          action: "joined_project",
          detail: `Joined project ${project.name}`,
        },
      })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PROJECT_JOIN]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
