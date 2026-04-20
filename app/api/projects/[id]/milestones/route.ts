import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { createMilestoneSchema } from "@/lib/validations/milestone"

export const dynamic = 'force-dynamic';

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const milestones = await prisma.milestone.findMany({
      where: { projectId: params.id },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json(milestones)
  } catch (error) {
    console.error("[PROJECT_MILESTONES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = createMilestoneSchema.safeParse({ ...body, projectId: params.id })
    
    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const milestone = await prisma.milestone.create({
      data: parsed.data,
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: params.id,
        action: "created_milestone",
        detail: `Created milestone: ${milestone.title}`,
      },
    })

    return NextResponse.json(milestone)
  } catch (error) {
    console.error("[PROJECT_MILESTONES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
