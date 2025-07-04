import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"
import { sendTicketStatusUpdateMessage } from "@/lib/automated-messages"

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

    // IMPORTANT ─ always await verifyToken
    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const result = await pool.query(
      `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.assigned_admin_id = a.id
      WHERE t.id = $1 AND t.category_id = $2
    `,
      [params.id, decoded.category_id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Get ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // IMPORTANT ─ always await verifyToken
    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { status, priority } = await request.json()

    // Get admin name for automated messages
    const adminResult = await pool.query("SELECT name FROM admins WHERE id = $1", [decoded.id])
    const adminName = adminResult.rows[0]?.name || "Support Team"

    const result = await pool.query(
      `
      UPDATE tickets 
      SET status = $1, priority = $2, updated_at = CURRENT_TIMESTAMP,
          resolved_at = CASE WHEN $1 = 'closed' THEN CURRENT_TIMESTAMP ELSE resolved_at END
      WHERE id = $3
      RETURNING *
    `,
      [status, priority, params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Send automated status update message
    await sendTicketStatusUpdateMessage(Number.parseInt(params.id), status, adminName)

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Update ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
