import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function PUT(request: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { role } = body

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

    const familyId = params.id
    const memberUserId = params.userId

    // Check if the current user is an admin or parent of this family
    const { data: currentMembership, error: membershipError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", currentUserId)
      .single()

    if (membershipError || !currentMembership || !["admin", "parent"].includes(currentMembership.role)) {
      return NextResponse.json({ error: "You don't have permission to update member roles" }, { status: 403 })
    }

    // Update the member's role
    const { error: updateError } = await supabase
      .from("family_members")
      .update({ role })
      .eq("family_id", familyId)
      .eq("user_id", memberUserId)

    if (updateError) {
      console.error("Error updating member role:", updateError)
      return NextResponse.json({ error: "Failed to update member role" }, { status: 500 })
    }

    return NextResponse.json({ message: "Member role updated successfully" })
  } catch (error) {
    console.error("Error updating member role:", error)
    return NextResponse.json({ error: "Failed to update member role" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string; userId: string } }) {
  try {
    const supabase = createServerSupabaseClient()

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

    const familyId = params.id
    const memberUserId = params.userId

    // Check if the current user is an admin or parent of this family
    const { data: currentMembership, error: membershipError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", currentUserId)
      .single()

    if (membershipError || !currentMembership || !["admin", "parent"].includes(currentMembership.role)) {
      return NextResponse.json({ error: "You don't have permission to remove members" }, { status: 403 })
    }

    // Remove the member
    const { error: deleteError } = await supabase
      .from("family_members")
      .delete()
      .eq("family_id", familyId)
      .eq("user_id", memberUserId)

    if (deleteError) {
      console.error("Error removing member:", deleteError)
      return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
    }

    return NextResponse.json({ message: "Member removed successfully" })
  } catch (error) {
    console.error("Error removing member:", error)
    return NextResponse.json({ error: "Failed to remove member" }, { status: 500 })
  }
}
