import pool from "./db"

export async function autoAssignTicket(categoryId: number): Promise<number | null> {
  try {
    // Get all active admins for this category
    const adminResult = await pool.query("SELECT id FROM admins WHERE category_id = $1 AND is_active = true", [
      categoryId,
    ])

    if (adminResult.rows.length === 0) {
      return null
    }

    // Simple round-robin assignment - get admin with least assigned tickets
    const assignmentResult = await pool.query(
      `
      SELECT a.id, COUNT(t.id) as ticket_count
      FROM admins a
      LEFT JOIN tickets t ON a.id = t.assigned_admin_id AND t.status != 'closed'
      WHERE a.category_id = $1 AND a.is_active = true
      GROUP BY a.id
      ORDER BY ticket_count ASC, a.id ASC
      LIMIT 1
    `,
      [categoryId],
    )

    return assignmentResult.rows[0]?.id || null
  } catch (error) {
    console.error("Auto-assignment error:", error)
    return null
  }
}
