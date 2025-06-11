import { NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // In Next.js 15, we need to handle params differently
    const familyId = params.id

    // Get family members with their profile information
    const { data: members, error } = await supabase
      .from("family_members")
      .select(`
        *,
        profiles!family_members_user_id_fkey(
          id,
          name,
          email
        )
      `)
      .eq("family_id", familyId)

    if (error) {
      console.error("Error fetching family members:", error)
      return NextResponse.json({ error: "Failed to fetch family members" }, { status: 500 })
    }

    // Format the response
    const formattedMembers =
      members?.map((member) => ({
        user_id: member.user_id,
        role: member.role,
        name: member.profiles?.name || "Unknown",
        email: member.profiles?.email || "Unknown",
        joined_at: member.created_at,
      })) || []

    return NextResponse.json(formattedMembers)
  } catch (error) {
    console.error("Error in GET /api/families/[id]/members:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { email, role, userId } = body

    console.log("Adding family member:", { email, role, userId, familyId: params.id })

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const familyId = params.id

    // Check if the requesting user is an admin or parent of this family
    const { data: membership, error: membershipError } = await supabase
      .from("family_members")
      .select("role")
      .eq("family_id", familyId)
      .eq("user_id", userId)
      .single()

    if (membershipError || !membership || !["admin", "parent"].includes(membership.role)) {
      return NextResponse.json({ error: "You don't have permission to add members to this family" }, { status: 403 })
    }

    // Find user by email
    const { data: userToAdd, error: userError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single()

    if (userError || !userToAdd) {
      return NextResponse.json(
        { error: "User not found with this email. They need to sign up first." },
        { status: 404 },
      )
    }

    // Check if user is already a member
    const { data: existingMember, error: existingError } = await supabase
      .from("family_members")
      .select("*")
      .eq("family_id", familyId)
      .eq("user_id", userToAdd.id)
      .maybeSingle()

    if (existingMember) {
      return NextResponse.json({ error: "User is already a member of this family" }, { status: 400 })
    }

    // Add member
    const { error: insertError } = await supabase.from("family_members").insert({
      family_id: familyId,
      user_id: userToAdd.id,
      role: role,
    })

    if (insertError) {
      console.error("Error inserting family member:", insertError)
      return NextResponse.json({ error: "Failed to add family member" }, { status: 500 })
    }

    return NextResponse.json({ message: "Member added successfully" }, { status: 201 })
  } catch (error) {
    console.error("Error adding family member:", error)
    return NextResponse.json({ error: "Failed to add family member" }, { status: 500 })
  }
}
