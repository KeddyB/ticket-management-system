import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get all messages for this ticket (excluding internal ones for customers)
    const result = await pool.query(
      `
      SELECT 
        tc.*,
        a.name as admin_name,
        a.email as admin_email
      FROM ticket_comments tc
      LEFT JOIN admins a ON tc.admin_id = a.id
      WHERE tc.ticket_id = $1
      ORDER BY tc.created_at ASC
    `,
      [params.id],
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get customer messages error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { message, customer_name, customer_email, attachments = [] } = await request.json()

    if (!message && (!attachments || attachments.length === 0)) {
      return NextResponse.json({ error: "Message or attachment is required" }, { status: 400 })
    }

    // Insert the customer message (admin_id is null for customer messages)
    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal, attachments, customer_name, customer_email)
      VALUES ($1, NULL, $2, false, $3, $4, $5)
      RETURNING *
    `,
      [params.id, message || "", JSON.stringify(attachments), customer_name, customer_email],
    )

    // Update ticket's updated_at timestamp
    await pool.query("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [params.id])

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Create customer message error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
