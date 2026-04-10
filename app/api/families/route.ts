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

    const { rows } = await sql`
      SELECT f.*
      FROM families f
      INNER JOIN family_members fm ON f.id = fm.family_id
      WHERE fm.user_id = ${userId}
      ORDER BY f.created_at DESC
    `

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Error fetching families:", error)
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 })
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
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Family name is required" }, { status: 400 })
    }

    // Create the family and add the creator as admin in a single transaction
    const { rows } = await sql`
      WITH new_family AS (
        INSERT INTO families (name, description, created_by)
        VALUES (${name}, ${description ?? null}, ${userId})
        RETURNING *
      ),
      add_member AS (
        INSERT INTO family_members (family_id, user_id, role)
        SELECT id, ${userId}, 'admin' FROM new_family
      )
      SELECT * FROM new_family
    `

    return NextResponse.json(rows[0], { status: 201 })
  } catch (error: any) {
    console.error("Error creating family:", error)
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 })
  }
}
