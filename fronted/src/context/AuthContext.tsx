import React, { createContext, useContext, useEffect, useState } from 'react'

export type User = {
  _id?: string
  id?: string
  name: string
  fullName?: string
  email: string
  role: 'OWNER'
  companyId?: string
  profileImage?: string | null
  profileImagePath?: string | null
  isActive?: boolean
  createdAt?: string
  updatedAt?: string
} | null

export type Company = {
  _id?: string
  id?: string
  companyName: string
  ownerId?: string
  logo?: string | null
  companyLogoPath?: string | null
  createdAt?: string
  updatedAt?: string
} | null

type AuthContextValue = {
  user: User
  company: Company
  token: string | null
  loading: boolean
  login: (userData: User, companyData: Company, tokenStr: string, remember?: boolean) => void
  logout: () => void
  updateCompany: (companyData: Partial<NonNullable<Company>>) => void
  updateUser: (userData: Partial<NonNullable<User>>) => void
  getAuthHeaders: () => Record<string, string>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token') || sessionStorage.getItem('token') || null
  })
  const [user, setUser] = useState<User>(() => {
    try {
      const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user')
      return rawUser ? JSON.parse(rawUser) : null
    } catch (e) {
      return null
    }
  })
  const [company, setCompany] = useState<Company>(() => {
    try {
      const rawCompany = localStorage.getItem('company') || sessionStorage.getItem('company')
      return rawCompany ? JSON.parse(rawCompany) : null
    } catch (e) {
      return null
    }
  })
  const [loading, setLoading] = useState<boolean>(true)

  // Validate token with backend /api/auth/me on mount or token change
  useEffect(() => {
    let isMounted = true

    async function fetchMe() {
      const activeToken = localStorage.getItem('token') || sessionStorage.getItem('token')
      if (!activeToken) {
        if (isMounted) {
          setUser(null)
          setCompany(null)
          setToken(null)
          setLoading(false)
        }
        return
      }

      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: {
            Authorization: `Bearer ${activeToken}`,
          },
        })

        if (res.ok) {
          const data = await res.json()
          if (isMounted) {
            setUser(data.user)
            setCompany(data.company)
            setToken(activeToken)

            const isLocal = !!localStorage.getItem('token')
            const storage = isLocal ? localStorage : sessionStorage
            storage.setItem('user', JSON.stringify(data.user))
            storage.setItem('company', JSON.stringify(data.company))
          }
        } else {
          if (isMounted) {
            logout()
          }
        }
      } catch (err) {
        console.warn('Backend connection error during auth verification:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchMe()

    return () => {
      isMounted = false
    }
  }, [])

  function getAuthHeaders(): Record<string, string> {
    const activeToken = token || localStorage.getItem('token') || sessionStorage.getItem('token')
    return activeToken ? { Authorization: `Bearer ${activeToken}` } : {}
  }

  function login(userData: User, companyData: Company, tokenStr: string, remember = true) {
    const storage = remember ? localStorage : sessionStorage
    const otherStorage = remember ? sessionStorage : localStorage

    otherStorage.removeItem('token')
    otherStorage.removeItem('user')
    otherStorage.removeItem('company')

    storage.setItem('token', tokenStr)
    if (userData) storage.setItem('user', JSON.stringify(userData))
    if (companyData) storage.setItem('company', JSON.stringify(companyData))

    setToken(tokenStr)
    setUser(userData)
    setCompany(companyData)
  }

  function logout() {
    setUser(null)
    setCompany(null)
    setToken(null)
    localStorage.clear()
    sessionStorage.clear()
  }


  function updateCompany(updatedData: Partial<NonNullable<Company>>) {
    setCompany((prev) => {
      if (!prev) return updatedData as Company
      const newCompany = { ...prev, ...updatedData }
      const isLocal = !!localStorage.getItem('token')
      const storage = isLocal ? localStorage : sessionStorage
      storage.setItem('company', JSON.stringify(newCompany))
      return newCompany
    })
  }

  function updateUser(updatedData: Partial<NonNullable<User>>) {
    setUser((prev) => {
      if (!prev) return updatedData as User
      const newUser = { ...prev, ...updatedData }
      const isLocal = !!localStorage.getItem('token')
      const storage = isLocal ? localStorage : sessionStorage
      storage.setItem('user', JSON.stringify(newUser))
      return newUser
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        token,
        loading,
        login,
        logout,
        updateCompany,
        updateUser,
        getAuthHeaders,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
