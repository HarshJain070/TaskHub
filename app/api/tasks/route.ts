import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)

    const userId = searchParams.get("userId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const familyId = searchParams.get("familyId")

    console.log("API: GET /api/tasks called with params:", { userId, status, priority, familyId })

    if (!userId) {
      console.log("API: No userId provided")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Get auth token from header
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.log("API: Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = data.user.id
      console.log("API: Authenticated user:", currentUserId)
    } else {
      console.log("API: No auth header provided")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Build the query
    let query = supabase.from("tasks").select(`
        *,
        assigned_to_profile:profiles!tasks_assigned_to_fkey(name),
        family:families(name)
      `)

    // Filter tasks based on user access
    if (familyId) {
      // If familyId is specified, only show tasks from that family
      query = query.eq("family_id", familyId)
    } else {
      // Show all tasks the user has access to (created by them, assigned to them, or family tasks they're part of)
      query = query.or(`created_by.eq.${currentUserId},assigned_to.eq.${currentUserId}`)
    }

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (priority && priority !== "all") {
      query = query.eq("priority", priority)
    }

    query = query.order("due_date", { ascending: true })

    console.log("API: Executing query...")
    const { data: tasks, error } = await query

    if (error) {
      console.error("API: Database error:", error)
      return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
    }

    console.log("API: Found tasks:", tasks?.length || 0)

    // Format the response to match the expected structure
    const formattedTasks =
      tasks?.map((task) => ({
        ...task,
        assigned_to_name: task.assigned_to_profile?.name || null,
        family_name: task.family?.name || null,
      })) || []

    console.log("API: Returning formatted tasks:", formattedTasks.length)
    return NextResponse.json(formattedTasks)
  } catch (error) {
    console.error("API: Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()

    console.log("API: Creating task with data:", body)

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let currentUserId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("API: Auth error:", error)
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
        console.error("API: Auth error:", authError)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      currentUserId = user.id
    }

    const { data: task, error } = await supabase
      .from("tasks")
      .insert({
        title: body.title,
        description: body.description || null,
        status: "todo",
        priority: body.priority || "medium",
        due_date: body.due_date,
        created_by: currentUserId,
        assigned_to: body.assigned_to || currentUserId,
        family_id: body.family_id || null,
        is_family_task: !!body.family_id,
      })
      .select()
      .single()

    if (error) {
      console.error("API: Task creation error:", error)
      return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 })
    }

    console.log("API: Task created successfully:", task.id)
    return NextResponse.json({ message: "Task created successfully", taskId: task.id }, { status: 201 })
  } catch (error) {
    console.error("API: Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
