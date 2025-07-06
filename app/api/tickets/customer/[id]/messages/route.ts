import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    //console.log("Customer Messages API: Starting GET request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      //console.log("Customer Messages API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // Verify ticket exists first
    const ticketCheck = await pool.query("SELECT id FROM tickets WHERE id = $1", [params.id])
    if (ticketCheck.rows.length === 0) {
      //console.log("Customer Messages API: Ticket not found:", params.id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    // Get messages from ticket_comments table, excluding internal messages
    const result = await pool.query(
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
      WHERE tc.ticket_id = $1 AND (tc.is_internal = false OR tc.is_internal IS NULL)
      ORDER BY tc.created_at ASC
    `,
      [params.id],
    )

    //console.log("Customer Messages API: Found messages:", result.rows.length)

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
        console.error("Customer Messages API: Error parsing attachments for message", row.id, parseError)
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

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Customer Messages API error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    //console.log("Customer Messages API: Starting POST request for ticket:", params.id)

    // Validate ticket ID format
    if (!params.id || !/^\d+$/.test(params.id)) {
      //console.log("Customer Messages API: Invalid ticket ID format:", params.id)
      return NextResponse.json({ error: "Invalid ticket ID" }, { status: 400 })
    }

    // Parse request body with error handling
    let requestBody
    try {
      requestBody = await request.json()
    } catch (parseError) {
      console.error("Customer Messages API: Error parsing request body:", parseError)
      return NextResponse.json({ error: "Invalid JSON in request body" }, { status: 400 })
    }

    const { message, customer_name, customer_email, attachments = [] } = requestBody

    if (!message?.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    //console.log("Customer Messages API: Message content:", message.substring(0, 100) + "...")
    //console.log("Customer Messages API: Attachments count:", attachments.length)

    // Verify ticket exists
    const ticketCheck = await pool.query("SELECT id, customer_name, customer_email FROM tickets WHERE id = $1", [
      params.id,
    ])
    if (ticketCheck.rows.length === 0) {
      //console.log("Customer Messages API: Ticket not found:", params.id)
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 })
    }

    const ticket = ticketCheck.rows[0]

    // Safely stringify attachments
    let attachmentsJson = "[]"
    try {
      attachmentsJson = JSON.stringify(attachments || [])
    } catch (stringifyError) {
      console.error("Customer Messages API: Error stringifying attachments:", stringifyError)
      attachmentsJson = "[]"
    }

    // Insert the customer message
    const result = await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, attachments, is_internal, customer_name, customer_email)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
      [
        params.id, // String ticket ID
        null, // admin_id is null for customer messages
        message.trim(),
        attachmentsJson,
        false, // customer messages are never internal
        customer_name || ticket.customer_name,
        customer_email || ticket.customer_email,
      ],
    )

    const newMessage = result.rows[0]
    //console.log("Customer Messages API: Message created with ID:", newMessage.id)

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
      console.error("Customer Messages API: Error parsing response attachments:", parseError)
      responseAttachments = []
    }

    // Return the formatted message
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
      admin_name: null,
      admin_email: null,
      sender_type: "customer",
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error("Customer Messages API POST error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}
