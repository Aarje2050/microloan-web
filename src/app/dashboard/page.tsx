// app/dashboard/page.tsx - COMPLETE ENTERPRISE ENHANCED VERSION
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, getRedirectPath } from '@/lib/auth'
import { CreditCard, User, Briefcase, ArrowRight } from 'lucide-react'

export default function MainDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, initialized, isBoth, isLender, isBorrower } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL - NEVER CONDITIONAL
  const [redirectHandled, setRedirectHandled] = React.useState(false)
  const [showRoleChoice, setShowRoleChoice] = React.useState(false)

  console.log('🏠 MAIN DASHBOARD - State:', {
    user: user?.email,
    role: user?.role,
    roles: user?.roles,
    isAuthenticated,
    initialized,
    isBoth,
    isLender,
    isBorrower,
    redirectHandled,
    showRoleChoice
  })

  // ✅ ENHANCED: Handle authentication and role-based routing
  React.useEffect(() => {
    // Wait for auth initialization
    if (!initialized) {
      console.log('⏳ MAIN DASHBOARD - Waiting for auth initialization...')
      return
    }

    // Prevent multiple redirects
    if (redirectHandled) {
      console.log('🔒 MAIN DASHBOARD - Redirect already handled')
      return
    }

    // Handle authentication
    if (!isAuthenticated) {
      console.log('🚫 MAIN DASHBOARD - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    // Handle role-based routing
    if (user) {
      console.log('🔄 MAIN DASHBOARD - Processing user roles:', user.roles || [user.role])
      
      // 🆕 ENHANCED: Handle dual roles
      if (isBoth) {
        console.log('👥 MAIN DASHBOARD - User has both roles, showing choice screen')
        setShowRoleChoice(true)
        setRedirectHandled(true)
      } else if (isLender) {
        console.log('💼 MAIN DASHBOARD - Lender only, redirecting to lender dashboard')
        setRedirectHandled(true)
        router.replace('/dashboard/lender')
      } else if (isBorrower) {
        console.log('👤 MAIN DASHBOARD - Borrower only, redirecting to borrower dashboard')
        setRedirectHandled(true)
        router.replace('/dashboard/borrower')
      } else {
        // Fallback to role-based redirect
        console.log('📍 MAIN DASHBOARD - Using role-based redirect for:', user.role)
        setRedirectHandled(true)
        const redirectPath = getRedirectPath(user.role)
        router.replace(redirectPath)
      }
    }
  }, [initialized, isAuthenticated, user, redirectHandled, router, isBoth, isLender, isBorrower])

  // Handle role choice selection
  const handleRoleChoice = React.useCallback((choice: 'borrower' | 'lender') => {
    console.log('🎯 MAIN DASHBOARD - User chose role:', choice)
    setRedirectHandled(true)
    
    if (choice === 'borrower') {
      router.replace('/dashboard/borrower')
    } else {
      router.replace('/dashboard/lender')
    }
  }, [router])

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">MicroLoan Manager</h2>
            <p className="text-sm text-gray-600">Initializing dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ ENHANCED: Role choice screen for dual-role users
  if (showRoleChoice && isBoth && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-lg w-full mx-4">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="h-16 w-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back!</h1>
            <p className="text-gray-600">
              Hi <span className="font-medium">{user?.full_name || user?.email}</span>, 
              you have access to both borrower and lender features.
            </p>
            <p className="text-sm text-gray-500 mt-2">Choose which dashboard to view:</p>
          </div>
          
          {/* Role Choice Cards */}
          <div className="space-y-4 mb-6">
            <button
              onClick={() => handleRoleChoice('borrower')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-blue-200 transition-colors">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Borrower Dashboard</h3>
                    <p className="text-sm text-gray-600">View your loans, EMI schedule, and payment history</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
            
            <button
              onClick={() => handleRoleChoice('lender')}
              className="w-full p-6 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all duration-200 text-left group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                    <Briefcase className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Lender Dashboard</h3>
                    <p className="text-sm text-gray-600">Manage borrowers, create loans, and track payments</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
              </div>
            </button>
          </div>
          
          {/* Footer Info */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              💡 <strong>Tip:</strong> You can switch between views anytime using the header buttons
            </p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-red-600 rounded-xl flex items-center justify-center mx-auto">
            <User className="h-6 w-6 text-white" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
            <p className="text-sm text-gray-600">Redirecting to login...</p>
          </div>
        </div>
      </div>
    )
  }

  // ✅ DEFAULT: Redirecting state for single-role users
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">MicroLoan Manager</h2>
          <p className="text-sm text-gray-600">
            {user ? (
              <>
                Redirecting to {isLender ? 'lender' : isBorrower ? 'borrower' : user.role} dashboard...
              </>
            ) : (
              'Processing authentication...'
            )}
          </p>
        </div>
      </div>
      </div>
    )
    
}