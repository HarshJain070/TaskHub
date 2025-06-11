import { type NextRequest, NextResponse } from "next/server"
import { createServerSupabaseClient } from "@/lib/supabase"

async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)

  try {
    const supabase = createServerSupabaseClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token)
    if (error || !user) {
      return null
    }
    return user
  } catch (error) {
    console.error("Auth error:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    // Get user ID from query parameter or session
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const { data: families, error } = await supabase
      .from("families")
      .select(`
        *,
        family_members!inner(role)
      `)
      .eq("family_members.user_id", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 })
    }

    return NextResponse.json(families || [])
  } catch (error) {
    console.error("Error fetching families:", error)
    return NextResponse.json({ error: "Failed to fetch families" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const body = await request.json()
    const { name, description, userId } = body

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    if (!name) {
      return NextResponse.json({ error: "Family name is required" }, { status: 400 })
    }

    // Create family
    const { data: family, error: familyError } = await supabase
      .from("families")
      .insert({
        name,
        description: description || null,
        created_by: userId,
      })
      .select()
      .single()

    if (familyError) {
      console.error("Family creation error:", familyError)
      return NextResponse.json({ error: "Failed to create family" }, { status: 500 })
    }

    // Add creator as admin
    const { error: memberError } = await supabase.from("family_members").insert({
      family_id: family.id,
      user_id: userId,
      role: "admin",
    })

    if (memberError) {
      console.error("Member creation error:", memberError)
      // Clean up the family if member creation fails
      await supabase.from("families").delete().eq("id", family.id)
      return NextResponse.json({ error: "Failed to create family membership" }, { status: 500 })
    }

    return NextResponse.json({ message: "Family created successfully", familyId: family.id }, { status: 201 })
  } catch (error) {
    console.error("Error creating family:", error)
    return NextResponse.json({ error: "Failed to create family" }, { status: 500 })
  }
}
