import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  req: Request,
  { params }: { params: { id: string, fileId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { id: projectId, fileId } = params

    // Check if project exists and user is a member
    const membership = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: session.user.id
        }
      }
    })

    if (!membership) {
       return new NextResponse("Unauthorized", { status: 401 })
    }

    // Find file
    const file = await prisma.projectFile.findUnique({
      where: { id: fileId }
    })

    if (!file) {
      return new NextResponse("File Not Found", { status: 404 })
    }

    // Permission check: uploader or project manager?
    // For now, allow uploader or any member with MANAGER role (if model had roles, but checking membership)
    // Blueprint is simple: allow uploader to delete
    if (file.uploaderId !== session.user.id) {
       return new NextResponse("Forbidden", { status: 403 })
    }

    await prisma.projectFile.delete({
      where: { id: fileId }
    })

    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        projectId,
        action: "deleted_file",
        detail: `Deleted file: ${file.name}`,
      },
    })

    return new NextResponse("Deleted", { status: 200 })
  } catch (error) {
    console.error("[PROJECT_FILE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
