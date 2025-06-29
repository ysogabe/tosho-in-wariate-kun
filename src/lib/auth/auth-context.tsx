'use client'

import * as React from 'react'
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react'
import {
  setClientSession,
  clearClientSession,
  getClientSession,
} from './helpers'

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
        // Use helper function to get client session
        const sessionData = getClientSession()
        if (sessionData) {
          setUser(sessionData as MockUser)
        }

        // Add small delay to simulate authentication check
        await new Promise((resolve) => setTimeout(resolve, 100))
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Clear invalid session on error
        clearClientSession()
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

        // MVP: Set session using helper function
        setClientSession(mockUser)

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

      // MVP: Clear session using helper function
      clearClientSession()
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
