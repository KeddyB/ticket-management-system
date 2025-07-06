import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const tickets = await sql`
      SELECT 
        t.id,
        t.title,
        t.description,
        t.status,
        t.priority,
        t.customer_name,
        t.customer_email,
        t.created_at,
        c.name as category_name,
        a.name as assigned_admin_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      LEFT JOIN admins a ON t.assigned_admin_id = a.id
      ORDER BY t.created_at DESC
      LIMIT 10
    `

    const admins = await sql`
      SELECT id, name, email FROM admins ORDER BY name
    `

    const categories = await sql`
      SELECT id, name FROM categories ORDER BY name
    `

    return NextResponse.json({
      tickets,
      admins,
      categories,
      total_tickets: tickets.length,
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({ error: "Failed to fetch debug data", details: error }, { status: 500 })
  }
}
