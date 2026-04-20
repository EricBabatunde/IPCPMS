import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

export const dynamic = 'force-dynamic';
const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty"),
})

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const comments = await prisma.comment.findMany({
      where: { taskId: params.id },
      include: {
        author: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: "asc" }
    })

    return NextResponse.json(comments)
  } catch (error) {
    console.error("[TASK_COMMENTS_GET]", error)
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
    const parsed = commentSchema.safeParse(body)

    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const task = await prisma.task.findUnique({ where: { id: params.id } })
    if (!task) {
      return new NextResponse("Not Found", { status: 404 })
    }

    const comment = await prisma.comment.create({
      data: {
        content: parsed.data.content,
        taskId: params.id,
        authorId: session.user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } }
      }
    })

    // Log comment
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId: task.projectId,
        action: "added_comment",
        detail: `Commented on task "${task.title}"`,
      },
    })

    return NextResponse.json(comment)
  } catch (error) {
    console.error("[TASK_COMMENTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
