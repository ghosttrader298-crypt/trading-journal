'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { SafeUser } from '@/types'

interface AuthContextType {
  user: SafeUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ error?: string }>
  register: (email: string, password: string) => Promise<{ error?: string }>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const { data } = await res.json()
        setUser(data)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error }
      setUser(data.data)
      router.push(data.redirectTo)
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  const register = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) return { error: data.error }
      setUser(data.data)
      router.push(data.redirectTo)
      return {}
    } catch {
      return { error: 'Network error. Please try again.' }
    }
  }

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    router.push('/auth/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}