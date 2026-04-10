import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { searchParams } = new URL(request.url)
    const familyId = searchParams.get("familyId")
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")

    let tasks

    if (familyId) {
      // Verify the user is a member of this family first
      const { rows: membership } = await sql`
        SELECT 1 FROM family_members WHERE family_id = ${familyId} AND user_id = ${userId}
      `
      if (membership.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }

      if (status && priority) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE t.family_id = ${familyId}
            AND t.status = ${status}
            AND t.priority = ${priority}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else if (status) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE t.family_id = ${familyId} AND t.status = ${status}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else if (priority) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE t.family_id = ${familyId} AND t.priority = ${priority}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE t.family_id = ${familyId}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      }
    } else {
      // Personal tasks
      if (status && priority) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE (t.created_by = ${userId} OR t.assigned_to = ${userId})
            AND t.is_family_task = false
            AND t.status = ${status}
            AND t.priority = ${priority}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else if (status) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE (t.created_by = ${userId} OR t.assigned_to = ${userId})
            AND t.is_family_task = false
            AND t.status = ${status}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else if (priority) {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE (t.created_by = ${userId} OR t.assigned_to = ${userId})
            AND t.is_family_task = false
            AND t.priority = ${priority}
          ORDER BY t.created_at DESC
        `
        tasks = rows
      } else {
        const { rows } = await sql`
          SELECT t.*, u_created.name as creator_name, u_assigned.name as assignee_name
          FROM tasks t
          LEFT JOIN users u_created ON t.created_by = u_created.id
          LEFT JOIN users u_assigned ON t.assigned_to = u_assigned.id
          WHERE (t.created_by = ${userId} OR t.assigned_to = ${userId})
            AND t.is_family_task = false
          ORDER BY t.created_at DESC
        `
        tasks = rows
      }
    }

    return NextResponse.json(tasks)
  } catch (error: any) {
    console.error("Error fetching tasks:", error)
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const body = await request.json()
    const { title, description, status, priority, due_date, assigned_to, family_id, is_family_task } = body

    if (!title || !due_date) {
      return NextResponse.json({ error: "Title and due date are required" }, { status: 400 })
    }

    // If creating a family task, verify membership
    if (family_id) {
      const { rows: membership } = await sql`
        SELECT 1 FROM family_members WHERE family_id = ${family_id} AND user_id = ${userId}
      `
      if (membership.length === 0) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    }

    const { rows } = await sql`
      INSERT INTO tasks (title, description, status, priority, due_date, created_by, assigned_to, family_id, is_family_task)
      VALUES (
        ${title},
        ${description ?? null},
        ${status ?? "todo"},
        ${priority ?? "medium"},
        ${due_date},
        ${userId},
        ${assigned_to ?? null},
        ${family_id ?? null},
        ${is_family_task ?? false}
      )
      RETURNING *
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating task:", error)
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 })
  }
}
