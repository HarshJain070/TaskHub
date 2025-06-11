import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const taskId = params.id

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = data.user.id
    } else {
      // Fallback to getting user from session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = user.id
    }

    // Get the task with family and assignee information
    const { data: task, error } = await supabase
      .from("tasks")
      .select(`
        *,
        families!tasks_family_id_fkey (
          id,
          name
        ),
        assigned_profile:profiles!tasks_assigned_to_fkey (
          id,
          name
        )
      `)
      .eq("id", taskId)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user has access to this task
    const hasAccess =
      task.created_by === currentUserId || // User created the task
      task.assigned_to === currentUserId || // User is assigned to the task
      (task.family_id && (await checkFamilyMembership(supabase, currentUserId, task.family_id))) // User is family member

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Format the response
    const formattedTask = {
      ...task,
      family_name: task.families?.name || null,
      assigned_to_name: task.assigned_profile?.name || null,
    }

    return NextResponse.json(formattedTask)
  } catch (error) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const taskId = params.id
    const body = await request.json()

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = data.user.id
    } else {
      // Fallback to getting user from session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = user.id
    }

    // Check if task exists and user has permission
    const { data: existingTask, error: fetchError } = await supabase.from("tasks").select("*").eq("id", taskId).single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user has permission to update this task
    const hasPermission =
      existingTask.created_by === currentUserId || // User created the task
      existingTask.assigned_to === currentUserId || // User is assigned to the task
      (existingTask.family_id && (await checkFamilyMembership(supabase, currentUserId, existingTask.family_id))) // User is family member

    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Update the task
    const { data: updatedTask, error: updateError } = await supabase
      .from("tasks")
      .update({
        title: body.title,
        description: body.description,
        priority: body.priority,
        status: body.status,
        due_date: body.due_date,
        assigned_to: body.assigned_to,
        family_id: body.family_id,
        is_family_task: body.is_family_task,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId)
      .select()
      .single()

    if (updateError) {
      console.error("Update error:", updateError)
      return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
    }

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const taskId = params.id

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = data.user.id
    } else {
      // Fallback to getting user from session
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        console.error("Auth error:", authError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = user.id
    }

    // Check if task exists and user has permission
    const { data: existingTask, error: fetchError } = await supabase.from("tasks").select("*").eq("id", taskId).single()

    if (fetchError || !existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    // Check if user has permission to delete this task
    const hasPermission =
      existingTask.created_by === currentUserId || // User created the task
      (existingTask.family_id && (await checkFamilyMembership(supabase, currentUserId, existingTask.family_id))) // User is family member

    if (!hasPermission) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 })
    }

    // Delete the task
    const { error: deleteError } = await supabase.from("tasks").delete().eq("id", taskId)

    if (deleteError) {
      console.error("Delete error:", deleteError)
      return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}

// Helper function to check family membership
async function checkFamilyMembership(supabase: any, userId: string, familyId: string) {
  const { data, error } = await supabase
    .from("family_members")
    .select("id")
    .eq("user_id", userId)
    .eq("family_id", familyId)
    .single()

  return !error && data
}
