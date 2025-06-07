// app/dashboard/page.tsx - ENTERPRISE GRADE (Rules of Hooks Fixed)
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, getRedirectPath } from '@/lib/auth'
import { CreditCard } from 'lucide-react'

export default function MainDashboard() {
  const router = useRouter()
  const { user, isAuthenticated, initialized } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL - NEVER CONDITIONAL
  const [redirectHandled, setRedirectHandled] = React.useState(false)

  console.log('🏠 MAIN DASHBOARD - State:', {
    user: user?.email,
    role: user?.role,
    isAuthenticated,
    initialized,
    redirectHandled
  })

  // ✅ SINGLE useEffect - HANDLES ALL LOGIC
  React.useEffect(() => {
    // Wait for auth initialization
    if (!initialized) {
      return
    }

    // Prevent multiple redirects
    if (redirectHandled) {
      return
    }

    // Handle authentication and role-based redirects
    if (!isAuthenticated) {
      console.log('🚫 MAIN DASHBOARD - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (user) {
      console.log('🔄 MAIN DASHBOARD - Redirecting based on role:', user.role)
      setRedirectHandled(true)
      const redirectPath = getRedirectPath(user.role)
      router.replace(redirectPath)
    }
  }, [initialized, isAuthenticated, user, redirectHandled, router])

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
          <p className="text-sm text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ REDIRECTING STATE
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
          <CreditCard className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-gray-900">MicroLoan Manager</h2>
          <p className="text-sm text-gray-600">
            {user ? `Redirecting to ${user.role} dashboard...` : 'Redirecting...'}
          </p>
        </div>
      </div>
    </div>
  )
}