import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { autoAssignTicket } from "@/lib/ticket-router"
import { verifyToken } from "@/lib/auth"
import { sendAutomatedWelcomeMessage } from "@/lib/automated-messages"

export async function GET(request: NextRequest) {
  try {
    console.log("Tickets API: Starting GET request")

    // Get token from cookie or Authorization header
    let token = request.cookies.get("auth-token")?.value

    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    console.log("Tickets API: Token present:", !!token)

    if (!token) {
      console.log("Tickets API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      console.log("Tickets API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    console.log("Tickets API: Token verified for admin:", decoded.email, "category_id:", decoded.category_id)

    // First, let's check what tickets exist in the database
    const allTicketsResult = await pool.query("SELECT id, title, category_id FROM tickets ORDER BY created_at DESC")
    console.log("Tickets API: All tickets in database:", allTicketsResult.rows)

    // Check what categories exist
    const categoriesResult = await pool.query("SELECT id, name FROM categories")
    console.log("Tickets API: All categories:", categoriesResult.rows)

    // Get tickets for admin's category (or all tickets if admin has no specific category)
    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.assigned_admin_id = a.id
    `

    let params: any[] = []

    // If admin has a specific category, filter by it, otherwise show all tickets
    if (decoded.category_id) {
      query += " WHERE t.category_id = $1"
      params = [decoded.category_id]
      console.log("Tickets API: Filtering by category_id:", decoded.category_id)
    } else {
      console.log("Tickets API: Admin has no specific category, showing all tickets")
    }

    query += " ORDER BY t.created_at DESC"

    const result = await pool.query(query, params)

    console.log("Tickets API: Query executed:", query)
    console.log("Tickets API: Query params:", params)
    console.log("Tickets API: Found tickets:", result.rows.length)
    console.log(
      "Tickets API: Ticket details:",
      result.rows.map((t) => ({
        id: t.id,
        title: t.title,
        category_id: t.category_id,
        category_name: t.category_name,
      })),
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("Tickets API POST: Starting request")

    const {
      title,
      description,
      customer_name,
      customer_email,
      customer_phone,
      category_id,
      priority = "medium",
    } = await request.json()

    console.log("Tickets API POST: Request data:", {
      title,
      customer_name,
      customer_email,
      category_id,
      priority,
    })

    if (!title || !description || !customer_name || !customer_email || !category_id) {
      console.log("Tickets API POST: Missing required fields")
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if this is an admin request (has token) or public request (no token)
    let token = request.cookies.get("auth-token")?.value
    if (!token) {
      const authHeader = request.headers.get("authorization")
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7)
      }
    }

    let isAdminRequest = false
    if (token) {
      const decoded = await verifyToken(token)
      if (decoded) {
        isAdminRequest = true
        console.log("Tickets API POST: Admin request from:", decoded.email)
      }
    }

    if (!isAdminRequest) {
      console.log("Tickets API POST: Public ticket submission")
    }

    // Auto-assign ticket to admin
    const assignedAdminId = await autoAssignTicket(category_id)
    console.log("Tickets API POST: Auto-assigned to admin ID:", assignedAdminId)

    const result = await pool.query(
      `
      INSERT INTO tickets (title, description, customer_name, customer_email, customer_phone, category_id, assigned_admin_id, priority)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
      [title, description, customer_name, customer_email, customer_phone, category_id, assignedAdminId, priority],
    )

    const newTicket = result.rows[0]
    console.log("Tickets API POST: Ticket created successfully with ID:", newTicket.id)

    // Send automated welcome message for public submissions
    if (!isAdminRequest) {
      await sendAutomatedWelcomeMessage(newTicket.id)
    }

    return NextResponse.json(newTicket, { status: 201 })
  } catch (error) {
    console.error("Create ticket error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
