import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { autoAssignTicket } from "@/lib/ticket-router"
import { verifyToken } from "@/lib/auth"

// Admin-only endpoint for creating tickets from the dashboard
export async function POST(request: NextRequest) {
  try {
    console.log("Admin Tickets API POST: Starting request")

    // Get token from cookie or Authorization header
    let token = request.cookies.get("auth-token")?.value

    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    if (!token) {
      console.log("Admin Tickets API POST: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("Admin Tickets API POST: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("Admin Tickets API POST: Authenticated admin:", decoded.email)

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

    console.log("Admin Tickets API POST: Ticket created successfully")
    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Admin create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
