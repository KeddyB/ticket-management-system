import { type NextRequest, NextResponse } from "next/server"
import { authenticateAdmin, generateToken } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("Login attempt for:", email)

    const admin = await authenticateAdmin(email, password)

    if (!admin) {
      console.log("Authentication failed for:", email)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    console.log("Authentication successful for:", admin.email)

    const token = await generateToken(admin)
    console.log("Generated token for:", admin.email)

    // Create response with admin data
    const response = NextResponse.json({
      success: true,
      token: token, // Include token in response for client-side storage
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
        category_id: admin.category_id,
      },
    })

    // Set httpOnly cookie
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24 hours
      path: "/",
    })

    console.log("Cookie set for:", admin.email)

    return response
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
