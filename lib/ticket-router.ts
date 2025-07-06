import pool from "./db"

export async function autoAssignTicket(categoryId: number): Promise<number | null> {
  try {
    //console.log("Auto-assigning ticket for category:", categoryId)

    // First, try to find an admin specifically assigned to this category
    const categoryAdminResult = await pool.query(
      "SELECT id FROM admins WHERE category_id = $1 AND is_active = true ORDER BY RANDOM() LIMIT 1",
      [categoryId],
    )

    if (categoryAdminResult.rows.length > 0) {
      const adminId = categoryAdminResult.rows[0].id
      //console.log("Assigned to category-specific admin:", adminId)
      return adminId
    }

    // If no category-specific admin, assign to any active admin
    const anyAdminResult = await pool.query("SELECT id FROM admins WHERE is_active = true ORDER BY RANDOM() LIMIT 1")

    if (anyAdminResult.rows.length > 0) {
      const adminId = anyAdminResult.rows[0].id
      //console.log("Assigned to general admin:", adminId)
      return adminId
    }

    //console.log("No active admins found for assignment")
    return null
  } catch (error) {
    console.error("Error in autoAssignTicket:", error)
    return null
  }
}

export function getTicketIdFromPath(request: Request): string | null {
  const url = new URL(request.url)
  const pathname = url.pathname
  const segments = pathname.split("/")

  // Handle different patterns:
  // /api/tickets/[id]
  // /api/tickets/[id]/comments
  // /api/tickets/[id]/assign
  const ticketIndex = segments.indexOf("tickets")
  if (ticketIndex !== -1 && segments[ticketIndex + 1]) {
    return segments[ticketIndex + 1]
  }

  return null
}

export function isValidTicketId(id: string): boolean {
  return /^\d+$/.test(id)
}
