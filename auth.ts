import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { sql } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        Credentials({
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null

                try {
                    const { rows } = await sql`
            SELECT id, email, name, password_hash
            FROM users
            WHERE email = ${credentials.email as string}
          `

                    if (rows.length === 0) return null
                    const user = rows[0]

                    const passwordMatch = await bcrypt.compare(
                        credentials.password as string,
                        user.password_hash,
                    )
                    if (!passwordMatch) return null

                    return { id: user.id, email: user.email, name: user.name }
                } catch (err) {
                    console.error("Auth error:", err)
                    return null
                }
            },
        }),
    ],

    callbacks: {
        jwt({ token, user }) {
            // On first sign-in, `user` is populated
            if (user) {
                token.id = user.id
                token.name = user.name
                token.email = user.email
            }
            return token
        },
        session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.name = token.name as string
                session.user.email = token.email as string
            }
            return session
        },
    },

    pages: {
        signIn: "/login",
    },

    session: {
        strategy: "jwt",
    },
})
