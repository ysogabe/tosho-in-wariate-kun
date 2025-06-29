'use client'

import * as React from 'react'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'

// Mock User type - will be replaced with actual Supabase User when integrated
interface MockUser {
  id: string
  email: string
  created_at: string
  updated_at: string
  app_metadata: Record<string, any>
  user_metadata: Record<string, any>
  aud: string
  confirmation_sent_at: string | null
  confirmed_at: string | null
  email_confirmed_at: string | null
  invited_at: string | null
  last_sign_in_at: string | null
  phone: string | null
  phone_confirmed_at: string | null
  recovery_sent_at: string | null
  role: string
}

interface AuthContextType {
  user: MockUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refetch: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // MVP: Check for existing session from cookies
    const checkInitialSession = async () => {
      try {
        // MVP: Check cookies for existing session
        if (typeof window !== 'undefined') {
          const cookies = document.cookie.split(';')
          const authCookie = cookies.find((c) =>
            c.trim().startsWith('auth-session=')
          )
          const userDataCookie = cookies.find((c) =>
            c.trim().startsWith('user-data=')
          )

          if (authCookie && userDataCookie) {
            const authValue = authCookie.split('=')[1]
            if (authValue === 'authenticated') {
              try {
                const userDataValue = userDataCookie.split('=')[1]
                const userData = JSON.parse(
                  decodeURIComponent(userDataValue)
                ) as MockUser
                setUser(userData)
              } catch (error) {
                console.error('Error parsing user data:', error)
                // Clear invalid cookies
                document.cookie =
                  'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
                document.cookie =
                  'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
                document.cookie =
                  'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
              }
            }
          }
        }

        // Add small delay to simulate authentication check
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkInitialSession()
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      setIsLoading(true)

      // TODO: Replace with actual Supabase authentication
      // const { error } = await supabase.auth.signInWithPassword({
      //   email,
      //   password
      // })

      // ⚠️ WARNING: Mock implementation for testing ONLY
      // TODO: REMOVE hardcoded credentials before production deployment

      // MVP: Support multiple test users with different roles
      const testUsers = [
        { email: 'test@example.com', password: 'Password123', role: 'teacher' },
        { email: 'admin@example.com', password: 'Password123', role: 'admin' },
      ]

      const matchedUser = testUsers.find(
        (u) => u.email === email && u.password === password
      )

      if (matchedUser) {
        const mockUser = {
          id: `mock-user-${matchedUser.role}`,
          email: matchedUser.email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          confirmation_sent_at: null,
          confirmed_at: new Date().toISOString(),
          email_confirmed_at: new Date().toISOString(),
          invited_at: null,
          last_sign_in_at: new Date().toISOString(),
          phone: null,
          phone_confirmed_at: null,
          recovery_sent_at: null,
          role: matchedUser.role,
        } as MockUser

        setUser(mockUser)

        // MVP: Set cookies for middleware authentication
        if (typeof window !== 'undefined') {
          const maxAge = 60 * 60 * 24 * 7 // 7 days
          document.cookie = `auth-session=authenticated; path=/; max-age=${maxAge}`
          document.cookie = `user-data=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=${maxAge}`
          document.cookie = `user-role=${matchedUser.role}; path=/; max-age=${maxAge}`
        }

        return {}
      }

      return { error: 'Invalid credentials' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { error: 'ログインに失敗しました' }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const signOut = useCallback(async () => {
    try {
      setIsLoading(true)

      // TODO: Replace with actual Supabase sign out
      // await supabase.auth.signOut()

      // Mock implementation
      setUser(null)

      // MVP: Clear authentication cookies
      if (typeof window !== 'undefined') {
        document.cookie =
          'auth-session=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        document.cookie =
          'user-data=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
        document.cookie =
          'user-role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT'
      }
    } catch (error) {
      console.error('Sign out error:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refetch = useCallback(() => {
    setIsLoading(true)
    // TODO: Replace with actual Supabase session refresh
    // supabase.auth.getSession().then(({ data: { session } }) => {
    //   setUser(session?.user ?? null)
    //   setIsLoading(false)
    // })

    // Mock implementation
    setTimeout(() => {
      setIsLoading(false)
    }, 500)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signOut,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
