import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    // Hash the password 'admin123'
    const passwordHash = await bcrypt.hash("admin123", 10)

    // Update all demo accounts with the correct password hash
    await sql`
      UPDATE admins 
      SET password_hash = ${passwordHash}
      WHERE email IN ('john@company.com', 'sarah@company.com', 'mike@company.com', 'tech@company.com')
    `

    return NextResponse.json({
      message: "Demo accounts updated successfully",
      credentials: {
        email: "tech@company.com",
        password: "admin123",
      },
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Failed to setup demo accounts" }, { status: 500 })
  }
}
