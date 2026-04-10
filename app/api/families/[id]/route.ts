import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

async function verifyFamilyMembership(familyId: string, userId: string) {
  const { rows } = await sql`
    SELECT role FROM family_members
    WHERE family_id = ${familyId} AND user_id = ${userId}
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
    const membership = await verifyFamilyMembership(id, session.user.id)
    if (!membership) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    const { rows } = await sql`SELECT * FROM families WHERE id = ${id}`
    if (rows.length === 0) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    return NextResponse.json(rows[0])
  } catch (error: any) {
    console.error("Error fetching family:", error)
    return NextResponse.json({ error: "Failed to fetch family" }, { status: 500 })
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
    const membership = await verifyFamilyMembership(id, userId)
    if (!membership || !["admin", "parent"].includes(membership.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: "Family name is required" }, { status: 400 })
    }

    const { rows } = await sql`
      UPDATE families
      SET name = ${name}, description = ${description ?? null}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    return NextResponse.json(rows[0])
  } catch (error: any) {
    console.error("Error updating family:", error)
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 })
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

    // Only the family creator (admin) can delete it
    const { rows } = await sql`
      DELETE FROM families
      WHERE id = ${id} AND created_by = ${userId}
      RETURNING id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Family not found or permission denied" }, { status: 404 })
    }

    return NextResponse.json({ message: "Family deleted successfully" })
  } catch (error: any) {
    console.error("Error deleting family:", error)
    return NextResponse.json({ error: "Failed to delete family" }, { status: 500 })
  }
}
