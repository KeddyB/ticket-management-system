import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    // Get token from cookie or Authorization header
    let token = request.cookies.get("auth-token")?.value

    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get all active admins with their category information
    const result = await pool.query(
      `SELECT 
        a.id, 
        a.email, 
        a.name, 
        a.role, 
        a.category_id, 
        a.is_active,
        c.name as category_name,
        c.color as category_color
       FROM admins a 
       LEFT JOIN categories c ON a.category_id = c.id 
       WHERE a.is_active = true
       ORDER BY a.name ASC`,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get all admins error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
