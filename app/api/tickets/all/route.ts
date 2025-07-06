import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    //console.log("All Tickets API: Starting GET request")

    const token = extractTokenFromRequest(request)
    //console.log("All Tickets API: Token present:", !!token)

    if (!token) {
      //console.log("All Tickets API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      //console.log("All Tickets API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    //console.log("All Tickets API: Token verified for admin:", decoded.email)

    // Get ALL tickets in the database (for admin overview)
    let query = `
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
      ORDER BY t.created_at DESC
    `

    // Try with categories first, fallback without
    let result
    try {
      query = `
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
        ORDER BY t.created_at DESC
      `
      result = await pool.query(query)
      //console.log("All Tickets API: Query with categories successful")
    } catch (error) {
      //console.log("All Tickets API: Categories table not found, using fallback")
      query = `
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
        ORDER BY t.created_at DESC
      `
      result = await pool.query(query)
    }

    //console.log("All Tickets API: Found total tickets:", result.rows.length)

    // Transform the data to match frontend expectations
    const tickets = result.rows.map((ticket) => ({
      id: ticket.id,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      priority: ticket.priority,
      category: ticket.category_name || "Uncategorized",
      customer_name: ticket.customer_name,
      customer_email: ticket.customer_email,
      customer_phone: ticket.customer_phone,
      assigned_admin_id: ticket.assigned_admin_id,
      assigned_admin_name: ticket.assigned_admin_name,
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      category_name: ticket.category_name,
      category_color: ticket.category_color,
    }))

    //console.log("All Tickets API: Returning all tickets:", tickets.length)
    return NextResponse.json(tickets)
  } catch (error) {
    console.error("Get all tickets error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
