import { createContext, useContext } from 'react'

export interface AuthContextValue {
  isAuthenticated: boolean
  userRole: string | null
  userId: number | null
  signIn: (token: string, role?: string, userId?: number) => void
  signOut: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
