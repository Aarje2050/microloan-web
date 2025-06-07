// app/dashboard/borrower/page.tsx - ENTERPRISE BORROWER DASHBOARD
'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { 
  User, CreditCard, Calendar, Receipt, AlertCircle, 
  CheckCircle, Clock, DollarSign, LogOut, Home 
} from 'lucide-react'

export default function BorrowerDashboard() {
  const router = useRouter()
  const { user, signOut, isBorrower, initialized, isAuthenticated } = useAuth()
  
  // ✅ ALL HOOKS AT TOP LEVEL
  const [isSigningOut, setIsSigningOut] = React.useState(false)
  const [redirectHandled, setRedirectHandled] = React.useState(false)

  console.log('👤 BORROWER DASHBOARD - State:', { 
    user: user?.email, 
    isBorrower, 
    initialized,
    isAuthenticated,
    redirectHandled
  })

  // ✅ SINGLE useEffect - HANDLES ALL LOGIC
  React.useEffect(() => {
    if (!initialized) return
    if (redirectHandled) return

    if (!isAuthenticated) {
      console.log('🚫 BORROWER - Not authenticated, redirecting to login')
      setRedirectHandled(true)
      router.replace('/login')
      return
    }

    if (!isBorrower) {
      console.log('🚫 BORROWER - Not borrower, redirecting to dashboard')
      setRedirectHandled(true) 
      router.replace('/dashboard')
      return
    }

    console.log('✅ BORROWER - Access granted')
  }, [initialized, isAuthenticated, isBorrower, redirectHandled, router])

  // ✅ CLEAN SIGN OUT HANDLER
  const handleSignOut = React.useCallback(async () => {
    if (isSigningOut) return
    
    console.log('🚪 BORROWER - Sign out clicked')
    setIsSigningOut(true)
    
    try {
      await signOut()
      console.log('✅ BORROWER - Sign out completed')
      setRedirectHandled(false)
      router.replace('/login')
    } catch (error) {
      console.error('❌ BORROWER - Sign out error:', error)
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
          <p className="mt-2 text-sm text-gray-600">Loading borrower dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT AUTHENTICATED STATE
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Authentication Required</h2>
          <p className="text-sm text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    )
  }

  // ✅ NOT BORROWER STATE
  if (!isBorrower) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Borrower Access Required</h2>
          <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
        </div>
      </div>
    )
  }

  // ✅ MAIN BORROWER DASHBOARD CONTENT
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <User className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
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
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center">
            <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center mr-4">
              <User className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="text-green-800 font-medium">👋 Welcome to Your Loan Portal!</h3>
              <p className="text-green-700 text-sm mt-1">
                Track your loans, view EMI schedules, and manage your account.
              </p>
            </div>
          </div>
        </div>

        {/* Loan Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Loans</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">Current loans</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Outstanding</p>
                <p className="text-2xl font-bold text-gray-900">₹0</p>
                <p className="text-xs text-gray-500">Amount pending</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Next EMI Due</p>
                <p className="text-2xl font-bold text-gray-900">--</p>
                <p className="text-xs text-gray-500">Due date</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payments Made</p>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-xs text-gray-500">This month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">My Loans</h3>
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">View all your loan details and status</p>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors">
              View Loans
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">EMI Schedule</h3>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Check your upcoming EMI payments</p>
            <button className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors">
              View Schedule
            </button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600 mb-4">Track all your past payments</p>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors">
              View History
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Payments</h3>
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent payments</p>
                <p className="text-xs text-gray-400">Your payment history will appear here</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Upcoming EMIs</h3>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-500">
                <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No upcoming EMIs</p>
                <p className="text-xs text-gray-400">Your EMI schedule will appear here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Personal Details</h4>
              <div className="space-y-2 text-sm">
                <p><strong>Name:</strong> {user?.full_name}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Account Status:</strong> 
                  <span className="ml-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    {user?.active ? 'Active' : 'Inactive'}
                  </span>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Loan Status</h4>
              <div className="space-y-2 text-sm">
                <p><strong>KYC Status:</strong> 
                  <span className="ml-1 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                    Pending
                  </span>
                </p>
                <p><strong>Credit Limit:</strong> Not Set</p>
                <p><strong>Lender:</strong> Not Assigned</p>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
              Update Profile
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <h4 className="text-green-800 font-medium mb-4">Borrower Account:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-green-700"><strong>Email:</strong> {user?.email}</p>
              <p className="text-green-700"><strong>Role:</strong> {user?.role}</p>
              <p className="text-green-700"><strong>Name:</strong> {user?.full_name}</p>
            </div>
            <div>
              <p className="text-green-700"><strong>Active:</strong> {user?.active ? 'Yes' : 'No'}</p>
              <p className="text-green-700"><strong>Verified:</strong> {user?.email_verified ? 'Yes' : 'No'}</p>
              <p className="text-green-700"><strong>Is Borrower:</strong> {isBorrower ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Development Status */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h4 className="text-yellow-800 font-medium mb-4">🚀 Borrower Features Coming Next:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-yellow-700">🔄 Detailed loan information</p>
              <p className="text-yellow-700">🔄 Interactive EMI calendar</p>
              <p className="text-yellow-700">🔄 Payment history tracking</p>
              <p className="text-yellow-700">🔄 Document upload system</p>
            </div>
            <div>
              <p className="text-yellow-700">🔄 KYC verification process</p>
              <p className="text-yellow-700">🔄 Profile management</p>
              <p className="text-yellow-700">🔄 Payment reminders</p>
              <p className="text-yellow-700">🔄 Loan statements download</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}