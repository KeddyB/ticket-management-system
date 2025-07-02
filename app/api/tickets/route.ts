import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { autoAssignTicket } from "@/lib/ticket-router"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Get tickets for admin's category
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
      WHERE t.category_id = $1
      ORDER BY t.created_at DESC
    `,
      [decoded.category_id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const {
      title,
      description,
      customer_name,
      customer_email,
      customer_phone,
      category_id,
      priority = "medium",
    } = await request.json()

    if (!title || !description || !customer_name || !customer_email || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Auto-assign ticket to admin
    const assignedAdminId = await autoAssignTicket(category_id)

    const result = await pool.query(
      `
      INSERT INTO tickets (title, description, customer_name, customer_email, customer_phone, category_id, assigned_admin_id, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [title, description, customer_name, customer_email, customer_phone, category_id, assignedAdminId, priority],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
