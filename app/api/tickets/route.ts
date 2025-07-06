import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"
import { autoAssignTicket } from "@/lib/ticket-router"
import { sendAutomatedWelcomeMessage } from "@/lib/automated-messages"

// Function to generate random ticket ID
function generateTicketId(): string {
  return Math.random().toString().slice(2, 12) // 10 digit random number
}

export async function GET(request: NextRequest) {
  try {
    console.log("Tickets API: Starting GET request")

    const token = extractTokenFromRequest(request)
    if (!token) {
      console.log("Tickets API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("Tickets API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("Tickets API: Authenticated admin:", decoded.email, "ID:", decoded.id)

    // First try with categories table
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
          t.resolved_at,
          c.name as category_name,
          c.color as category_color,
          a.name as assigned_admin_name
        FROM tickets t
        LEFT JOIN categories c ON t.category_id = c.id
        LEFT JOIN admins a ON t.assigned_admin_id = a.id
        WHERE t.assigned_admin_id = $1
        ORDER BY t.created_at DESC
      `,
        [decoded.id],
      )
      console.log("Tickets API: Query with categories successful, found tickets:", result.rows.length)
    } catch (categoryError) {
      console.log("Tickets API: Categories table not found, using fallback query")
      // Fallback query without categories
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
          t.resolved_at,
          a.name as assigned_admin_name
        FROM tickets t
        LEFT JOIN admins a ON t.assigned_admin_id = a.id
        WHERE t.assigned_admin_id = $1
        ORDER BY t.created_at DESC
      `,
        [decoded.id],
      )
      console.log("Tickets API: Fallback query successful, found tickets:", result.rows.length)
    }

    const tickets = result.rows.map((ticket) => ({
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
      resolved_at: ticket.resolved_at,
    }))

    console.log("Tickets API: Returning tickets:", tickets.length)
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Tickets API error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Tickets API: Starting POST request")

    const {
      title,
      description,
      priority = "medium",
      customer_name,
      customer_email,
      customer_phone,
      category_id,
    } = await request.json()

    if (!title || !description || !customer_name || !customer_email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    console.log("Tickets API: Creating ticket:", { title, customer_email, category_id })

    // Generate random ticket ID
    let ticketId = generateTicketId()

    // Ensure uniqueness (retry if ID already exists)
    let attempts = 0
    while (attempts < 5) {
      try {
        const existingTicket = await pool.query("SELECT id FROM tickets WHERE id = $1", [ticketId])
        if (existingTicket.rows.length === 0) {
          break // ID is unique
        }
        ticketId = generateTicketId()
        attempts++
      } catch (error) {
        break // If table doesn't exist yet, the ID is definitely unique
      }
    }

    // Auto-assign ticket to admin based on category
    let assignedAdminId = null
    if (category_id) {
      try {
        assignedAdminId = await autoAssignTicket(Number.parseInt(category_id.toString()))
        console.log("Tickets API: Auto-assigned to admin:", assignedAdminId)
      } catch (error) {
        console.error("Tickets API: Auto-assignment failed:", error)
        // Continue without assignment if auto-assignment fails
      }
    }

    const result = await pool.query(
      `
      INSERT INTO tickets (id, title, description, priority, customer_name, customer_email, customer_phone, category_id, assigned_admin_id, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
      RETURNING *
    `,
      [
        ticketId,
        title,
        description,
        priority,
        customer_name,
        customer_email,
        customer_phone,
        category_id,
        assignedAdminId,
      ],
    )

    const newTicket = result.rows[0]
    console.log("Tickets API: Ticket created with ID:", newTicket.id, "assigned to:", assignedAdminId)

    // Send automated welcome message (don't wait for it)
    try {
      await sendAutomatedWelcomeMessage(ticketId)
      console.log("Tickets API: Welcome message sent for ticket:", ticketId)
    } catch (error) {
      console.error("Tickets API: Failed to send welcome message:", error)
      // Don't fail the ticket creation if welcome message fails
    }

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
