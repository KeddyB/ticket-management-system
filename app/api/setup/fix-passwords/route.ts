import { NextResponse } from "next/server"
import pool from "@/lib/db"
import bcrypt from "bcryptjs"

export async function POST() {
  try {
    // Hash the password 'admin123' properly
    const passwordHash = await bcrypt.hash("admin123", 10)

    // First, let's see what admins exist
    const existingAdmins = await pool.query("SELECT id, email, name FROM admins")
    console.log("Existing admins:", existingAdmins.rows)

    // Update all admin passwords
    const updateResult = await pool.query(
      "UPDATE admins SET password_hash = $1 WHERE email IN ('tech@company.com', 'john@company.com', 'sarah@company.com', 'mike@company.com', 'billing@company.com', 'general@company.com', 'bugs@company.com', 'features@company.com')",
      [passwordHash],
    )


    // If no rows were updated, create a test admin
    if (updateResult.rowCount === 0) {
      console.log("No existing admins found, creating test admin...")

      // Ensure admins table exists with proper structure
      await pool.query(`
        CREATE TABLE IF NOT EXISTS admins (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          name VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'admin',
          is_active BOOLEAN DEFAULT true,
          category_id INTEGER,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert test admin
      await pool.query(
        "INSERT INTO admins (email, password_hash, name, role, is_active) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash",
        ["admin@test.com", passwordHash, "Test Admin", "admin", true],
      )

      console.log("Created test admin: admin@test.com")
    }

    // Verify the update worked
    const verifyResult = await pool.query("SELECT email, name, password_hash FROM admins LIMIT 5")
    console.log(
      "Verification - admins after update:",
      verifyResult.rows.map((r) => ({ email: r.email, name: r.name, hasHash: !!r.password_hash })),
    )

    return NextResponse.json({
      message: "Passwords updated successfully",
      updatedRows: updateResult.rowCount,
      testCredentials: {
        email: updateResult.rowCount > 0 ? "tech@company.com" : "admin@test.com",
        password: "admin123",
      },
      availableAccounts: verifyResult.rows.map((r) => r.email),
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        error: "Failed to setup passwords",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
