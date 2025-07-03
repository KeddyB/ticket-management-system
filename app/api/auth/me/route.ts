import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import pool from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    console.log("Auth ME: Starting auth check")

    // Try multiple ways to get the token
    let token = request.cookies.get("auth-token")?.value
    console.log("Auth ME: Token from cookie:", !!token)

    if (!token) {
      // Check Authorization header
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
        console.log("Auth ME: Token from header:", !!token)
      }
    }

    if (!token) {
      console.log("Auth ME: No token found in request")
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    console.log("Auth ME: Verifying token...")
    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("Auth ME: Token verification failed")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("Auth ME: Token verified for admin ID:", decoded.id)

    // Get admin details from database
    const result = await pool.query(
      "SELECT id, email, name, role, category_id, is_active FROM admins WHERE id = $1 AND is_active = true",
      [decoded.id],
    )

    if (result.rows.length === 0) {
      console.log("Auth ME: Admin not found or inactive")
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const admin = result.rows[0]
    console.log("Auth ME: Auth successful for:", admin.email)

    return NextResponse.json({
      admin: admin,
      token: token, // Include token in response for client-side storage
    })
  } catch (error) {
    console.error("Auth ME: Error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
