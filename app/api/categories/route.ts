import { NextResponse } from "next/server"
import pool from "@/lib/db"

export async function GET() {
  try {
    console.log("Categories API: Starting request")

    // First, check if categories table exists and create it if it doesn't
    try {
      const result = await pool.query(`
        SELECT id, name, description, color
        FROM categories
        ORDER BY name
      `)

      console.log("Categories API: Found categories:", result.rows.length)
      return NextResponse.json(result.rows)
    } catch (error: any) {
      console.log("Categories API: Table might not exist, creating it...")

      // Create categories table if it doesn't exist
      await pool.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          color VARCHAR(32) DEFAULT '#6B7280',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `)

      // Insert default categories
      await pool.query(`
        INSERT INTO categories (name, description, color) VALUES
        ('Technical Support', 'Technical issues and troubleshooting', '#3B82F6'),
        ('Billing', 'Billing and payment related inquiries', '#10B981'),
        ('General', 'General questions and support', '#6B7280'),
        ('Feature Request', 'Requests for new features or improvements', '#8B5CF6'),
        ('Bug Report', 'Report bugs and issues with the product', '#EF4444')
        ON CONFLICT DO NOTHING
      `)

      // Return the newly created categories
      const newResult = await pool.query(`
        SELECT id, name, description, color
        FROM categories
        ORDER BY name
      `)

      console.log("Categories API: Created and returning categories:", newResult.rows.length)
      return NextResponse.json(newResult.rows)
    }
  } catch (error: any) {
    console.error("Categories API: Error:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch categories",
        details: error.message,
        categories: [], // Return empty array as fallback
      },
      { status: 500 },
    )
  }
}
