import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

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

    // Verify requester is a family member
    const { rows: membership } = await sql`
      SELECT 1 FROM family_members WHERE family_id = ${id} AND user_id = ${session.user.id}
    `
    if (membership.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { rows } = await sql`
      SELECT fm.user_id, fm.role, fm.joined_at, u.name, u.email
      FROM family_members fm
      INNER JOIN users u ON fm.user_id = u.id
      WHERE fm.family_id = ${id}
      ORDER BY fm.joined_at ASC
    `

    return NextResponse.json(rows)
  } catch (error: any) {
    console.error("Error fetching family members:", error)
    return NextResponse.json({ error: "Failed to fetch family members" }, { status: 500 })
  }
}

export async function POST(
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

    // Verify requester is an admin or parent
    const { rows: membership } = await sql`
      SELECT role FROM family_members WHERE family_id = ${id} AND user_id = ${userId}
    `
    if (membership.length === 0 || !["admin", "parent"].includes(membership[0].role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { email, role } = body

    if (!email || !role) {
      return NextResponse.json({ error: "Email and role are required" }, { status: 400 })
    }

    // Find the user to add
    const { rows: targetUser } = await sql`
      SELECT id FROM users WHERE email = ${email}
    `
    if (targetUser.length === 0) {
      return NextResponse.json({ error: "No user found with that email address" }, { status: 404 })
    }
    const targetUserId = targetUser[0].id

    // Check if already a member
    const { rows: existing } = await sql`
      SELECT 1 FROM family_members WHERE family_id = ${id} AND user_id = ${targetUserId}
    `
    if (existing.length > 0) {
      return NextResponse.json({ error: "User is already a family member" }, { status: 409 })
    }

    await sql`
      INSERT INTO family_members (family_id, user_id, role)
      VALUES (${id}, ${targetUserId}, ${role})
    `

    return NextResponse.json({ message: "Member added successfully" }, { status: 201 })
  } catch (error: any) {
    console.error("Error adding family member:", error)
    return NextResponse.json({ error: "Failed to add family member" }, { status: 500 })
  }
}
