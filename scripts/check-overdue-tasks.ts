/**
 * Standalone script to mark overdue tasks as 'pending'.
 * Run with: npx ts-node -e "require('./scripts/check-overdue-tasks.ts')"
 * Or call the API route: GET /api/cron/check-overdue-tasks
 */

import { sql } from "../lib/db"

async function checkOverdueTasks() {
  const { rowCount } = await sql`
    UPDATE tasks
    SET status = 'pending', updated_at = NOW()
    WHERE status IN ('todo', 'in_progress')
      AND due_date < NOW()
  `
  console.log(`Updated ${rowCount} overdue task(s) to 'pending'.`)
}

checkOverdueTasks().catch((err) => {
  console.error("Error checking overdue tasks:", err)
  process.exit(1)
})
