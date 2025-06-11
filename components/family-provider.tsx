"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"

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
  const [families, setFamilies] = useState<Family[]>([])
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setUser(user)
      if (user) {
        await fetchFamilies(user.id)
      }
      setIsLoading(false)
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await fetchFamilies(session.user.id)
      } else {
        setUser(null)
        setFamilies([])
        setCurrentFamily(null)
        setFamilyMembers([])
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchFamilies = async (userId: string) => {
    try {
      const response = await fetch(`/api/families?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setFamilies(data)
      }
    } catch (error) {
      console.error("Error fetching families:", error)
    }
  }

  const fetchFamilyMembers = async () => {
    if (!currentFamily || !user) return

    try {
      const response = await fetch(`/api/families/${currentFamily.id}/members?userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setFamilyMembers(data)
      }
    } catch (error) {
      console.error("Error fetching family members:", error)
    }
  }

  const refetchFamilies = async () => {
    if (user) {
      await fetchFamilies(user.id)
    }
  }

  const refetchFamilyMembers = async () => {
    await fetchFamilyMembers()
  }

  useEffect(() => {
    if (currentFamily) {
      fetchFamilyMembers()
    } else {
      setFamilyMembers([])
    }
  }, [currentFamily, user])

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
