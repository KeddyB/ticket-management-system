import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken } from "@/lib/auth"

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

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { assigned_admin_id, reason } = await request.json()

    if (!assigned_admin_id) {
      return NextResponse.json({ error: "Admin ID is required" }, { status: 400 })
    }

    // Update the ticket assignment
    const result = await pool.query(
      `
      UPDATE tickets 
      SET assigned_admin_id = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `,
      [assigned_admin_id, params.id],
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Add a comment about the forwarding
    if (reason) {
      await pool.query(
        `
        INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal)
        VALUES ($1, $2, $3, true)
      `,
        [params.id, decoded.id, `Ticket forwarded: ${reason}`],
      )
    }

    // Get the updated ticket with admin details
    const updatedTicket = await pool.query(
      `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.assigned_admin_id = a.id
      WHERE t.id = $1
    `,
      [params.id],
    )

    return NextResponse.json(updatedTicket.rows[0])
  } catch (error) {
    console.error("Assign ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
