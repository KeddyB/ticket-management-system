import { NextResponse } from "next/server"
import pool from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST() {
  try {
    // Hash the demo password
    const demoPassword = "admin123"
    const hashedPassword = await hashPassword(demoPassword)

    // First, ensure categories exist
    await pool.query(`
      INSERT INTO categories (name, description, color) VALUES
      ('Technical Support', 'Hardware and software technical issues', '#EF4444'),
      ('Billing', 'Payment and billing related inquiries', '#10B981'),
      ('General Inquiry', 'General questions and information requests', '#3B82F6'),
      ('Bug Report', 'Software bugs and issues', '#F59E0B'),
      ('Feature Request', 'New feature suggestions and requests', '#8B5CF6')
      ON CONFLICT (name) DO NOTHING
    `)

    // Delete existing demo accounts to avoid conflicts
    await pool.query(`
      DELETE FROM admins WHERE email IN (
        'tech@company.com', 
        'billing@company.com', 
        'general@company.com', 
        'bugs@company.com', 
        'features@company.com'
      )
    `)

    // Insert demo accounts with properly hashed passwords
    const demoAccounts = [
      { email: "tech@company.com", name: "Tech Support Admin", category_id: 1 },
      { email: "billing@company.com", name: "Billing Admin", category_id: 2 },
      { email: "general@company.com", name: "General Admin", category_id: 3 },
      { email: "bugs@company.com", name: "Bug Report Admin", category_id: 4 },
      { email: "features@company.com", name: "Feature Admin", category_id: 5 },
    ]

    for (const account of demoAccounts) {
      await pool.query(
        `
        INSERT INTO admins (email, password_hash, name, category_id, role, is_active)
        VALUES ($1, $2, $3, $4, 'admin', true)
      `,
        [account.email, hashedPassword, account.name, account.category_id],
      )
    }

    return NextResponse.json({
      message: "Demo accounts created successfully",
      accounts: demoAccounts.map((acc) => ({ email: acc.email, password: demoPassword })),
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      {
        error: "Failed to setup demo accounts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
