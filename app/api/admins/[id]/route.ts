import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { verifyToken, hashPassword } from "@/lib/auth"

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { email, name, category_id, role, is_active, password } = await request.json()

    let query = `UPDATE admins SET email = $1, name = $2, category_id = $3, role = $4, is_active = $5`
    const values = [email, name, category_id, role, is_active]

    // If password is provided, hash it and include in update
    if (password) {
      const hashedPassword = await hashPassword(password)
      query += `, password_hash = $6`
      values.push(hashedPassword)
    }

    query += ` WHERE id = $${values.length + 1} RETURNING id, email, name, role, category_id, is_active`
    values.push(params.id)

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json(result.rows[0])
  } catch (error) {
    console.error("Update admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Don't allow deleting yourself
    if (decoded.id === Number.parseInt(params.id)) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 })
    }

    const result = await pool.query("DELETE FROM admins WHERE id = $1 RETURNING id", [params.id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Admin not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Admin deleted successfully" })
  } catch (error) {
    console.error("Delete admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
