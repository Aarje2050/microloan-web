// lib/auth.ts - COMPLETE ENTERPRISE ENHANCED VERSION
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
  upgradeToLender: () => Promise<{ success: boolean; error?: string }> // 🆕 NEW
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
        roles: userData?.roles,
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
        roles: userData.roles || [userData.role], // 🆕 ENHANCED: Ensure roles array exists
        full_name: userData.full_name,
        active: userData.active,
        email_verified: userData.email_verified,
        pending_approval: userData.pending_approval || false,
      }

      console.log('✅ AUTH - Initialization successful:', authUser.email, 'Roles:', authUser.roles)
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
        error: (error as Error).message || 'Initialization failed' 
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
        roles: userData.roles || [userData.role], // 🆕 ENHANCED: Ensure roles array
        full_name: userData.full_name,
        active: userData.active,
        email_verified: userData.email_verified,
        pending_approval: userData.pending_approval || false,
      }

      console.log('✅ AUTH - Sign in successful:', authUser.email, 'Roles:', authUser.roles)
      set({ 
        user: authUser, 
        loading: false, 
        error: null 
      })

      return { error: null }

    } catch (error: unknown) {
      console.error('💥 AUTH - Sign in exception:', error)
      set({ loading: false, error: (error as Error).message })
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

  // 🆕 NEW: Role upgrade function
  upgradeToLender: async () => {
    const state = get()
    if (!state.user) {
      console.error('❌ AUTH - No user logged in for role upgrade')
      return { success: false, error: 'No user logged in' }
    }

    console.log('🔄 AUTH - Upgrading user to lender:', state.user.email)
    
    try {
      // Check if user already has lender role
      const currentRoles = state.user.roles || [state.user.role]
      
      if (currentRoles.includes('lender')) {
        console.log('ℹ️ AUTH - User already has lender role')
        return { success: true }
      }

      const newRoles = [...currentRoles, 'lender']
      console.log('📝 AUTH - Updating roles from', currentRoles, 'to', newRoles)

      // Update user roles in database
      const { error } = await supabase
        .from('users')
        .update({ 
          roles: newRoles
        })
        .eq('id', state.user.id)

      if (error) {
        console.error('❌ AUTH - Database update failed:', error)
        throw error
      }
      

      // Update local state  
const updatedUser = {
  ...state.user,
  roles: newRoles.filter((role): role is UserRole => 
    ['super_admin', 'lender', 'borrower'].includes(role)
  )
}

      set({ user: updatedUser })
      console.log('✅ AUTH - Role upgrade successful, new roles:', newRoles)
      
      return { success: true }
    } catch (error: any) {
      console.error('💥 AUTH - Role upgrade failed:', error)
      return { success: false, error: error.message || 'Role upgrade failed' }
    }
  },
}))

// 🆕 ENHANCED: Hook with multi-role support
export const useAuth = () => {
  const store = useAuthStore()
  
  // Enhanced role calculations
  const userRoles = store.user?.roles || (store.user?.role ? [store.user.role] : [])
  const isLender = userRoles.includes('lender')
  const isBorrower = userRoles.includes('borrower')
  const isAdmin = store.user?.role === 'super_admin'
  
  console.log('🔍 AUTH HOOK - Role check:', {
    user: store.user?.email,
    userRoles,
    isLender,
    isBorrower,
    isAdmin
  })
  
  return {
    user: store.user,
    loading: store.loading,
    initialized: store.initialized,
    error: store.error,
    isAuthenticated: !!store.user && store.user.active && store.user.email_verified,
    isAdmin: isAdmin,
    isLender: isLender,
    isBorrower: isBorrower,
    
    // 🆕 NEW: Enhanced role checks
    isBoth: isLender && isBorrower,
    canBecomeLender: isBorrower && !isLender,
    
    signIn: store.signIn,
    signOut: store.signOut,
    initialize: store.initialize,
    clearError: store.clearError,
    setUser: store.setUser,
    
    // 🆕 NEW: Role upgrade function
    upgradeToLender: store.upgradeToLender,
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