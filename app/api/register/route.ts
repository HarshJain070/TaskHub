import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { email, name, password } = body

        if (!email || !name || !password) {
            return NextResponse.json(
                { error: "Email, name, and password are required" },
                { status: 400 },
            )
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: "Password must be at least 6 characters" },
                { status: 400 },
            )
        }

        // Check if user already exists
        const { rows: existing } = await sql`
      SELECT id FROM users WHERE email = ${email}
    `
        if (existing.length > 0) {
            return NextResponse.json(
                { error: "An account with this email already exists" },
                { status: 409 },
            )
        }

        // Hash password and create user
        const passwordHash = await bcrypt.hash(password, 12)

        await sql`
      INSERT INTO users (email, name, password_hash)
      VALUES (${email}, ${name}, ${passwordHash})
    `

        return NextResponse.json(
            { message: "Account created successfully" },
            { status: 201 },
        )
    } catch (error: any) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Failed to create account. Please try again." },
            { status: 500 },
        )
    }
}
