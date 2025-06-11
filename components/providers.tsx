"use client"

import type React from "react"

import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from "@/components/auth-provider"
import { FamilyProvider } from "@/components/family-provider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <FamilyProvider>
          {children}
          <Toaster />
        </FamilyProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
