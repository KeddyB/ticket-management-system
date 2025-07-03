import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    // Get all tickets with their categories
    const ticketsResult = await pool.query(`
      SELECT 
        t.id,
        t.title,
        t.customer_name,
        t.category_id,
        t.status,
        t.priority,
        t.created_at,
        c.name as category_name
      FROM tickets t
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.created_at DESC
    `)

    // Get all categories
    const categoriesResult = await pool.query("SELECT * FROM categories ORDER BY id")

    // Get all admins
    const adminsResult = await pool.query(`
      SELECT 
        id,
        email,
        name,
        category_id,
        is_active
      FROM admins 
      ORDER BY id
    `)

    return NextResponse.json({
      tickets: ticketsResult.rows,
      categories: categoriesResult.rows,
      admins: adminsResult.rows,
      summary: {
        totalTickets: ticketsResult.rows.length,
        totalCategories: categoriesResult.rows.length,
        totalAdmins: adminsResult.rows.length,
        ticketsByCategory: ticketsResult.rows.reduce((acc: any, ticket: any) => {
          acc[ticket.category_id] = (acc[ticket.category_id] || 0) + 1
          return acc
        }, {}),
      },
    })
  } catch (error) {
    console.error("Debug tickets error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
