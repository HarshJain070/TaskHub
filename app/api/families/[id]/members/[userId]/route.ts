import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const requesterId = session.user.id

    const { id: familyId, userId: targetUserId } = await params

    // Only admin can change roles
    const { rows: requesterMembership } = await sql`
      SELECT role FROM family_members WHERE family_id = ${familyId} AND user_id = ${requesterId}
    `
    if (requesterMembership.length === 0 || requesterMembership[0].role !== "admin") {
      return NextResponse.json({ error: "Forbidden — only admins can change roles" }, { status: 403 })
    }

    const body = await request.json()
    const { role } = body

    if (!role || !["admin", "parent", "child"].includes(role)) {
      return NextResponse.json({ error: "Valid role is required (admin, parent, child)" }, { status: 400 })
    }

    const { rows } = await sql`
      UPDATE family_members
      SET role = ${role}
      WHERE family_id = ${familyId} AND user_id = ${targetUserId}
      RETURNING *
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Role updated successfully" })
  } catch (error: any) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const requesterId = session.user.id

    const { id: familyId, userId: targetUserId } = await params

    // Admin can remove anyone; a member can remove themselves
    const { rows: requesterMembership } = await sql`
      SELECT role FROM family_members WHERE family_id = ${familyId} AND user_id = ${requesterId}
    `
    if (requesterMembership.length === 0) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const isAdmin = requesterMembership[0].role === "admin"
    const isSelf = requesterId === targetUserId

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden — only admins can remove other members" }, { status: 403 })
    }

    const { rows } = await sql`
      DELETE FROM family_members
      WHERE family_id = ${familyId} AND user_id = ${targetUserId}
      RETURNING user_id
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error: any) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
