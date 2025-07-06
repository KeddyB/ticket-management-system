import pool from "@/lib/db"

const AUTOMATED_MESSAGES = {
  open: "Thank you for contacting us! We have received your ticket and will respond shortly.",
  "in-progress": "Your ticket is now being worked on by our support team. We'll keep you updated on our progress.",
  resolved: "Your ticket has been resolved. If you need further assistance, please don't hesitate to contact us again.",
  closed: "Your ticket has been closed. Thank you for using our support system.",
}

export async function sendAutomatedWelcomeMessage(ticketId: string) {
  try {
    //console.log("Automated Messages: Sending welcome message for ticket:", ticketId)

    // Get the first admin to send the message as
    const adminResult = await pool.query("SELECT id, name, email FROM admins WHERE is_active = true LIMIT 1")

    if (adminResult.rows.length === 0) {
      console.warn("Automated Messages: No active admin found")
      return
    }

    const admin = adminResult.rows[0]
    //console.log("Automated Messages: Using admin:", admin.name || admin.email)

    // Get ticket details for personalization
    const ticketResult = await pool.query("SELECT customer_name FROM tickets WHERE id = $1", [ticketId])

    if (ticketResult.rows.length === 0) {
      console.warn("Automated Messages: Ticket not found:", ticketId)
      return
    }

    const ticket = ticketResult.rows[0]
    const customerName = ticket.customer_name || "Customer"

    const welcomeMessage = `Hello ${customerName},

Thank you for contacting our support team. We have received your ticket and one of our support representatives will review it shortly.

Your ticket number is: ${ticketId}

We aim to respond to all tickets within 24 hours during business days. If your issue is urgent, please don't hesitate to reach out to us directly.

Best regards,
Support Team`

    // Insert the automated message
    await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, attachments, is_internal, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      [ticketId, admin.id, welcomeMessage, JSON.stringify([]), false],
    )

    //console.log("Automated Messages: Welcome message sent successfully")
  } catch (error) {
    console.error("Automated Messages: Failed to send welcome message:", error)
    // Don't throw error - automated messages are not critical
  }
}

export async function sendStatusChangeMessage(ticketId: string, oldStatus: string, newStatus: string) {
  try {
    //console.log("Automated Messages: Sending status change message for ticket:", ticketId)

    // Get the first admin to send the message as
    const adminResult = await pool.query("SELECT id, name, email FROM admins WHERE is_active = true LIMIT 1")

    if (adminResult.rows.length === 0) {
      console.warn("Automated Messages: No active admin found")
      return
    }

    const admin = adminResult.rows[0]

    // Get ticket details for personalization
    const ticketResult = await pool.query("SELECT customer_name FROM tickets WHERE id = $1", [ticketId])

    if (ticketResult.rows.length === 0) {
      console.warn("Automated Messages: Ticket not found:", ticketId)
      return
    }

    const ticket = ticketResult.rows[0]
    const customerName = ticket.customer_name || "Customer"

    let statusMessage = ""

    switch (newStatus) {
      case "in_progress":
        statusMessage = `Hello ${customerName},

Your ticket #${ticketId} is now being worked on by our support team. We'll keep you updated on our progress.

Best regards,
Support Team`
        break
      case "resolved":
        statusMessage = `Hello ${customerName},

Great news! Your ticket #${ticketId} has been resolved. Please review the solution and let us know if you need any further assistance.

If your issue has been fully resolved, no further action is needed. This ticket will be automatically closed in 24 hours.

Best regards,
Support Team`
        break
      case "closed":
        statusMessage = `Hello ${customerName},

Your ticket #${ticketId} has been closed. If you need further assistance with this issue, please feel free to create a new ticket.

Thank you for using our support services.

Best regards,
Support Team`
        break
      default:
        return // Don't send message for other status changes
    }

    // Insert the automated message
    await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, attachments, is_internal, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `,
      [ticketId, admin.id, statusMessage, JSON.stringify([]), false],
    )

    //console.log("Automated Messages: Status change message sent successfully")
  } catch (error) {
    console.error("Automated Messages: Failed to send status change message:", error)
    // Don't throw error - automated messages are not critical
  }
}
