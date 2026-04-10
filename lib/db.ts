import { sql } from "@vercel/postgres"

// Re-export the sql tagged template literal for use throughout the app.
// Usage: import { sql } from "@/lib/db"
// Example: const { rows } = await sql`SELECT * FROM users WHERE id = ${id}`
export { sql }
