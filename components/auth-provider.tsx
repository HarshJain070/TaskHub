"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase"

type AuthContextType = {
  user: User | null
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
  signOut: async () => {},
  clearSession: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (!mounted) return

        if (error) {
          console.error("Session error:", error.message)
          setUser(null)
        } else if (session?.user) {
          console.log("Found existing session for:", session.user.email)
          setUser(session.user)
        } else {
          console.log("No active session")
          setUser(null)
        }
      } catch (err) {
        console.error("Session check error:", err)
        if (mounted) setUser(null)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log("Auth state changed:", event, session?.user?.email)

      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }

      setLoading(false)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error.message)
        setLoading(false)
        return { error: error.message }
      }

      if (data.user) {
        console.log("Sign in successful for:", data.user.email)
        setUser(data.user)
        setLoading(false)
        return { error: undefined }
      }

      setLoading(false)
      return { error: "Sign in failed" }
    } catch (err: any) {
      console.error("Unexpected sign in error:", err.message)
      setLoading(false)
      return { error: "An unexpected error occurred" }
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      })

      if (error) {
        console.error("Sign up error:", error.message)
        return { error: error.message }
      }

      console.log("Sign up successful:", data.user?.email)
      return { error: undefined }
    } catch (err: any) {
      console.error("Unexpected sign up error:", err.message)
      return { error: "An unexpected error occurred" }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
    } catch (err) {
      console.error("Sign out error:", err)
    }
  }

  const clearSession = async () => {
    try {
      await supabase.auth.signOut()
      setUser(null)
      // Clear any stored session data
      localStorage.clear()
      sessionStorage.clear()
      // Force a hard refresh to clear any cached data
      window.location.href = "/"
    } catch (err) {
      console.error("Clear session error:", err)
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
