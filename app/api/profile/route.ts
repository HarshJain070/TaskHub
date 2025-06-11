import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { name, userId } = body

    if (!userId || !name) {
      return NextResponse.json({ error: "User ID and name are required" }, { status: 400 })
    }

    // Update user metadata
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { name },
    })

    if (error) {
      console.error("Profile update error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
