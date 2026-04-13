import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  req: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id || session.user.id !== params.userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { image, name, department, bio } = body

    const user = await prisma.user.update({
      where: { id: params.userId },
      data: {
        image,
        name,
        department,
        bio
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
