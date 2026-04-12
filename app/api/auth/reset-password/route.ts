import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { resetPasswordSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 })
    }
    
    const { token, password } = parsed.data
    
    // Find the token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token }
    })
    
    if (!verificationToken) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 })
    }
    
    if (new Date() > verificationToken.expires) {
      // Delete expired token
      await prisma.verificationToken.delete({ where: { token } })
      return NextResponse.json({ error: "Token has expired" }, { status: 400 })
    }
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email: verificationToken.identifier }
    })
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Update user password and delete token
    await prisma.$transaction([
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      }),
      prisma.verificationToken.delete({
        where: { token }
      })
    ])
    
    return NextResponse.json({ success: true }, { status: 200 })
    
  } catch (error: unknown) {
    console.error("Reset Password Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
