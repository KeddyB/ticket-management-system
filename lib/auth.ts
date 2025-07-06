import { SignJWT, jwtVerify } from "jose"
import type { NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"
import bcrypt from "bcryptjs"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")

export interface Admin {
  id: number
  email: string
  name: string
  role: string
  category_id?: number | null
}

export async function generateToken(admin: Admin): Promise<string> {
  return await new SignJWT({
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    category_id: admin.category_id,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string | null): Promise<Admin | null> {
  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return {
      id: payload.id as number,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as string,
      category_id: payload.category_id as number | null,
    }
  } catch (error) {
    console.error("Token verification failed:", error)
    return null
  }
}

export function extractTokenFromRequest(request: NextRequest): string | null {
  // 1️⃣ Try the Authorization header first
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7)
  }

  // 2️⃣ Fall back to the auth-token cookie on the incoming request
  // (use the *request* object – not the global `cookies()` helper)
  const cookieToken = request.cookies.get("auth-token")?.value
  if (cookieToken) {
    return cookieToken
  }

  // No token found
  return null
}

export async function authenticateAdmin(email: string, password: string): Promise<Admin | null> {
  try {
    const result = await sql`
      SELECT id, email, name, role, password_hash, category_id
      FROM admins 
      WHERE email = ${email}
    `

    if (result.length === 0) {
      return null
    }

    const admin = result[0]
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)

    if (!isValidPassword) {
      return null
    }

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
      category_id: admin.category_id,
    }
  } catch (error) {
    console.error("Authentication error:", error)
    return null
  }
}
