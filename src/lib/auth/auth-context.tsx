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
    // Mock initial session check - replace with actual Supabase client when available
    const checkInitialSession = async () => {
      try {
        // TODO: Replace with actual Supabase client integration
        // const { data: { session } } = await supabase.auth.getSession()
        // setUser(session?.user ?? null)

        // Mock: Add small delay to simulate authentication check
        await new Promise((resolve) => setTimeout(resolve, 100))
        setUser(null) // Mock: no user initially
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setIsLoading(false)
      }
    }

    checkInitialSession()

    // TODO: Add auth state change listener when Supabase client is available
    // const { data: { subscription } } = supabase.auth.onAuthStateChange(
    //   async (event, session) => {
    //     setUser(session?.user ?? null)
    //     setIsLoading(false)
    //   }
    // )
    // return () => subscription.unsubscribe()
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
      if (email === 'test@example.com' && password === 'password') {
        const mockUser = {
          id: 'mock-user-id',
          email: email,
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
          role: 'authenticated',
        } as MockUser

        setUser(mockUser)
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
