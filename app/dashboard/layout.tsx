"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Providers } from "@/components/providers"

export default function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession()

        if (error) {
          console.error("Auth error:", error)
          router.push("/login")
          return
        }

        if (!session?.user) {
          router.push("/login")
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error("Session check failed:", error)
        router.push("/login")
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push("/login")
      } else if (session?.user) {
        setUser(session.user)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  if (loading) {
    return (
      <Providers>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Providers>
    )
  }

  if (!user) {
    return null
  }

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="font-bold text-xl">TaskHub</div>
            <UserNav user={user} />
          </div>
        </header>
        <div className="flex flex-1">
          <aside className="w-64 border-r">
            <DashboardNav />
          </aside>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </Providers>
  )
}
