import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyToken, extractTokenFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const admins = await sql`
      SELECT id, name, email, role, category_id, is_active, created_at, updated_at
      FROM admins
      ORDER BY name
    `

    return NextResponse.json(admins)
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Failed to fetch admins" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = extractTokenFromRequest(request)
    // Verify admin authentication
    const admin = token ? await verifyToken(token) : null
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name, email, password, role = "admin", category_id, is_active = true } = await request.json()

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 })
    }

    // Check if admin already exists
    const existingAdmin = await sql`
      SELECT id FROM admins WHERE email = ${email}
    `

    if (existingAdmin.length > 0) {
      return NextResponse.json({ error: "Admin with this email already exists" }, { status: 409 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10)

    // Create new admin
    const result = await sql`
      INSERT INTO admins (name, email, password_hash, role, category_id, is_active)
      VALUES (${name}, ${email}, ${passwordHash}, ${role}, ${category_id || null}, ${is_active})
      RETURNING id, name, email, role, category_id, is_active, created_at
    `

    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Database error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
