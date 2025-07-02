import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const result = await pool.query(
      `
      SELECT 
        tc.*,
        a.name as admin_name
      FROM ticket_comments tc
      LEFT JOIN admins a ON tc.admin_id = a.id
      WHERE tc.ticket_id = $1
      ORDER BY tc.created_at ASC
    `,
      [params.id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get comments error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { comment, is_internal = false } = await request.json()

    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 })
    }

    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
      [params.id, decoded.id, comment, is_internal],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Create comment error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
