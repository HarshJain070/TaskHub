import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

async function verifyTaskAccess(taskId: string, userId: string) {
  const { rows } = await sql`
    SELECT t.* FROM tasks t
    WHERE t.id = ${taskId}
      AND (
        t.created_by = ${userId}
        OR t.assigned_to = ${userId}
        OR EXISTS (
          SELECT 1 FROM family_members fm
          WHERE fm.family_id = t.family_id AND fm.user_id = ${userId}
        )
      )
  `
  return rows[0] ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params
    const task = await verifyTaskAccess(id, session.user.id)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    return NextResponse.json(task)
  } catch (error: any) {
    console.error("Error fetching task:", error)
    return NextResponse.json({ error: "Failed to fetch task" }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { id } = await params
    const task = await verifyTaskAccess(id, userId)
    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const body = await request.json()
    const { title, description, status, priority, due_date, assigned_to } = body

    const { rows } = await sql`
      UPDATE tasks
      SET
        title       = COALESCE(${title ?? null}, title),
        description = COALESCE(${description ?? null}, description),
        status      = COALESCE(${status ?? null}, status),
        priority    = COALESCE(${priority ?? null}, priority),
        due_date    = COALESCE(${due_date ?? null}::timestamptz, due_date),
        assigned_to = COALESCE(${assigned_to ?? null}::uuid, assigned_to),
        updated_at  = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(rows[0])
  } catch (error: any) {
    console.error("Error updating task:", error)
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const userId = session.user.id

    const { id } = await params

    // Only the creator can delete a task
    const { rows } = await sql`
      DELETE FROM tasks
      WHERE id = ${id} AND created_by = ${userId}
      RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Task not found or permission denied" }, { status: 404 })
    }

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting task:", error)
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 })
  }
}
