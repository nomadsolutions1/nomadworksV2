"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  roleLabel: string
  companyId: string
  allowedModules: string[]
  isClockedIn: boolean
  unreadCount: number
}

type AuthContextType = {
  user: AuthUser | null
  loading: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refresh: async () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({
  children,
  initialUser,
}: {
  children: React.ReactNode
  initialUser: AuthUser | null
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/me")
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll for notification count + clock status every 60s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/me")
        if (res.ok) {
          const data = await res.json()
          if (data) {
            setUser((prev) =>
              prev ? { ...prev, unreadCount: data.unreadCount, isClockedIn: data.isClockedIn } : prev
            )
          }
        }
      } catch {
        // Ignore polling errors
      }
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}
