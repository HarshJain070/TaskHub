"use client"

import type React from "react"
import { createContext, useContext } from "react"
import { useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"

type AuthUser = {
  id: string
  email: string
  name: string
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string, name: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  clearSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signIn: async () => ({ error: "Not implemented" }),
  signUp: async () => ({ error: "Not implemented" }),
  signOut: async () => { },
  clearSession: async () => { },
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()

  const user: AuthUser | null = session?.user
    ? {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
    }
    : null

  const loading = status === "loading"

  const signIn = async (email: string, password: string) => {
    try {
      const result = await nextAuthSignIn("credentials", {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        return { error: "Invalid email or password" }
      }
      return {}
    } catch (err: any) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      })
      const data = await res.json()
      if (!res.ok) {
        return { error: data.error || "Failed to create account" }
      }
      return {}
    } catch (err: any) {
      return { error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    await nextAuthSignOut({ redirect: false })
  }

  const clearSession = async () => {
    await nextAuthSignOut({ redirect: false })
    if (typeof window !== "undefined") {
      localStorage.clear()
      sessionStorage.clear()
      window.location.href = "/"
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut, clearSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
