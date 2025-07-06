import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminId = Number.parseInt(params.id)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    const result = await sql`
      SELECT id, name, email, role, category_id, is_active, created_at, updated_at
      FROM admins
      WHERE id = ${adminId}
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminId = Number.parseInt(params.id)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    const { name, email, password, role, category_id, is_active, currentPassword } = await request.json()

    // If changing password, verify current password first
    if (password && currentPassword) {
      const currentAdminResult = await sql`
        SELECT password_hash FROM admins WHERE id = ${adminId}
      `

      if (currentAdminResult.length === 0) {
        return NextResponse.json({ error: "Admin not found" }, { status: 404 })
      }

      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentAdminResult[0].password_hash)
      if (!isCurrentPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 })
      }
    }

    // Build update query dynamically
    const updateFields = []
    const values = []

    if (name !== undefined) {
      updateFields.push("name = $" + (values.length + 1))
      values.push(name)
    }

    if (email !== undefined) {
      updateFields.push("email = $" + (values.length + 1))
      values.push(email)
    }

    if (password) {
      // Only update password if provided
      const passwordHash = await bcrypt.hash(password, 10)
      updateFields.push("password_hash = $" + (values.length + 1))
      values.push(passwordHash)
    }

    if (role !== undefined) {
      updateFields.push("role = $" + (values.length + 1))
      values.push(role)
    }

    // Handle category_id explicitly for null/undefined
    if (category_id !== undefined) {
      updateFields.push("category_id = $" + (values.length + 1))
      values.push(category_id === "" ? null : category_id) // Convert empty string to null for DB
    }

    if (is_active !== undefined) {
      updateFields.push("is_active = $" + (values.length + 1))
      values.push(is_active)
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 })
    }

    updateFields.push("updated_at = CURRENT_TIMESTAMP")
    values.push(adminId) // The last value is for the WHERE clause

    const result = await sql`
      UPDATE admins 
      SET ${sql.unsafe(updateFields.join(", "))}
      WHERE id = ${adminId}
      RETURNING id, name, email, role, category_id, is_active, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminId = Number.parseInt(params.id)
    if (isNaN(adminId)) {
      return NextResponse.json({ error: "Invalid admin ID" }, { status: 400 })
    }

    // Prevent self-deletion
    if (admin.id === adminId) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM admins 
      WHERE id = ${adminId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ message: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Admin deleted successfully" })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to delete admin" }, { status: 500 })
  }
}
