import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    //console.log("Messages API: Starting GET request for ticket:", params.id)

    // Validate ticket ID format (should be 10 digits for new string IDs)
    if (!params.id || !/^\d+$/.test(params.id)) {
      //console.log("Messages API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // Try to get messages from ticket_comments table
    let result
    try {
      result = await pool.query(
        `
        SELECT 
          tc.id,
          tc.ticket_id,
          tc.admin_id,
          tc.comment,
          tc.attachments,
          tc.is_internal,
          tc.created_at,
          tc.customer_name,
          tc.customer_email,
          a.name as admin_name,
          a.email as admin_email,
          CASE 
            WHEN tc.admin_id IS NOT NULL THEN 'admin'
            ELSE 'customer'
          END as sender_type
        FROM ticket_comments tc
        LEFT JOIN admins a ON tc.admin_id = a.id
        WHERE tc.ticket_id = $1
        ORDER BY tc.created_at ASC
      `,
        [params.id],
      )
      //console.log("Messages API: Found messages:", result.rows.length)
    } catch (error) {
      console.error("Messages API: Error querying ticket_comments:", error)
      return NextResponse.json([], { status: 200 })
    }

    // Transform the data with safe JSON parsing
    const messages = result.rows.map((row) => {
      let attachments = []
      try {
        if (row.attachments) {
          if (typeof row.attachments === "string") {
            attachments = JSON.parse(row.attachments)
          } else if (Array.isArray(row.attachments)) {
            attachments = row.attachments
          }
        }
      } catch (parseError) {
        console.error("Messages API: Error parsing attachments for message", row.id, parseError)
        attachments = []
      }

      return {
        id: row.id,
        ticket_id: row.ticket_id,
        admin_id: row.admin_id,
        comment: row.comment,
        attachments: attachments,
        is_internal: row.is_internal || false,
        created_at: row.created_at,
        customer_name: row.customer_name,
        customer_email: row.customer_email,
        admin_name: row.admin_name,
        admin_email: row.admin_email,
        sender_type: row.sender_type,
      }
    })

    //console.log("Messages API: Returning messages:", messages.length)
    return NextResponse.json(messages)
  } catch (error) {
    console.error("Messages API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    //console.log("Messages API: Starting POST request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      //console.log("Messages API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    const token = extractTokenFromRequest(request)
    if (!token) {
      //console.log("Messages API: No token provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      //console.log("Messages API: Invalid token")
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    //console.log("Messages API: Authenticated admin:", decoded.email, "ID:", decoded.id)

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Messages API: Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { message, attachments = [], is_internal = false } = requestBody

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    //console.log("Messages API: Message content:", message.substring(0, 100) + "...")
    //console.log("Messages API: Attachments count:", attachments.length)

    // Verify ticket exists
    const ticketCheck = await pool.query("SELECT id, customer_name, customer_email FROM tickets WHERE id = $1", [
      params.id,
    ])
    if (ticketCheck.rows.length === 0) {
      //console.log("Messages API: Ticket not found:", params.id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketCheck.rows[0]
    //console.log("Messages API: Found ticket:", ticket.id)

    // Safely stringify attachments
    let attachmentsJson = "[]"
    try {
      attachmentsJson = JSON.stringify(attachments || [])
    } catch (stringifyError) {
      console.error("Messages API: Error stringifying attachments:", stringifyError)
      attachmentsJson = "[]"
    }

    // Insert the admin message
    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, attachments, is_internal, customer_name, customer_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        params.id, // String ticket ID
        decoded.id, // Admin ID from token
        message.trim(),
        attachmentsJson,
        is_internal,
        null, // customer_name is null for admin messages
        null, // customer_email is null for admin messages
      ],
    )

    const newMessage = result.rows[0]
    //console.log("Messages API: Message created with ID:", newMessage.id)

    // Update ticket's updated_at timestamp
    await pool.query("UPDATE tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1", [params.id])

    // Safely parse the stored attachments for response
    let responseAttachments = []
    try {
      if (newMessage.attachments) {
        if (typeof newMessage.attachments === "string") {
          responseAttachments = JSON.parse(newMessage.attachments)
        } else if (Array.isArray(newMessage.attachments)) {
          responseAttachments = newMessage.attachments
        }
      }
    } catch (parseError) {
      console.error("Messages API: Error parsing response attachments:", parseError)
      responseAttachments = []
    }

    // Return the formatted message with admin details
    const formattedMessage = {
      id: newMessage.id,
      ticket_id: newMessage.ticket_id,
      admin_id: newMessage.admin_id,
      comment: newMessage.comment,
      attachments: responseAttachments,
      is_internal: newMessage.is_internal,
      created_at: newMessage.created_at,
      customer_name: newMessage.customer_name,
      customer_email: newMessage.customer_email,
      admin_name: decoded.name || decoded.email, // Use admin name from token
      admin_email: decoded.email,
      sender_type: "admin",
    }

    //console.log("Messages API: Returning formatted message:", formattedMessage.id)
    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error("Messages API POST error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
