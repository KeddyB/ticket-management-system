// GET – fetch ticket details
import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"
import { sendStatusChangeMessage } from "@/lib/automated-messages"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Ticket API: Starting GET request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      console.log("Ticket API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // Try with categories first, fallback without
    let result
    try {
      result = await pool.query(
        `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.customer_name,
          t.customer_email,
          t.customer_phone,
          t.assigned_admin_id,
          t.created_at,
          t.updated_at,
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
    } catch (error) {
      console.log("Ticket API: Categories table not found, using fallback")
      result = await pool.query(
        `
        SELECT 
          t.id,
          t.title,
          t.description,
          t.status,
          t.priority,
          t.customer_name,
          t.customer_email,
          t.customer_phone,
          t.assigned_admin_id,
          t.created_at,
          t.updated_at,
          a.name as assigned_admin_name
        FROM tickets t
        LEFT JOIN admins a ON t.assigned_admin_id = a.id
        WHERE t.id = $1
      `,
        [params.id],
      )
    }

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = result.rows[0]
    console.log("Ticket API: Found ticket:", ticket.id)

    const formattedTicket = {
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
      customer_phone: ticket.customer_phone,
      assigned_admin_id: ticket.assigned_admin_id,
      assigned_admin_name: ticket.assigned_admin_name,
      category_name: ticket.category_name || "General",
      category_color: ticket.category_color || "#6B7280",
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
    }

    return NextResponse.json(formattedTicket)
  } catch (error) {
    console.error("Ticket API GET error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

// PUT – update status, assignment, or priority
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log("Ticket API: Starting PUT request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      console.log("Ticket API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    const token = extractTokenFromRequest(request)
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const body = await request.json()
    console.log("Ticket API: Update data:", body)

    const { status, assigned_admin_id, priority, title, description } = body

    // Get current ticket status for automated messages
    let oldStatus = null
    if (status !== undefined) {
      const currentTicket = await pool.query("SELECT status FROM tickets WHERE id = $1", [params.id])
      if (currentTicket.rows.length > 0) {
        oldStatus = currentTicket.rows[0].status
      }
    }

    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 1

    if (status !== undefined) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }

    if (assigned_admin_id !== undefined) {
      updates.push(`assigned_admin_id = $${paramCount}`)
      values.push(assigned_admin_id)
      paramCount++
    }

    if (priority !== undefined) {
      updates.push(`priority = $${paramCount}`)
      values.push(priority)
      paramCount++
    }

    if (title !== undefined) {
      updates.push(`title = $${paramCount}`)
      values.push(title)
      paramCount++
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`)
      values.push(description)
      paramCount++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    // Add updated_at
    updates.push(`updated_at = $${paramCount}`)
    values.push(new Date().toISOString())
    paramCount++

    // Add resolved_at if status is resolved
    if (status === "resolved") {
      updates.push(`resolved_at = $${paramCount}`)
      values.push(new Date().toISOString())
      paramCount++
    }

    // Add ticket ID for WHERE clause
    values.push(params.id)

    const query = `
      UPDATE tickets 
      SET ${updates.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `

    console.log("Ticket API: Executing query:", query)
    console.log("Ticket API: With values:", values)

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const updatedTicket = result.rows[0]
    console.log("Ticket API: Updated ticket:", updatedTicket.id)

    // Send automated status change message if status changed
    if (status !== undefined && oldStatus && oldStatus !== status) {
      try {
        await sendStatusChangeMessage(params.id, oldStatus, status)
        console.log("Ticket API: Status change message sent")
      } catch (error) {
        console.error("Ticket API: Failed to send status change message:", error)
        // Don't fail the update if automated message fails
      }
    }

    return NextResponse.json(updatedTicket)
  } catch (error) {
    console.error("Ticket API PUT error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
