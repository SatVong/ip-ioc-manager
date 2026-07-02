import { createContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import type { User, LoginRequest } from '../types'
import * as authApi from '../api/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  hasPermission: (permission: keyof User) => boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  // Проверяем токен при загрузке
  useEffect(() => {
    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      authApi.getMe()
        .then((userData) => {
          setUser(userData)
          setToken(savedToken)
        })
        .catch(() => {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          setToken(null)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (data: LoginRequest) => {
    const response = await authApi.login(data)
    localStorage.setItem('token', response.token)
    localStorage.setItem('user', JSON.stringify(response.user))
    setToken(response.token)
    setUser(response.user)
  }, [])

  const logout = useCallback(() => {
    authApi.logout().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const hasPermission = useCallback((permission: keyof User): boolean => {
    if (!user) return false
    if (user.role === 'admin') return true
    return Boolean(user[permission])
  }, [user])

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasPermission }}>
      {children}
    </AuthContext.Provider>
  )
}