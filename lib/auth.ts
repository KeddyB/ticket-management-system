import bcrypt from "bcryptjs"
import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import pool from "./db"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? "your-secret-key")

export interface Admin {
  id: number
  email: string
  name: string
  role: string
  category_id: number
  is_active: boolean
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function generateToken(admin: Admin): Promise<string> {
  return await new SignJWT({
    id: admin.id,
    email: admin.email,
    category_id: admin.category_id,
    role: admin.role,
  } as JWTPayload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" }) // ✅ REQUIRED HEADER
    .setExpirationTime("24h")
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<null | JWTPayload> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ["HS256"] })
    return payload
  } catch {
    return null
  }
}

export async function authenticateAdmin(email: string, password: string): Promise<Admin | null> {
  const result = await pool.query("SELECT * FROM admins WHERE email = $1 AND is_active = true", [email])
  if (result.rows.length === 0) return null
  const admin = result.rows[0]
  const isValid = await verifyPassword(password, admin.password_hash)
  if (!isValid) return null
  return {
    id: admin.id,
    email: admin.email,
    name: admin.name,
    role: admin.role,
    category_id: admin.category_id,
    is_active: admin.is_active,
  }
}
