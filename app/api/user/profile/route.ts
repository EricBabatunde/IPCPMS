import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const profileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
  department: z.string().max(100).optional(),
  image: z.string().url().optional().or(z.literal("")),
})

export async function PATCH(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const parsed = profileSchema.safeParse(body)

    if (!parsed.success) {
      return new NextResponse("Invalid Data", { status: 400 })
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        department: true,
      },
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error("[USER_PROFILE_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        bio: true,
        department: true,
        role: true,
        createdAt: true,
      },
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error("[USER_PROFILE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
