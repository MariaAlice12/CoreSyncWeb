import { useState, type ReactNode } from 'react'
import { AuthContext } from './auth'
import { getToken, getRole, getUserId } from '../utils/token'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => !!getToken())
  const [userRole, setUserRole] = useState<string | null>(() => getRole())
  const [userId, setUserId] = useState<number | null>(() => getUserId())

  function signIn(token: string, role?: string, id?: number) {
    setIsAuthenticated(!!token)
    setUserRole(role ?? getRole())
    setUserId(id ?? getUserId())
  }

  function signOut() {
    setIsAuthenticated(false)
    setUserRole(null)
    setUserId(null)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, userId, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
