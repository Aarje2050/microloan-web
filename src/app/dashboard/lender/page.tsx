// app/dashboard/lender/page.tsx - ENTERPRISE LENDER DASHBOARD
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  Briefcase, Users, CreditCard, DollarSign, Plus, 
  Clock, AlertTriangle, TrendingUp, LogOut, Home 
} from 'lucide-react'

export default function LenderDashboard() {
  const router = useRouter()
  const { user, signOut, isLender, initialized, isAuthenticated } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [redirectHandled, setRedirectHandled] = React.useState(false)

  console.log('💼 LENDER DASHBOARD - State:', { 
    user: user?.email, 
    isLender, 
    initialized,
    isAuthenticated,
    redirectHandled
  })

  // ✅ SINGLE useEffect - HANDLES ALL LOGIC
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 LENDER - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isLender) {
      console.log('🚫 LENDER - Not lender, redirecting to dashboard')
      setRedirectHandled(true) 
      router.replace('/dashboard')
      return
    }

    console.log('✅ LENDER - Access granted')
  }, [initialized, isAuthenticated, isLender, redirectHandled, router])

  // ✅ CLEAN SIGN OUT HANDLER
  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return
    
    console.log('🚪 LENDER - Sign out clicked')
    setIsSigningOut(true)
    
    try {
      await signOut()
      console.log('✅ LENDER - Sign out completed')
      setRedirectHandled(false)
      router.replace('/login')
    } catch (error) {
      console.error('❌ LENDER - Sign out error:', error)
      setRedirectHandled(false)
      router.replace('/login')
    }
  }, [isSigningOut, signOut, router])

  // ✅ LOADING STATE
  if (!initialized) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading lender dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT LENDER STATE
  if (!isLender) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Briefcase className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Lender Access Required</h2>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ MAIN LENDER DASHBOARD CONTENT
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Lender Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.full_name || user?.email}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="inline-flex items-center text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </button>
              
              <button
                onClick={handleSignOut}
                disabled={isSigningOut}
                className="inline-flex items-center bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? 'Signing Out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-4">
              <Briefcase className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-blue-800 font-medium">🎯 Lender Portal Active!</h3>
              <p className="text-blue-700 text-sm mt-1">
                Manage your borrower portfolio, create loans, and track collections.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">My Borrowers</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Active borrowers</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Loans disbursed</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                <p className="text-2xl font-bold text-gray-900">₹0</p>
                <p className="text-xs text-gray-500">Total outstanding</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold text-gray-900">0%</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add New Borrower</h3>
              <Plus className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Register a new borrower and complete KYC verification</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              Add Borrower
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New Loan</h3>
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Issue a new loan to an existing borrower</p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              Create Loan
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Record Payment</h3>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Record EMI payments and update loan status</p>
            <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors">
              Record Payment
            </button>
          </div>
        </div>

        {/* Today's Collections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Today's Collections</h3>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No collections scheduled for today</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Overdue Loans</h3>
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No overdue loans</p>
              </div>
            </div>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h4 className="text-blue-800 font-medium mb-4">Lender Account:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700"><strong>Email:</strong> {user?.email}</p>
              <p className="text-blue-700"><strong>Role:</strong> {user?.role}</p>
              <p className="text-blue-700"><strong>Name:</strong> {user?.full_name}</p>
            </div>
            <div>
              <p className="text-blue-700"><strong>Active:</strong> {user?.active ? 'Yes' : 'No'}</p>
              <p className="text-blue-700"><strong>Verified:</strong> {user?.email_verified ? 'Yes' : 'No'}</p>
              <p className="text-blue-700"><strong>Is Lender:</strong> {isLender ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-yellow-800 font-medium mb-4">🚀 Lender Features Coming Next:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-yellow-700">🔄 Borrower management system</p>
              <p className="text-yellow-700">🔄 Loan creation workflow</p>
              <p className="text-yellow-700">🔄 EMI schedule generator</p>
              <p className="text-yellow-700">🔄 Payment recording system</p>
            </div>
            <div>
              <p className="text-yellow-700">🔄 Collection route planning</p>
              <p className="text-yellow-700">🔄 Portfolio analytics</p>
              <p className="text-yellow-700">🔄 Overdue tracking</p>
              <p className="text-yellow-700">🔄 Report generation</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}