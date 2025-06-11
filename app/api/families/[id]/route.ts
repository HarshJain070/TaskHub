import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()

    // Get the user from the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const familyId = params.id

    // Check if user is a member of this family
    const { data: membership, error: membershipError } = await supabase
      .from("family_members")
      .select("*")
      .eq("family_id", familyId)
      .eq("user_id", user.id)
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "Family not found or you are not a member" }, { status: 404 })
    }

    // Get family details
    const { data: family, error: familyError } = await supabase.from("families").select("*").eq("id", familyId).single()

    if (familyError) {
      return NextResponse.json({ error: "Family not found" }, { status: 404 })
    }

    // Get family members
    const { data: members, error: membersError } = await supabase
      .from("family_members")
      .select(`
        *,
        profiles(id, name, email)
      `)
      .eq("family_id", familyId)

    if (membersError) {
      return NextResponse.json({ error: "Failed to fetch family members" }, { status: 500 })
    }

    const formattedMembers = members.map((member) => ({
      user_id: member.user_id,
      name: member.profiles?.name || "Unknown",
      email: member.profiles?.email || "",
      role: member.role,
    }))

    return NextResponse.json({
      ...family,
      members: formattedMembers,
    })
  } catch (error) {
    console.error("Error fetching family:", error)
    return NextResponse.json({ error: "Failed to fetch family" }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const familyId = params.id
    const familyData = await request.json()

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let userId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      userId = data.user.id
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

      userId = user.id
    }

    // Check if user is an admin of this family
    const { data: membership, error: membershipError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", userId)
      .eq("role", "admin")
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You don't have permission to update this family" }, { status: 403 })
    }

    const { error } = await supabase
      .from("families")
      .update({
        name: familyData.name,
        description: familyData.description || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", familyId)

    if (error) throw error

    return NextResponse.json({ message: "Family updated successfully" })
  } catch (error) {
    console.error("Error updating family:", error)
    return NextResponse.json({ error: "Failed to update family" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const familyId = params.id

    // Get the authorization header from the request
    const authHeader = request.headers.get("authorization")
    let userId = null

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]

      // Verify the token
      const { data, error } = await supabase.auth.getUser(token)

      if (error || !data.user) {
        console.error("Auth error:", error)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      userId = data.user.id
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

      userId = user.id
    }

    // Check if user is an admin of this family
    const { data: membership, error: membershipError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", userId)
      .eq("role", "admin")
      .single()

    if (membershipError || !membership) {
      return NextResponse.json({ error: "You don't have permission to delete this family" }, { status: 403 })
    }

    // Delete family (cascade will handle members and tasks)
    const { error } = await supabase.from("families").delete().eq("id", familyId)

    if (error) throw error

    return NextResponse.json({ message: "Family deleted successfully" })
  } catch (error) {
    console.error("Error deleting family:", error)
    return NextResponse.json({ error: "Failed to delete family" }, { status: 500 })
  }
}
