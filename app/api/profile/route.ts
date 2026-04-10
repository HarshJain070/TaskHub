import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { sql } from "@/lib/db"

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { name, userId } = body

    if (!userId || !name) {
      return NextResponse.json({ error: "User ID and name are required" }, { status: 400 })
    }

    // Ensure callers can only update their own profile
    if (userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await sql`
      UPDATE users
      SET name = ${name}, updated_at = NOW()
      WHERE id = ${userId}
    `

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error: any) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
