import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('🔧 SUPABASE - Environment check:', {
  url: supabaseUrl ? 'SET' : 'MISSING',
  key: supabaseAnonKey ? 'SET' : 'MISSING'
})

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'microloan-web-app@1.0.0',
    },
  },
})

console.log('✅ SUPABASE - Client created successfully')

// FIXED: Simple getCurrentUser function
export const getCurrentUser = async () => {
  try {
    console.log('🔍 SUPABASE - Getting current session...')
    
    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    console.log('📋 SUPABASE - Session result:', {
      hasSession: !!session,
      userId: session?.user?.id,
      error: sessionError?.message
    })
    
    if (sessionError) {
      console.error('❌ SUPABASE - Session error:', sessionError.message)
      return { user: null, error: sessionError }
    }
    
    if (!session?.user) {
      console.log('🚫 SUPABASE - No session found')
      return { user: null, error: null }
    }

    console.log('🔍 SUPABASE - Fetching user from database...')
    
    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    console.log('📋 SUPABASE - Database user result:', {
      found: !!userData,
      email: userData?.email,
      role: userData?.role,
      active: userData?.active,
      verified: userData?.email_verified,
      error: userError?.message
    })

    if (userError) {
      console.error('❌ SUPABASE - User query error:', userError.message)
      return { user: null, error: userError }
    }

    if (!userData) {
      console.error('❌ SUPABASE - User not found in database')
      return { user: null, error: { message: 'User not found in database' } }
    }

    // Return the combined user data
    const user = {
      ...session.user,
      role: userData.role,
      full_name: userData.full_name,
      phone: userData.phone,
      active: userData.active,
      email_verified: userData.email_verified,
      pending_approval: userData.pending_approval || false,
    }

    console.log('✅ SUPABASE - User data combined successfully:', user.email)
    return { user, error: null }

  } catch (error: any) {
    console.error('💥 SUPABASE - getCurrentUser unexpected error:', error)
    return { user: null, error: { message: error.message || 'Unexpected error' } }
  }
}

// Other helper functions
export const signOut = async () => {
  console.log('🚪 SUPABASE - Signing out...')
  const { error } = await supabase.auth.signOut()
  console.log('📋 SUPABASE - Sign out result:', { error: error?.message })
  return { error }
}

export default supabase