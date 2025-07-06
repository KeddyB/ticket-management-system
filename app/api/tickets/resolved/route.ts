import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    //console.log("Resolved Tickets API: Starting request")

    const token = extractTokenFromRequest(request)
    //console.log("Resolved Tickets API: Token present:", !!token)

    if (!token) {
      //console.log("Resolved Tickets API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      //console.log("Resolved Tickets API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    //console.log("Resolved Tickets API: Token verified for admin:", decoded.email, "category_id:", decoded.category_id)

    // Get resolved tickets for admin's category (or all tickets if admin has no specific category)
    let query = `
      SELECT 
        t.*,
        c.name as category_name,
        c.color as category_color,
        a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.assigned_admin_id = a.id
      WHERE t.status IN ('closed', 'resolved')
    `

    let params: any[] = []

    // If admin has a specific category, filter by it, otherwise show all resolved tickets
    if (decoded.category_id) {
      query += " AND t.category_id = $1"
      params = [decoded.category_id]
      //console.log("Resolved Tickets API: Filtering by category_id:", decoded.category_id)
    } else {
      //console.log("Resolved Tickets API: Admin has no specific category, showing all resolved tickets")
    }

    query += " ORDER BY t.resolved_at DESC, t.updated_at DESC"

    const result = await pool.query(query, params)

    //console.log("Resolved Tickets API: Found resolved tickets:", result.rows.length)

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get resolved tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
