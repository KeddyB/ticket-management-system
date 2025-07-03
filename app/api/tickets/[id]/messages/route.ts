import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Get all messages for this ticket
    const result = await pool.query(
      `
      SELECT 
        tc.*,
        a.name as admin_name,
        a.email as admin_email
      FROM ticket_comments tc
      LEFT JOIN admins a ON tc.admin_id = a.id
      WHERE tc.ticket_id = $1
      ORDER BY tc.created_at ASC
    `,
      [params.id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    const { message, is_internal = false, attachments = [] } = await request.json()

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 })
    }

    // Insert the message
    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal, attachments)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `,
      [params.id, decoded.id, message || "", is_internal, JSON.stringify(attachments)],
    )

    // Update ticket's updated_at timestamp
    await pool.query("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [params.id])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Create message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
