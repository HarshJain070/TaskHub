"use client"

import { useState, useEffect } from "react"
import type { ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { DashboardNav } from "@/components/dashboard-nav"
import { UserNav } from "@/components/user-nav"
import { Providers } from "@/components/providers"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return (
      <Providers>
        <div className="flex min-h-screen items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Providers>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <Providers>
      <div className="flex min-h-screen flex-col">
        <header className="border-b">
          <div className="container flex h-16 items-center justify-between px-4">
            <div className="font-bold text-xl">TaskHub</div>
            <UserNav user={session.user} />
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
