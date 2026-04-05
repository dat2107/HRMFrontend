import { createContext, useContext, useState, useCallback } from 'react'
import type { User } from '../types'
import { STORAGE_KEYS } from '../constants'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isAdmin: boolean
  setAuth: (token: string, user: User) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEYS.USER)
    return raw ? JSON.parse(raw) : null
  })

  const setAuth = useCallback((token: string, newUser: User) => {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token)
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser))
    setUser(newUser)
  }, [])

  const clearAuth = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN)
    localStorage.removeItem(STORAGE_KEYS.USER)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!localStorage.getItem(STORAGE_KEYS.TOKEN),
      isAdmin: user?.role === 'ADMIN',
      setAuth,
      clearAuth,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
