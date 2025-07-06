import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { autoAssignTicket } from "@/lib/ticket-router"

export async function POST() {
  try {
    console.log("Setup: Starting ticket assignment process")

    // Get all unassigned tickets
    const unassignedTickets = await pool.query("SELECT id, category_id FROM tickets WHERE assigned_admin_id IS NULL")

    console.log("Setup: Found unassigned tickets:", unassignedTickets.rows.length)

    let assignedCount = 0
    let failedCount = 0

    for (const ticket of unassignedTickets.rows) {
      try {
        const adminId = await autoAssignTicket(ticket.category_id || 1)

        if (adminId) {
          await pool.query("UPDATE tickets SET assigned_admin_id = $1 WHERE id = $2", [adminId, ticket.id])
          assignedCount++
          console.log(`Setup: Assigned ticket ${ticket.id} to admin ${adminId}`)
        } else {
          failedCount++
          console.log(`Setup: Failed to assign ticket ${ticket.id} - no available admin`)
        }
      } catch (error) {
        failedCount++
        console.error(`Setup: Error assigning ticket ${ticket.id}:`, error)
      }
    }

    // Get admin count for verification
    const adminCount = await pool.query("SELECT COUNT(*) as count FROM admins WHERE is_active = true")
    const activeAdmins = adminCount.rows[0].count

    return NextResponse.json({
      message: "Ticket assignment completed",
      totalUnassigned: unassignedTickets.rows.length,
      assigned: assignedCount,
      failed: failedCount,
      activeAdmins: activeAdmins,
    })
  } catch (error) {
    console.error("Setup: Ticket assignment error:", error)
    return NextResponse.json(
      {
        error: "Failed to assign tickets",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
