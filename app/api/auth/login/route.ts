import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const admin = await authenticateAdmin(email, password)

    if (!admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const token = await generateToken(admin)

    const response = NextResponse.json({
      message: "Login successful",
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        category_id: admin.category_id,
      },
      token, // Include token in response
    })

    // Set cookie with more permissive settings for development
    response.cookies.set("auth-token", token, {
      httpOnly: false, // Allow client-side access for debugging
      secure: false,
      sameSite: "lax",
      maxAge: 86400,
      path: "/",
    })

    console.log("Login successful for:", email)
    console.log("Token set in cookie")

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
