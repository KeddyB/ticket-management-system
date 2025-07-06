import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = Number.parseInt(params.id)

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // No auth needed for GET comments (customer can view)
    const comments = await sql`
      SELECT 
        c.id,
        c.comment,
        c.created_at,
        c.is_internal, -- Include is_internal
        c.attachments, -- Include attachments
        c.customer_name, -- Include customer_name
        c.customer_email, -- Include customer_email
        a.name as admin_name,
        a.email as admin_email -- Include admin_email
      FROM ticket_comments c -- Use ticket_comments table
      LEFT JOIN admins a ON c.admin_id = a.id
      WHERE c.ticket_id = ${ticketId}
      ORDER BY c.created_at ASC
    `

    return NextResponse.json(comments)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const ticketId = Number.parseInt(params.id)
    const { comment, is_internal = false, attachments = [] } = await request.json()

    if (isNaN(ticketId)) {
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    if (!comment?.trim() && attachments.length === 0) {
      return NextResponse.json({ error: "Comment or attachment is required" }, { status: 400 })
    }

    // Insert the comment
    const result = await sql`
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal, attachments)
      VALUES (${ticketId}, ${admin.id}, ${comment || ""}, ${is_internal}, ${JSON.stringify(attachments)})
      RETURNING id, comment, created_at, is_internal, attachments, admin_id
    `

    // Update ticket's updated_at timestamp
    await sql`
      UPDATE tickets 
      SET updated_at = CURRENT_TIMESTAMP 
      WHERE id = ${ticketId}
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to add comment" }, { status: 500 })
  }
}
