import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    //console.log("Customer Ticket API: Starting GET request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      //console.log("Customer Ticket API: Invalid ticket ID format:", params.id)
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
      //console.log("Customer Ticket API: Categories table not found, using fallback")
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
      //console.log("Customer Ticket API: Ticket not found:", params.id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = result.rows[0]
    //console.log("Customer Ticket API: Found ticket:", ticket.id)

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
    console.error("Customer Ticket API GET error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
