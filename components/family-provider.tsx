"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useSession } from "next-auth/react"

type Family = {
  id: string
  name: string
  description: string | null
  created_at: string
  created_by: string
}

type FamilyMember = {
  user_id: string
  name: string
  email: string
  role: "admin" | "parent" | "child"
}

type FamilyContextType = {
  families: Family[]
  currentFamily: Family | null
  setCurrentFamily: (family: Family | null) => void
  familyMembers: FamilyMember[]
  isLoading: boolean
  refetchFamilies: () => Promise<void>
  refetchFamilyMembers: () => Promise<void>
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined)

export function FamilyProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession()
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchFamilies = async () => {
    try {
      const response = await fetch("/api/families")
      if (response.ok) {
        const data = await response.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error("Error fetching families:", error)
    }
  }

  const fetchFamilyMembers = async (familyId: string) => {
    try {
      const response = await fetch(`/api/families/${familyId}/members`)
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data)
      }
    } catch (error) {
      console.error("Error fetching family members:", error)
    }
  }

  // Fetch families when session becomes available
  useEffect(() => {
    if (status === "authenticated") {
      fetchFamilies().finally(() => setIsLoading(false))
    } else if (status === "unauthenticated") {
      setFamilies([])
      setCurrentFamily(null)
      setFamilyMembers([])
      setIsLoading(false)
    }
  }, [status])

  // Fetch members when current family changes
  useEffect(() => {
    if (currentFamily) {
      fetchFamilyMembers(currentFamily.id)
    } else {
      setFamilyMembers([])
    }
  }, [currentFamily])

  const refetchFamilies = async () => {
    await fetchFamilies()
  }

  const refetchFamilyMembers = async () => {
    if (currentFamily) {
      await fetchFamilyMembers(currentFamily.id)
    }
  }

  return (
    <FamilyContext.Provider
      value={{
        families,
        currentFamily,
        setCurrentFamily,
        familyMembers,
        isLoading,
        refetchFamilies,
        refetchFamilyMembers,
      }}
    >
      {children}
    </FamilyContext.Provider>
  )
}

export function useFamilyContext() {
  const context = useContext(FamilyContext)
  if (context === undefined) {
    throw new Error("useFamilyContext must be used within a FamilyProvider")
  }
  return context
}
