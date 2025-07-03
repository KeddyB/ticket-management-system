import pool from "./db"

export async function sendAutomatedWelcomeMessage(ticketId: number) {
  try {
    const welcomeMessage = `Thank you for contacting our support team! 

We've received your ticket and it has been assigned to one of our specialists. Here's what happens next:

🔍 **Review**: Our team will review your request within the next few hours
⚡ **Response**: You'll receive an initial response within 24 hours  
💬 **Updates**: We'll keep you informed of any progress right here in this chat

Feel free to add any additional information or ask questions anytime. We're here to help!

Best regards,
Support Team`

    await pool.query(
      `
      INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal, created_at)
      VALUES ($1, NULL, $2, false, CURRENT_TIMESTAMP)
    `,
      [ticketId, welcomeMessage],
    )

    console.log(`Automated welcome message sent for ticket ${ticketId}`)
  } catch (error) {
    console.error("Error sending automated welcome message:", error)
  }
}

export async function sendTicketStatusUpdateMessage(ticketId: number, status: string, adminName: string) {
  try {
    let message = ""

    switch (status) {
      case "in_progress":
        message = `📋 **Status Update**

Your ticket is now being actively worked on by ${adminName}. We'll keep you updated on our progress.`
        break
      case "resolved":
        message = `✅ **Ticket Resolved**

Great news! ${adminName} has marked your ticket as resolved. 

If this resolves your issue, no further action is needed. If you need additional help or have follow-up questions, please let us know and we'll be happy to assist further.`
        break
      case "closed":
        message = `🔒 **Ticket Closed**

This ticket has been closed by ${adminName}. 

If you need further assistance with this issue or have new questions, please feel free to submit a new support ticket.

Thank you for using our support service!`
        break
    }

    if (message) {
      await pool.query(
        `
        INSERT INTO ticket_comments (ticket_id, admin_id, comment, is_internal, created_at)
        VALUES ($1, NULL, $2, false, CURRENT_TIMESTAMP)
      `,
        [ticketId, message],
      )

      console.log(`Automated status update message sent for ticket ${ticketId}`)
    }
  } catch (error) {
    console.error("Error sending automated status update message:", error)
  }
}
