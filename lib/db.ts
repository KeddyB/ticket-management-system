/*
 * Serverless Postgres client backed by HTTP-fetch (works in edge / browser
 * previews).  We expose a minimal `{ query(text, params) }` facade so the
 * rest of the codebase remains unchanged.
 *
 * Docs: https://github.com/neondatabase/serverless
 */
import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL env var is missing")
}

const sql = neon(process.env.DATABASE_URL)

// Keep the pg-style interface used elsewhere
export default {
  // text: 'SELECT * FROM admins WHERE email = $1', params: ['foo@bar.com']
  query: async (text: string, params: any[] = []) => {
    const rows = await (sql as any).unsafe(text, params)
    return { rows }
  },
}
