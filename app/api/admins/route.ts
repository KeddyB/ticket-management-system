import { type NextRequest, NextResponse } from "next/server"
import pool from "@/lib/db"
import { hashPassword, verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // Only allow super admins or specific roles to view all admins
    const result = await pool.query(
      `SELECT a.id, a.email, a.name, a.role, a.category_id, a.is_active, a.created_at, c.name as category_name
       FROM admins a 
       LEFT JOIN categories c ON a.category_id = c.id 
       ORDER BY a.created_at DESC`,
    )

    return NextResponse.json(result.rows)
  } catch (error) {
    console.error("Get admins error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("auth-token")?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    const { email, password, name, category_id, role = "admin" } = await request.json()

    if (!email || !password || !name || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if admin already exists
    const existingAdmin = await pool.query("SELECT id FROM admins WHERE email = $1", [email])
    if (existingAdmin.rows.length > 0) {
      return NextResponse.json({ error: "Admin with this email already exists" }, { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create new admin
    const result = await pool.query(
      `INSERT INTO admins (email, password_hash, name, category_id, role, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id, email, name, role, category_id, is_active, created_at`,
      [email, hashedPassword, name, category_id, role],
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error) {
    console.error("Create admin error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
