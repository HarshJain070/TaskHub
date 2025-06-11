import { createServerSupabaseClient } from "@/lib/supabase"

export async function checkOverdueTasks() {
  try {
    const supabase = createServerSupabaseClient()

    // Call the PostgreSQL function to check and update overdue tasks
    const { error } = await supabase.rpc("check_overdue_tasks")

    if (error) {
      console.error("Error checking overdue tasks:", error)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    console.error("Error in checkOverdueTasks:", error)
    return { success: false, error: String(error) }
  }
}
