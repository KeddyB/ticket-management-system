import { type NextRequest, NextResponse } from "next/server"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"
import pool from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get admin details from database
    const result = await pool.query(
      "SELECT id, email, name, role, category_id, is_active FROM admins WHERE id = $1 AND is_active = true",
      [decoded.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    const admin = result.rows[0]

    return NextResponse.json({
      admin: admin,
      token: token, // Include token in response for client-side storage
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
