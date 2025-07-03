/*
 * Serverless-friendly Postgres helper using the Neon HTTP driver.
 * Keeps the familiar `{ query(text, params) }` API used elsewhere.
 *
 * Docs → https://github.com/neondatabase/serverless
 */
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var is missing")
}

const sql = neon(process.env.DATABASE_URL)

/**
 * pg-compatible wrapper.
 * Example: pool.query('SELECT * FROM admins WHERE email = $1', [email])
 */
export default {
  async query(text: string, params: any[] = []) {
    // neon 0.6+: use `.query()` for conventional text/params calls
    const rows = await sql.query(text, params)
    return { rows }
  },
}
