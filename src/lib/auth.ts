// lib/auth.ts - COMPLETE ENTERPRISE SOLUTION (Replace entire file)
import { create } from 'zustand'
import { supabase } from './supabase'
import { AuthUser, UserRole } from '@/types'

// Types
interface AuthState {
  user: AuthUser | null
  loading: boolean
  initialized: boolean
  error: string | null
}

interface AuthActions {
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<void>
  clearError: () => void
  setUser: (user: AuthUser | null) => void
}

type AuthStore = AuthState & AuthActions

// Store WITHOUT persist to avoid issues
export const useAuthStore = create<AuthStore>((set, get) => ({
  // State
  user: null,
  loading: false,
  initialized: false,
  error: null,

  // Clear error
  clearError: () => set({ error: null }),

  // Set user manually
  setUser: (user: AuthUser | null) => {
    console.log('🔄 AUTH - Setting user:', user?.email || 'null')
    set({ user })
  },

  // Initialize auth
  initialize: async () => {
    const state = get()
    if (state.initialized) {
      console.log('✅ AUTH - Already initialized')
      return
    }

    console.log('🚀 AUTH - Starting initialization...')
    set({ loading: true, error: null })

    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      console.log('📋 AUTH - Session check:', { 
        hasSession: !!session, 
        error: sessionError?.message 
      })

      if (sessionError) {
        console.error('❌ AUTH - Session error:', sessionError)
        set({ user: null, loading: false, initialized: true, error: sessionError.message })
        return
      }

      if (!session?.user) {
        console.log('🚫 AUTH - No session found')
        set({ user: null, loading: false, initialized: true })
        return
      }

      // Get user from database
      console.log('🔍 AUTH - Fetching user from database...')
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      console.log('📋 AUTH - Database user:', { 
        found: !!userData, 
        email: userData?.email,
        role: userData?.role,
        active: userData?.active,
        error: userError?.message 
      })

      if (userError || !userData) {
        console.error('❌ AUTH - User not found in database')
        set({ user: null, loading: false, initialized: true, error: 'User not found' })
        return
      }

      // Validate user
      if (!userData.active || !userData.email_verified) {
        console.error('❌ AUTH - User inactive or unverified')
        set({ 
          user: null, 
          loading: false, 
          initialized: true, 
          error: 'Account inactive or unverified' 
        })
        return
      }

      // Success - set user
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        active: userData.active,
        email_verified: userData.email_verified,
        pending_approval: userData.pending_approval || false,
      }

      console.log('✅ AUTH - Initialization successful:', authUser.email)
      set({ 
        user: authUser, 
        loading: false, 
        initialized: true, 
        error: null 
      })

    } catch (error: unknown) {
      console.error('💥 AUTH - Initialization failed:', error)
      set({ 
        user: null, 
        loading: false, 
        initialized: true, 
        error: error.message || 'Initialization failed' 
      })
    }
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    console.log('🔐 AUTH - Sign in attempt:', email)
    set({ loading: true, error: null })

    try {
      // Supabase sign in
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password
      })

      if (authError) {
        console.error('❌ AUTH - Sign in error:', authError)
        set({ loading: false, error: authError.message })
        return { error: authError }
      }

      if (!data.user) {
        console.error('❌ AUTH - No user returned')
        set({ loading: false, error: 'Sign in failed' })
        return { error: { message: 'Sign in failed' } }
      }

      // Get user from database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (userError || !userData) {
        console.error('❌ AUTH - User not found after sign in')
        await supabase.auth.signOut()
        set({ loading: false, error: 'User not found' })
        return { error: { message: 'User not found' } }
      }

      // Validate user
      if (!userData.email_verified) {
        await supabase.auth.signOut()
        set({ loading: false, error: 'Email not verified' })
        return { error: { message: 'Please verify your email' } }
      }

      if (!userData.active) {
        await supabase.auth.signOut()
        set({ loading: false, error: 'Account inactive' })
        return { error: { message: 'Account is inactive' } }
      }

      // Success
      const authUser: AuthUser = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        full_name: userData.full_name,
        active: userData.active,
        email_verified: userData.email_verified,
        pending_approval: userData.pending_approval || false,
      }

      console.log('✅ AUTH - Sign in successful:', authUser.email)
      set({ 
        user: authUser, 
        loading: false, 
        error: null 
      })

      return { error: null }

    } catch (error: unknown) {
      console.error('💥 AUTH - Sign in exception:', error)
      set({ loading: false, error: error.message })
      return { error }
    }
  },

  // Sign out
  signOut: async () => {
    console.log('🚪 AUTH - Sign out started')
    set({ loading: true })

    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('❌ AUTH - Sign out error:', error)
      } else {
        console.log('✅ AUTH - Sign out successful')
      }
      
      set({ user: null, loading: false, error: null })
    } catch (error: unknown) {
      console.error('💥 AUTH - Sign out exception:', error)
      set({ user: null, loading: false, error: null })
    }
  },
}))

// Simple hooks
export const useAuth = () => {
  const store = useAuthStore()
  return {
    user: store.user,
    loading: store.loading,
    initialized: store.initialized,
    error: store.error,
    isAuthenticated: !!store.user && store.user.active && store.user.email_verified,
    isAdmin: store.user?.role === 'super_admin',
    isLender: store.user?.role === 'lender',
    isBorrower: store.user?.role === 'borrower',
    signIn: store.signIn,
    signOut: store.signOut,
    initialize: store.initialize,
    clearError: store.clearError,
    setUser: store.setUser,
  }
}

// Utils
export const getRedirectPath = (role: UserRole): string => {
  switch (role) {
    case 'super_admin': return '/dashboard/admin'
    case 'lender': return '/dashboard/lender'  
    case 'borrower': return '/dashboard/borrower'
    default: return '/dashboard'
  }
}