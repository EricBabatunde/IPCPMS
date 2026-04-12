import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { updateMilestoneSchema } from "@/lib/validations/milestone"

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = updateMilestoneSchema.safeParse(body)
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const milestone = await prisma.milestone.findUnique({ where: { id: params.id } })
    if (!milestone) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const updatedMilestone = await prisma.milestone.update({
      where: { id: params.id },
      data: parsed.data,
    })

    if (parsed.data.status && parsed.data.status !== milestone.status) {
      await prisma.activityLog.create({
        data: {
          userId: session.user.id,
          projectId: milestone.projectId,
          action: "updated_milestone",
          detail: `Milestone "${milestone.title}" status changed to ${parsed.data.status}`,
        },
      })
    }

    return NextResponse.json(updatedMilestone)
  } catch (error) {
    console.error("[MILESTONE_PATCH]", error)
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

    const milestone = await prisma.milestone.findUnique({ where: { id: params.id } })
    if (!milestone) {
      return new NextResponse("Not Found", { status: 404 })
    }

    await prisma.milestone.delete({
      where: { id: params.id },
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: milestone.projectId,
        action: "deleted_milestone",
        detail: `Deleted milestone "${milestone.title}"`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[MILESTONE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
