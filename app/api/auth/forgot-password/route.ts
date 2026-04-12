import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { forgotPasswordSchema } from "@/lib/validations/auth"
import { sendPasswordResetEmail } from "@/lib/resend"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 })
    }
    
    const { email } = parsed.data
    
    const user = await prisma.user.findUnique({
      where: { email }
    })
    
    // Even if user doesn't exist, we return 200 to prevent email enumeration
    if (user) {
      const token = crypto.randomBytes(32).toString('hex')
      const expires = new Date(Date.now() + 3600000) // 1 hour From now
      
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires
        }
      })
      
      // We wrap in try block so email failure doesn't leak if the user exists
      try {
        await sendPasswordResetEmail(email, token)
      } catch (emailError) {
        console.error("Failed to send reset email:", emailError)
      }
    }
    
    return NextResponse.json({ success: true }, { status: 200 })
    
  } catch (error: unknown) {
    console.error("Forgot Password Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
