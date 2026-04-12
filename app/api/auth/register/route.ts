import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { registerSchema } from "@/lib/validations/auth"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = registerSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data provided", details: parsed.error.format() }, { status: 400 })
    }
    
    const { email, password, name, department } = parsed.data
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)
    
    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        department,
        // In a real app we'd trigger email verification here
        emailVerified: new Date(), // Auto-verify for simplicity
      }
    })
    
    // Return success without password
    return NextResponse.json({ 
      user: { id: user.id, name: user.name, email: user.email }
    }, { status: 201 })
    
  } catch (error: unknown) {
    console.error("Register Error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
